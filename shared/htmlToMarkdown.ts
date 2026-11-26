import type { Element, ElementContent, Root } from 'hast'
import type { List, ListItem, Nodes as MdastNodes, PhrasingContent, Root as MdastRoot } from 'mdast'
import { fromHtml } from 'hast-util-from-html'
import { toMdast, type Handle, type State } from 'hast-util-to-mdast'
import { gfmToMarkdown } from 'mdast-util-gfm'
import { toMarkdown } from 'mdast-util-to-markdown'
import { visit } from 'unist-util-visit'
import { pruneToContent, textOf } from './htmlPrune'
import { isConvertiblePath, toMarkdownUrl } from './markdownAgents'

/**
 * A server-rendered page as Markdown, the body of the Markdown view (see
 * `markdownAgents.ts`). Same output layout as Cloudflare's converter:
 *
 *   1. YAML front matter from the page's meta (fields only when present),
 *   2. the page content (`htmlPrune.ts` decides what that is),
 *   3. the page's JSON-LD, one object per line in a single ```json block.
 *
 * Server-only: this pulls in parse5 and the mdast serializer, so the Nitro
 * plugin imports it lazily.
 */

export interface MarkdownMeta {
  title?: string
  description?: string
  image?: string
  /** Canonical URL. */
  url?: string
  lang?: string
  /** The page's `<meta name="robots">`, for the response's X-Robots-Tag. */
  robots?: string
}

export interface HtmlToMarkdownOptions {
  /** Absolute site origin (`https://psray.net`) that relative links resolve against. */
  siteUrl: string
  /** Absolute URL of the page itself. */
  pageUrl: string
  /**
   * `canonical` keeps links as they are on the site; `suffix` (a `.md` request)
   * points same-site page links at their `.md` form, so a client without
   * header control can keep reading Markdown.
   */
  linkStyle: 'canonical' | 'suffix'
}

function prop(element: Element, name: string): string | undefined {
  const value = element.properties[name]
  if (value === undefined || value === null || value === false) return undefined
  return Array.isArray(value) ? value.join(' ') : String(value)
}

function extractMeta(tree: Root): MarkdownMeta {
  const named = new Map<string, string>()
  let title: string | undefined
  let canonical: string | undefined
  let lang: string | undefined
  visit(tree, 'element', (element) => {
    switch (element.tagName) {
      case 'html':
        lang = prop(element, 'lang')
        break
      case 'title':
        title ??= textOf(element)
        break
      case 'meta': {
        const name = (prop(element, 'name') ?? prop(element, 'property'))?.toLowerCase()
        const content = prop(element, 'content')?.trim()
        if (name && content && !named.has(name)) named.set(name, content)
        break
      }
      case 'link': {
        const rel = element.properties.rel
        if (Array.isArray(rel) ? rel.includes('canonical') : rel === 'canonical') canonical ??= prop(element, 'href')
        break
      }
    }
  })
  return {
    title: named.get('og:title') || title || undefined,
    description: named.get('description') || named.get('og:description'),
    image: named.get('og:image'),
    url: canonical || named.get('og:url'),
    lang,
    robots: named.get('robots'),
  }
}

/** Every JSON-LD block, compacted to one line each. */
function extractJsonLd(tree: Root): string[] {
  const blocks: string[] = []
  visit(tree, 'element', (element) => {
    if (element.tagName !== 'script' || prop(element, 'type')?.toLowerCase() !== 'application/ld+json') return
    const raw = element.children.map(child => (child.type === 'text' ? child.value : '')).join('').trim()
    if (!raw) return
    try {
      blocks.push(JSON.stringify(JSON.parse(raw)))
    }
    catch {
      blocks.push(raw.replace(/\s+/g, ' '))
    }
  })
  return blocks
}

// ---------------------------------------------------------------------------
// <dl>

const BLOCK_TEXT_TAGS = new Set(['dd', 'div', 'dt', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'p', 'section'])

/** Text with block boundaries as spaces, leaving out `<dd>` subtrees. */
function labelText(node: Element): string {
  let out = ''
  const walk = (n: ElementContent) => {
    if (n.type === 'text') out += n.value
    if (n.type !== 'element' || n.tagName === 'dd') return
    const block = BLOCK_TEXT_TAGS.has(n.tagName)
    if (block) out += ' '
    n.children.forEach(walk)
    if (block) out += ' '
  }
  node.children.forEach(walk)
  return out.replace(/\s+/g, ' ').trim()
}

/** `<dd>`s inside a group wrapper, not descending into a nested list. */
function descendantDefinitions(node: Element): Element[] {
  const found: Element[] = []
  for (const child of node.children) {
    if (child.type !== 'element' || child.tagName === 'dl') continue
    if (child.tagName === 'dd') found.push(child)
    else found.push(...descendantDefinitions(child))
  }
  return found
}

const PHRASING = new Set(['break', 'delete', 'emphasis', 'html', 'image', 'inlineCode', 'link', 'strong', 'text'])

/** A `<dd>`'s content as inline Markdown, keeping its links and emphasis. */
function inline(state: State, element: Element): PhrasingContent[] {
  const out: PhrasingContent[] = []
  const add = (nodes: MdastNodes[]) => {
    for (const node of nodes) {
      if (PHRASING.has(node.type)) {
        out.push(node as PhrasingContent)
      }
      else if ('children' in node) {
        if (out.length) out.push({ type: 'text', value: ' ' })
        add(node.children as MdastNodes[])
      }
    }
  }
  add(state.all(element) as MdastNodes[])
  return out
}

/**
 * Description lists as `- term: value` items. The default handler only reads
 * `dt`/`dd` as direct children (or one `div` deep); the site wraps each group
 * in layout elements, with a caption beside the term (`<div><dt>…</dt><p>…</p></div><dd>…</dd>`).
 */
const dl: Handle = (state, node) => {
  const items: ListItem[] = []
  const push = (label: string, definitions: Element[]) => {
    const children: PhrasingContent[] = []
    if (label) children.push({ type: 'text', value: definitions.length ? `${label}: ` : label })
    definitions.forEach((definition, index) => {
      if (index) children.push({ type: 'text', value: ', ' })
      children.push(...inline(state, definition))
    })
    if (children.length) items.push({ type: 'listItem', spread: false, children: [{ type: 'paragraph', children }] })
  }

  let terms: string[] = []
  let definitions: Element[] = []
  const flush = () => {
    if (terms.length || definitions.length) push(terms.join(' / '), definitions)
    terms = []
    definitions = []
  }
  for (const child of node.children) {
    if (child.type !== 'element') continue
    if (child.tagName === 'dt') {
      if (definitions.length) flush()
      terms.push(labelText(child))
    }
    else if (child.tagName === 'dd') {
      definitions.push(child)
    }
    else {
      flush()
      push(labelText(child), descendantDefinitions(child))
    }
  }
  flush()

  if (!items.length) return undefined
  const list: List = { type: 'list', ordered: false, spread: false, children: items }
  return list
}

// ---------------------------------------------------------------------------

function rewriteUrls(tree: MdastRoot, options: HtmlToMarkdownOptions) {
  const site = new URL(options.siteUrl)
  visit(tree, (node) => {
    if (node.type !== 'link' && node.type !== 'image') return
    let url: URL
    try {
      url = new URL(node.url, options.pageUrl)
    }
    catch {
      return
    }
    node.url = node.type === 'link' && options.linkStyle === 'suffix'
      && url.origin === site.origin && isConvertiblePath(url.pathname)
      ? toMarkdownUrl(url.href)
      : url.href
  })
}

/** A YAML double-quoted scalar; JSON string syntax is a subset of it. */
function yamlString(value: string): string {
  return JSON.stringify(value).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}

function absolute(value: string | undefined, base: string): string | undefined {
  if (!value) return undefined
  try {
    return new URL(value, base).href
  }
  catch {
    return value
  }
}

function frontMatter(meta: MarkdownMeta, pageUrl: string): string {
  const fields: [string, string | undefined][] = [
    ['title', meta.title],
    ['description', meta.description],
    ['image', absolute(meta.image, pageUrl)],
    ['url', absolute(meta.url, pageUrl)],
    ['lang', meta.lang],
  ]
  const lines = fields
    .filter((field): field is [string, string] => !!field[1]?.trim())
    .map(([key, value]) => `${key}: ${yamlString(value.trim())}`)
  return lines.length ? `---\n${lines.join('\n')}\n---` : ''
}

/**
 * Cut what pruning would drop anyway before parsing it: the Nuxt payload and
 * other scripts (JSON-LD stays), styles, and icon SVGs (`role="img"` ones carry
 * a label and stay). Roughly halves the parse on a trophy page.
 */
function preStrip(html: string): string {
  return html
    .replace(/<script\b(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<svg\b(?![^>]*\brole="img")[^>]*>[\s\S]*?<\/svg>/gi, '')
}

export function htmlToMarkdown(html: string, options: HtmlToMarkdownOptions): { markdown: string, meta: MarkdownMeta } {
  const tree = fromHtml(preStrip(html))
  // Read before pruning, which drops <head> and scripts.
  const meta = extractMeta(tree)
  const jsonLd = extractJsonLd(tree)

  let body = ''
  const content = pruneToContent(tree)
  if (content) {
    const mdast = toMdast({ type: 'root', children: [content] }, { handlers: { dl } }) as MdastRoot
    rewriteUrls(mdast, options)
    body = toMarkdown(mdast, {
      bullet: '-',
      // `*`, not `_`: underscores don't work inside a word, so CJK text next to
      // emphasis would come out as character references.
      emphasis: '*',
      extensions: [gfmToMarkdown({ tablePipeAlign: false })],
      fences: true,
      listItemIndent: 'one',
      rule: '-',
    }).trim()
  }

  const parts = [frontMatter(meta, options.pageUrl), body]
  if (jsonLd.length) parts.push(`\`\`\`json\n${jsonLd.join('\n')}\n\`\`\``)
  return { markdown: `${parts.filter(Boolean).join('\n\n')}\n`, meta }
}
