import type { Element, ElementContent, Root, RootContent, Text } from 'hast'

/**
 * Pre-processing for the Markdown view (`htmlToMarkdown.ts`): picks the page's
 * content out of a server-rendered document and strips what only works as UI,
 * so what reaches the Markdown converter reads like the page does.
 *
 * Rules are generic — landmarks, ARIA, HTML semantics, Tailwind display
 * utilities — rather than per page, so new pages come out right without edits
 * here. Where a page lost meaning, the fix went into its markup as an a11y fix
 * (an `sr-only` label, a heading around an accordion toggle), which helps
 * screen readers the same way.
 */

/** Never content. `footer` is the site footer inside `<main>`. */
const DROP_TAGS = new Set([
  'area', 'audio', 'canvas', 'datalist', 'dialog', 'embed', 'footer', 'form', 'head', 'iframe',
  'input', 'label', 'link', 'map', 'meta', 'noscript', 'object', 'optgroup', 'option', 'script',
  'select', 'source', 'style', 'svg', 'template', 'textarea', 'track', 'video',
])

/** Widgets: their text is control labels, not page content. */
const DROP_ROLES = new Set([
  'alertdialog', 'button', 'combobox', 'dialog', 'listbox', 'menu', 'menubar', 'search',
  'slider', 'switch', 'tablist', 'toolbar', 'tooltip',
])

/** Landmarks stripped as site chrome when there is no `<main>` to read. */
const CHROME_TAGS = new Set(['aside', 'footer', 'header', 'nav'])

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

/** Elements whose presence inside a link makes it a card rather than inline text. */
const BLOCK_TAGS = new Set([
  'article', 'blockquote', 'dl', 'div', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header',
  'li', 'ol', 'p', 'section', 'table', 'ul',
])

// ---------------------------------------------------------------------------
// Tailwind display at desktop width

/** The viewport the Markdown view "renders" at: desktop, where nothing collapses. */
const VIEWPORT = 1280
const BREAKPOINTS: Record<string, number> = { 'sm': 640, 'md': 768, 'lg': 1024, 'xl': 1280, '2xl': 1536 }

const DISPLAY_UTILITIES = new Set([
  'hidden', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid',
  'contents', 'flow-root', 'list-item', 'table', 'inline-table', 'table-caption', 'table-cell',
  'table-column', 'table-column-group', 'table-footer-group', 'table-header-group',
  'table-row-group', 'table-row',
])
const VISIBILITY_UTILITIES = new Set(['visible', 'invisible', 'collapse'])

/**
 * How much a variant chain outranks the bare utility, or `null` when it doesn't
 * apply at the desktop viewport. State variants (`hover:`, `group-*`, `aria-*`,
 * `print:`…) never apply: the view is the page at rest.
 */
function variantRank(variants: string[]): number | null {
  let rank = 0
  for (const variant of variants) {
    const min = BREAKPOINTS[variant] ?? Number(/^min-\[(\d+)px\]$/.exec(variant)?.[1] ?? Number.NaN)
    if (Number.isFinite(min)) {
      if (VIEWPORT < min) return null
      rank = Math.max(rank, 10 + min / 1000)
      continue
    }
    const maxName = /^max-(.+)$/.exec(variant)?.[1]
    if (maxName) {
      const max = BREAKPOINTS[maxName] ?? Number(/^\[(\d+)px\]$/.exec(maxName)?.[1] ?? Number.NaN)
      if (!Number.isFinite(max) || VIEWPORT >= max) return null
      rank = Math.max(rank, 5)
      continue
    }
    // Container queries: assume the container is as wide as it gets.
    if (variant.startsWith('@') && !variant.startsWith('@max-')) {
      rank = Math.max(rank, 20)
      continue
    }
    return null
  }
  return rank
}

/** The utility from `set` that wins at the desktop viewport, if any applies. */
function resolveUtility(classNames: readonly string[], set: Set<string>): string | null {
  let winner: string | null = null
  let best = -1
  for (const cls of classNames) {
    const parts = cls.split(':')
    // Tailwind's important modifier: `hidden!` (v4) or `!hidden` (v3).
    const utility = parts.pop()!.replace(/^!|!$/g, '')
    if (!set.has(utility)) continue
    const rank = variantRank(parts)
    if (rank === null || rank < best) continue
    winner = utility
    best = rank
  }
  return winner
}

function classList(element: Element): string[] {
  const value = element.properties.className
  if (Array.isArray(value)) return value.map(String)
  return value == null ? [] : String(value).split(/\s+/)
}

/** The Tailwind display an element has at desktop width, or `null` when it sets none. */
export function desktopDisplay(classNames: readonly string[]): string | null {
  return resolveUtility(classNames, DISPLAY_UTILITIES)
}

/** Whether Tailwind's display/visibility utilities leave an element shown at desktop width. */
export function visibleAtDesktop(classNames: readonly string[]): boolean {
  if (classNames.includes('sr-only')) return true
  if (desktopDisplay(classNames) === 'hidden') return false
  const visibility = resolveUtility(classNames, VISIBILITY_UTILITIES)
  return visibility !== 'invisible' && visibility !== 'collapse'
}

// ---------------------------------------------------------------------------
// Helpers

function isElement(node: RootContent | ElementContent | Root | undefined): node is Element {
  return node?.type === 'element'
}

function text(value: string): Text {
  return { type: 'text', value }
}

function prop(element: Element, name: string): string | undefined {
  const value = element.properties[name]
  if (value === undefined || value === null || value === false) return undefined
  return Array.isArray(value) ? value.join(' ') : String(value)
}

function roles(element: Element): string[] {
  return (prop(element, 'role') ?? '').toLowerCase().split(/\s+/).filter(Boolean)
}

function isHiddenByAttributes(element: Element): boolean {
  if (element.properties.hidden !== undefined && element.properties.hidden !== false) return true
  // `true` as parsed (a booleanish attribute) or as a string, depending on the source.
  if (String(element.properties.ariaHidden) === 'true') return true
  const style = prop(element, 'style')?.replace(/\s+/g, '').toLowerCase()
  return !!style && (/(^|;)display:none/.test(style) || /(^|;)visibility:hidden/.test(style))
}

/** Concatenated text of a node, whitespace collapsed. */
export function textOf(node: Element | ElementContent | Root): string {
  let out = ''
  const walk = (n: Element | ElementContent | Root) => {
    if (n.type === 'text') out += n.value
    else if ('children' in n) for (const child of n.children) walk(child as ElementContent)
  }
  walk(node)
  return out.replace(/\s+/g, ' ').trim()
}

function hasImage(node: Element): boolean {
  return node.children.some(child => isElement(child) && (child.tagName === 'img' || hasImage(child)))
}

function findFirst(node: Element | Root, test: (element: Element) => boolean): Element | undefined {
  for (const child of node.children) {
    if (!isElement(child)) continue
    if (test(child)) return child
    const found = findFirst(child, test)
    if (found) return found
  }
  return undefined
}

function some(node: Element, test: (element: Element) => boolean): boolean {
  return !!findFirst(node, test)
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

// ---------------------------------------------------------------------------
// Pass 1: what is content

interface CleanContext {
  /** No `<main>`: also strip header/nav/aside/footer like Cloudflare does. */
  chrome: boolean
  inHeading: boolean
}

/** The site's own language switcher: links to the same page in other locales. */
function isLanguageNav(element: Element): boolean {
  return some(element, el => el.tagName === 'a' && prop(el, 'hrefLang') !== undefined)
}

/** An in-page table of contents: every link is a `#fragment`. */
function isFragmentNav(element: Element): boolean {
  let links = 0
  let fragments = 0
  const walk = (el: Element) => {
    for (const child of el.children) {
      if (!isElement(child)) continue
      if (child.tagName === 'a') {
        links++
        if (prop(child, 'href')?.startsWith('#')) fragments++
      }
      walk(child)
    }
  }
  walk(element)
  return links > 0 && links === fragments
}

function cleanChildren(children: ElementContent[], ctx: CleanContext): ElementContent[] {
  return children.flatMap(child => clean(child, ctx))
}

function clean(node: ElementContent, ctx: CleanContext): ElementContent[] {
  if (node.type === 'comment') return []
  if (node.type !== 'element') return [node]

  const tag = node.tagName
  const nodeRoles = roles(node)
  const label = prop(node, 'ariaLabel')?.trim()

  if (isHiddenByAttributes(node) || !visibleAtDesktop(classList(node))) return []
  // An image drawn in markup (an SVG chart, a glyph row) is its accessible name.
  if (nodeRoles.includes('img')) return label ? [text(` ${label} `)] : []
  if (DROP_TAGS.has(tag)) return []
  if (ctx.chrome && CHROME_TAGS.has(tag)) return []
  if (prop(node, 'id') === 'teleports') return []
  // A toggle inside a heading (an accordion) carries the heading's text.
  if (tag === 'button') return ctx.inHeading ? cleanChildren(node.children, ctx) : []
  if (nodeRoles.some(role => DROP_ROLES.has(role))) return []
  if (tag === 'nav' && (isLanguageNav(node) || isFragmentNav(node))) return []

  delete node.properties.title

  if (tag === 'img') {
    const src = prop(node, 'src')
    if (!prop(node, 'alt')?.trim() || !src || src.startsWith('data:')) return []
    return [node]
  }

  const heading = HEADINGS.has(tag)
  node.children = cleanChildren(node.children, heading ? { ...ctx, inHeading: true } : ctx)

  if (heading && label && !textOf(node)) node.children = [text(label)]

  if (tag === 'a') {
    const href = prop(node, 'href')?.trim()
    // Not a destination: keep the words, lose the link.
    if (!href || href.startsWith('#') || /^javascript:/i.test(href)) return node.children
  }
  return [node]
}

// ---------------------------------------------------------------------------
// Pass 2: redundant images

/**
 * Drops images whose alt text is already written next to them (a trophy icon
 * beside its name, a cover beside the title, an avatar beside the PSN ID):
 * in Markdown they would only repeat the text with a long URL attached.
 */
function dropRedundantImages(root: Element) {
  const texts = new WeakMap<Element, string>()
  const textFor = (element: Element) => {
    let value = texts.get(element)
    if (value === undefined) {
      value = normalize(textOf(element))
      texts.set(element, value)
    }
    return value
  }
  const walk = (element: Element, ancestors: Element[]) => {
    element.children = element.children.filter((child) => {
      if (!isElement(child)) return true
      if (child.tagName === 'img') {
        const alt = normalize(prop(child, 'alt') ?? '')
        const near = [element, ...ancestors].slice(0, 4)
        return !near.some(ancestor => textFor(ancestor).includes(alt))
      }
      walk(child, [element, ...ancestors])
      return true
    })
  }
  walk(root, [])
}

// ---------------------------------------------------------------------------
// Pass 3: links and separators (bottom-up)

/**
 * A card — a link wrapping a whole block of content — becomes one link on its
 * title (first heading, else first paragraph) followed by the card's other
 * text, instead of the same link repeated around every line of the card.
 */
function relinkCard(link: Element): ElementContent[] {
  const target = findFirst(link, el => HEADINGS.has(el.tagName))
    ?? findFirst(link, el => el.tagName === 'p')
    ?? findFirst(link, el => !el.children.some(child => isElement(child) && BLOCK_TAGS.has(child.tagName)) && !!textOf(el))
  if (!target) return [link]
  target.children = [{
    type: 'element',
    tagName: 'a',
    properties: { href: link.properties.href },
    children: target.children,
  }]
  return link.children
}

const SPACED_PARENT = new Set(['flex', 'inline-flex', 'grid', 'inline-grid'])
const BLOCK_DISPLAY = new Set(['block', 'flex', 'grid', 'flow-root', 'list-item', 'table'])

function startsOrEndsSpaced(node: ElementContent, side: 'start' | 'end'): boolean {
  if (node.type !== 'text') return false
  return side === 'start' ? /^\s/.test(node.value) : /\s$/.test(node.value)
}

/**
 * Where CSS lays siblings out apart (flex/grid gaps, block utilities on spans),
 * the HTML has no whitespace between them and their text would run together:
 * `PSN` + `0.1%` → "PSN0.1%". A space between them reads as the page does.
 */
function separate(element: Element) {
  if (element.children.length < 2) return
  const parentSpaced = SPACED_PARENT.has(desktopDisplay(classList(element)) ?? '')
  const blockish = (node: ElementContent) => isElement(node) && BLOCK_DISPLAY.has(desktopDisplay(classList(node)) ?? '')
  const out: ElementContent[] = [element.children[0]!]
  for (let i = 1; i < element.children.length; i++) {
    const prev = element.children[i - 1]!
    const next = element.children[i]!
    if ((parentSpaced || blockish(prev) || blockish(next))
      && !startsOrEndsSpaced(prev, 'end') && !startsOrEndsSpaced(next, 'start')) {
      out.push(text(' '))
    }
    out.push(next)
  }
  element.children = out
}

/** Structure that must survive without text: table cells hold columns in place. */
const KEEP_EMPTY = new Set(['br', 'hr', 'img', 'td', 'th', 'tr', 'wbr'])

function finish(element: Element, inPre: boolean) {
  const pre = inPre || element.tagName === 'pre' || element.tagName === 'code'
  element.children = element.children.flatMap((child): ElementContent[] => {
    if (!isElement(child)) return [child]
    finish(child, pre)
    // Dividers, emptied icon wrappers: as blocks they'd also swallow the
    // separating spaces around them.
    if (!KEEP_EMPTY.has(child.tagName) && child.tagName !== 'a' && !textOf(child) && !hasImage(child)) return []
    if (child.tagName !== 'a') return [child]
    if (!textOf(child) && !hasImage(child)) {
      const label = prop(child, 'ariaLabel')?.trim()
      if (!label) return []
      child.children = [text(label)]
      return [child]
    }
    if (some(child, el => BLOCK_TAGS.has(el.tagName))) return relinkCard(child)
    return [child]
  })
  if (!pre) separate(element)
}

// ---------------------------------------------------------------------------

/**
 * The content of a parsed document, cleaned for conversion: `<main>` (or
 * `[role=main]`, or `<body>` without its site chrome), or `null` when the
 * document has none of them. Mutates the tree.
 */
export function pruneToContent(tree: Root): Element | null {
  const main = findFirst(tree, el => el.tagName === 'main')
    ?? findFirst(tree, el => roles(el).includes('main'))
  const body = main ? undefined : findFirst(tree, el => el.tagName === 'body')
  const root = main ?? body
  if (!root) return null

  const ctx: CleanContext = { chrome: !main, inHeading: false }
  root.children = cleanChildren(root.children, ctx)
  dropRedundantImages(root)
  finish(root, false)
  return root
}
