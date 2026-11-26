import { sitemapUrl } from './sitemap'

/**
 * `/llms.txt` (llmstxt.org): what the site is and where its content lives, for
 * language models and agents. Links use the `.md` form of each page, which
 * serves it as Markdown (see `markdownAgents.ts`).
 */
export function llmsText(options: { siteUrl: string, sitemapUrl: string }): string {
  const site = options.siteUrl.replace(/\/+$/, '')
  const md = (path: string, query = '') => `${site}${path === '/' ? '/index' : path}.md${query}`

  return [
    '# PSRay',
    '',
    '> PSRay is a community site for PlayStation players: public PSN profiles with trophy progress and rankings, trophy lists with earn rates and completion statistics, leaderboards, and player-written trophy tips. It is run independently and is not affiliated with Sony Interactive Entertainment.',
    '',
    'Every public page is also available as Markdown. Either request the page with an `Accept: text/markdown` header, or append `.md` to its path (the home page is `/index.md`). Markdown responses start with YAML front matter (title, description, canonical URL, language) and end with the page\'s JSON-LD.',
    '',
    'The interface language is chosen with `?lang=`: `ja` (the default, no parameter), `en`, `ko`, `zh-Hant` or `zh-Hans`. Trophy names and descriptions come from PSN in the languages it provides.',
    '',
    'Page URLs:',
    '',
    `- Trophy list of a game: ${site}/trophies/{id}.md`,
    `- Game: ${site}/games/{id}.md`,
    `- Game series: ${site}/series/{id}.md`,
    `- Player profile: ${site}/p/{psnid}.md`,
    '',
    '## Sections',
    '',
    `- [Home](${md('/', '?lang=en')}): site overview and highlights`,
    `- [Trophy lists](${md('/trophies', '?lang=en')}): search and browse trophy lists`,
    `- [Games](${md('/games', '?lang=en')}): search and browse games`,
    `- [Game series](${md('/series', '?lang=en')}): games grouped by franchise`,
    `- [Leaderboard](${md('/leaderboard', '?lang=en')}): players ranked by PSN trophy points`,
    `- [About](${md('/about', '?lang=en')}): how PSRay works, its data and FAQ`,
    '',
    '## Optional',
    '',
    `- [Markdown syntax for tips](${md('/docs/markdown', '?lang=en')})`,
    `- [Feedback board](${md('/feedback', '?lang=en')})`,
    `- [Terms of service](${md('/terms')}): Japanese only`,
    `- [Privacy policy](${md('/privacy')}): Japanese only`,
    `- [Sitemap](${sitemapUrl(options.sitemapUrl)})`,
    '',
  ].join('\n')
}
