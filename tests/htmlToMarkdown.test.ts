import { describe, expect, it } from 'vitest'
import { visibleAtDesktop } from '#shared/htmlPrune'
import { htmlToMarkdown, type HtmlToMarkdownOptions } from '#shared/htmlToMarkdown'

const SITE = 'https://psray.net'

/** A document shaped like the default layout: top bar, sidebar, then <main>. */
function page(main: string, { head = '', after = '' } = {}) {
  return `<!DOCTYPE html><html lang="ja-JP"><head><title>Page | PSRay</title>${head}</head><body>`
    + '<div id="__nuxt"><header><a href="/">PSRay</a><button>Menu</button></header>'
    + '<aside><nav><a href="/trophies">トロフィー</a></nav></aside>'
    + `<main><div>${main}</div><footer><nav><a href="/about">About</a></nav><p>© 2026 PSRay</p></footer></main>`
    + `</div>${after}<script type="application/json" id="__NUXT_DATA__">[{"a":1}]</script></body></html>`
}

function body(html: string, options: Partial<HtmlToMarkdownOptions> = {}) {
  const { markdown } = htmlToMarkdown(page(html), { siteUrl: SITE, pageUrl: `${SITE}/x`, linkStyle: 'canonical', ...options })
  return markdown.replace(/^---\n[\s\S]*?\n---\n\n/, '').trim()
}

describe('front matter and JSON-LD', () => {
  it('reads the meta tags, preferring og:title and leaving out empty fields', () => {
    const { markdown, meta } = htmlToMarkdown(page('<h1>Hi</h1>', {
      head: '<meta property="og:title" content="Og &quot;title&quot;: \\ yes"><meta name="description" content="説明">'
        + '<meta property="og:image" content="/card.png"><link rel="canonical" href="https://psray.net/x">'
        + '<meta name="robots" content="noindex, follow"><meta property="og:description" content="">',
    }), { siteUrl: SITE, pageUrl: `${SITE}/x`, linkStyle: 'canonical' })
    expect(markdown.split('\n# Hi')[0]).toBe([
      '---',
      'title: "Og \\"title\\": \\\\ yes"',
      'description: "説明"',
      'image: "https://psray.net/card.png"',
      'url: "https://psray.net/x"',
      'lang: "ja-JP"',
      '---',
      '',
    ].join('\n'))
    expect(meta.robots).toBe('noindex, follow')
  })

  it('falls back to <title> and skips front matter fields it lacks', () => {
    const { markdown } = htmlToMarkdown('<html><head><title>Only</title></head><body><main><p>x</p></main></body></html>', { siteUrl: SITE, pageUrl: SITE, linkStyle: 'canonical' })
    expect(markdown).toBe('---\ntitle: "Only"\n---\n\nx\n')
  })

  it('appends every JSON-LD block, one per line, in a single fence', () => {
    const { markdown } = htmlToMarkdown(page('<p>x</p>', {
      head: '<script type="application/ld+json">{ "@type": "WebSite",\n "name": "PSRay" }</script>',
      after: '<script type="application/ld+json">{"@type":"BreadcrumbList"}</script><script type="application/ld+json">not json</script>',
    }), { siteUrl: SITE, pageUrl: SITE, linkStyle: 'canonical' })
    expect(markdown.endsWith('x\n\n```json\n{"@type":"WebSite","name":"PSRay"}\n{"@type":"BreadcrumbList"}\nnot json\n```\n')).toBe(true)
  })

  it('adds no fence without JSON-LD and ends with one newline', () => {
    const { markdown } = htmlToMarkdown(page('<p>x</p>'), { siteUrl: SITE, pageUrl: SITE, linkStyle: 'canonical' })
    expect(markdown).not.toContain('```')
    expect(markdown.endsWith('x\n')).toBe(true)
  })
})

describe('content root', () => {
  it('reads <main> without the site chrome or footer, but keeps headers inside it', () => {
    expect(body('<section><header><h2>本編</h2></header><p>Body</p></section>')).toBe('## 本編\n\nBody')
  })

  it('falls back to <body> without header, nav, aside and footer', () => {
    const { markdown } = htmlToMarkdown('<html><body><header>Top</header><nav><a href="/a">A</a></nav><p>Text</p><footer>F</footer></body></html>', { siteUrl: SITE, pageUrl: SITE, linkStyle: 'canonical' })
    expect(markdown).toBe('Text\n')
  })
})

describe('pruning', () => {
  it('drops widgets, forms, hidden and decorative content', () => {
    expect(body([
      '<p>Keep</p>',
      '<button>Share</button><div role="switch">Spoilers</div><div role="listbox"><span>Sort</span></div>',
      '<form><label>Search</label><input value="q"></form><template><p>T</p></template>',
      '<p hidden>H</p><p aria-hidden="true">A</p><p style="display: none">V</p><svg><text>S</text></svg>',
      '<!--[--><p>Also</p><!--]-->',
    ].join(''))).toBe('Keep\n\nAlso')
  })

  it('reads an animated counter once', () => {
    expect(body('<p>Players <span><span aria-hidden="true">53</span><span>53</span></span></p>')).toBe('Players 53')
  })

  it('keeps a toggle inside a heading (an accordion)', () => {
    expect(body('<h3><button><span>01</span> Question?</button></h3><p>Answer</p>')).toBe('### 01 Question?\n\nAnswer')
  })

  it('drops the language switcher and fragment-only tables of contents, keeps breadcrumbs', () => {
    expect(body([
      '<nav aria-label="パンくずリスト"><a href="/trophies">トロフィー</a> <span>GTA</span></nav>',
      '<nav><a href="#a">A</a><a href="#b">B</a></nav>',
      '<nav aria-label="言語"><a href="/x" hreflang="ja">日本語</a><a href="/x?lang=en" hreflang="en">English</a></nav>',
    ].join(''))).toBe('[トロフィー](https://psray.net/trophies) GTA')
  })

  it('reads Tailwind display utilities at desktop width', () => {
    expect(body('<ul class="md:hidden"><li>mobile</li></ul><div class="hidden md:block">desktop</div>')).toBe('desktop')
    expect(body('<p class="sm:hidden">pager-sm</p><p class="max-sm:hidden">pager</p>')).toBe('pager')
    expect(body('<p class="invisible">x</p><p class="sr-only">label</p><p class="hover:hidden">y</p>')).toBe('label\n\ny')
  })

  it('evaluates display variants', () => {
    expect(visibleAtDesktop(['hidden'])).toBe(false)
    expect(visibleAtDesktop(['hidden', 'lg:flex'])).toBe(true)
    expect(visibleAtDesktop(['block', '2xl:hidden'])).toBe(true)
    expect(visibleAtDesktop(['xl:hidden'])).toBe(false)
    expect(visibleAtDesktop(['max-md:block', 'hidden'])).toBe(false)
    expect(visibleAtDesktop(['hidden', '@4xl:block'])).toBe(true)
    expect(visibleAtDesktop(['group-hover:hidden'])).toBe(true)
    expect(visibleAtDesktop(['hidden!'])).toBe(false)
    expect(visibleAtDesktop(['invisible', 'md:visible'])).toBe(true)
  })
})

describe('text', () => {
  it('spaces out flex and grid children', () => {
    expect(body('<div class="flex flex-col"><span>PSN</span><span>0.1%</span></div>')).toBe('PSN 0.1%')
    expect(body('<p><span>a</span><span>b</span></p>')).toBe('ab')
    expect(body('<p><span class="block">a</span><span>b</span></p>')).toBe('a b')
  })

  it('does not let an empty divider swallow the space', () => {
    expect(body('<div class="flex"><span>#1 World</span><div class="h-4 w-px"></div><span>#2 Region</span></div>')).toBe('\\#1 World #2 Region')
  })

  it('reads role=img and label-only links and headings by their labels', () => {
    expect(body('<p>Mix <span role="img" aria-label="Platinum 1 · Gold 2"><i></i></span></p>')).toBe('Mix Platinum 1 · Gold 2')
    expect(body('<p><a href="/leaderboard?page=2" aria-label="Next page"><svg></svg></a></p>')).toBe('[Next page](https://psray.net/leaderboard?page=2)')
    expect(body('<h1 aria-label="PSRay"><span aria-hidden="true">P</span></h1>')).toBe('# PSRay')
  })

  it('uses * for emphasis so CJK stays readable', () => {
    expect(body('<p>PlayStation の<mark>トロフィー</mark>を</p>')).toBe('PlayStation の*トロフィー*を')
  })
})

describe('links and images', () => {
  it('drops empty links, unwraps non-destinations and drops titles', () => {
    expect(body('<p><a href="/x"></a><a href="#top">Top</a> <a href="javascript:void 0">J</a> <a title="t" href="/y">Y</a></p>'))
      .toBe('Top J [Y](https://psray.net/y)')
  })

  it('keeps meaningful images, drops decorative and redundant ones', () => {
    expect(body('<p><img src="/a.png" alt=""><img src="data:image/png;base64,x" alt="d"> text</p>')).toBe('text')
    expect(body('<div><div><img src="https://x/i.png" alt="Vice Got a Price!"></div><h3><span>Vice Got a Price!</span></h3></div>')).toBe('### Vice Got a Price!')
    expect(body('<p><img src="/flags/fr.svg" alt="France"> caro</p>')).toBe('![France](https://psray.net/flags/fr.svg) caro')
  })

  it('turns a card link into one link on its title', () => {
    expect(body('<a href="/trophies/1"><div><img src="/c.png" alt="GTA"></div><div><h3>GTA</h3><p>PS5</p></div></a>'))
      .toBe('### [GTA](https://psray.net/trophies/1)\n\nPS5')
  })

  it('makes links absolute against the site, not the request host', () => {
    expect(body('<p><a href="/games/1">G</a> <a href="https://www.igdb.com/x">I</a> <a href="mailto:a@b.c">M</a></p>', { pageUrl: `${SITE}/games/2` }))
      .toBe('[G](https://psray.net/games/1) [I](https://www.igdb.com/x) [M](mailto:a@b.c)')
  })

  it('points page links at .md URLs for a .md request', () => {
    expect(body('<p><a href="/">H</a> <a href="/trophies/1?lang=en#trophy-2">T</a> <a href="/settings">S</a> <a href="/sitemap.xml">X</a> <a href="https://x.com/a">E</a></p>', { linkStyle: 'suffix' }))
      .toBe('[H](https://psray.net/index.md) [T](https://psray.net/trophies/1.md?lang=en#trophy-2) [S](https://psray.net/settings) [X](https://psray.net/sitemap.xml) [E](https://x.com/a)')
  })
})

describe('structure', () => {
  it('reads description lists as term: value items', () => {
    expect(body('<dl><dt>Players</dt><dd>2,667</dd><dt>Done</dt><dd><a href="/p/x">x</a></dd></dl>'))
      .toBe('- Players: 2,667\n- Done: [x](https://psray.net/p/x)')
    expect(body('<dl><div><dt>Players</dt><dd>2,667</dd></div></dl>')).toBe('- Players: 2,667')
    expect(body('<dl><div><span aria-hidden="true"></span><div><dt>Rare</dt><p>under 5%</p></div><dd>53</dd></div></dl>'))
      .toBe('- Rare under 5%: 53')
  })

  it('writes tables as GFM without padding', () => {
    expect(body('<table><thead><tr><th>#</th><th>Player</th></tr></thead><tbody><tr><td>1</td><td>caro</td></tr></tbody></table>'))
      .toBe('| # | Player |\n| - | - |\n| 1 | caro |')
  })
})
