# SEO: URLs, languages and indexing

How the site tells search engines which URLs are pages. The plan behind it, with the production
numbers that motivated it, is `psray-api/docs/seo-plan.md`; the sitemap side is
`psray-api/docs/sitemap.md`.

## One language per URL

`?lang=` picks one of the five interface languages (`ja`, `zh-Hans`, `zh-Hant`, `en`, `ko`), and with
it the language of the content: a trophy set's text follows the interface (`PSN_LANG`, then the
API's fallback). Japanese, the default, is the URL without any `lang`. Every URL renders the same
for every visitor without cookies, which is every crawler.

| Request | Result |
| --- | --- |
| `/trophies/1`, `?lang=en`, `?lang=zh-Hans`, … | Rendered; indexable if the language is one of the page's editions |
| `?lang=en&tlang=en-US` (a `tlang` that changes nothing) | 301 to `?lang=en` |
| `?tlang=en-US` / `ja-JP` / `zh-Hans` without `lang` (the old scheme) | 301 to `?lang=en` / bare / `?lang=zh-Hans` |
| `?lang=en&tlang=fr-FR`, `?tlang=fr-FR` | Rendered, `noindex, follow`, no canonical, no alternates |
| `?psnid=x` | Rendered, `noindex, follow`, no canonical |

- `?tlang=` is a reader's override of the trophy text. With one, the interface is always spelled out
  (`lang=ja&tlang=…`, the only place `lang=ja` is ever written), so a `tlang` without `lang` can only
  be an old link. The rules are `shared/trophyLanguage.ts`; the 301 is decided on the server in
  `pages/trophies/[id].vue`, where the API's answer is at hand.
- The 301s carry `Cache-Control: no-store` and never fire for a reader with a trophy-language
  preference: for them the page without `tlang` shows their preferred language instead.
- Old-site URLs (`/trophies/:id/:lang/:slug`, `/trophy/:id`, `/trophy/achievers?id=`,
  `/laboratory/…`, `/trophies/ranking/…`, `?language=`) and trailing slashes 301 in one hop to the
  public page: `shared/legacyUrls.ts`, `server/middleware/legacy-urls.ts`.

## Editions

A page is indexed only in the languages its content exists in. A Korean interface around English
trophy text translates the boilerplate, not the page, and search engines treat such pages as
duplicates.

| Page | Editions |
| --- | --- |
| Trophy set, game | `ja`, `en`, plus `zh-Hans` / `zh-Hant` / `ko` when the set has that official translation (games: a translated title) — `contentEditions()` |
| Profile | `ja`, `en`, plus the interfaces of the player's own PSN languages (`user.language`) — `profileEditions()` |
| Everything else | All five; `/privacy`, `/terms` are Japanese only (`staticLocale`) |

A page rendered outside its editions is `noindex, follow`. The same rules drive the `hreflang`
alternates, the page's language links and the backend sitemap (`SitemapLanguages.php`); keep the
test vectors of `tests/locales.test.ts` and `psray-api/tests/Feature/SitemapTest.php` in step.

## Head tags

`useSeo()` (`app/composables/useSeo.ts`) emits everything from one call.

- **Indexable:** `canonical` is the page itself — path, the page's own list params
  (`canonicalQuery`, normalized, in a fixed order), then `lang`. `hreflang` lists every edition plus
  `x-default` → the English URL (the bare URL stays Japanese, but English is the better fallback for
  everyone we have no interface for).
- **Not indexable** (`noindex`, or a locale outside `editions`): only `noindex, follow`.
- `absoluteUrl(path)` gives other pages' URLs in the same language, for structured data. Don't call
  the `utils/locale.ts` helpers (`localizeTo`, `currentUiLocale`, `formatDuration` without its `t`
  argument) from head getters: unhead evaluates those outside any component, where they fall back to
  Japanese.

| Page | `canonicalQuery` | `noindex` when |
| --- | --- | --- |
| `/trophies` | `category` (not `trending`), `page` | a search or any filter |
| `/games` | `page` | a search |
| `/leaderboard` | `board`, `region` (region boards), `page` | `registered=1` |
| `/trophies/:id` | — | `tlang`, `psnid`, or outside editions |
| `/p/:psnid` | — | private, a `tab` / `page` / `q` sub-view, or outside editions |

List pages answer 503 + `Retry-After` while the API is down and 404 past their last page
(`useListResponse()`), so error states are never indexed as the page.

## Links

Every internal link keeps the interface language: a crawler has no language cookie, so the `href`
alone decides which edition it lands on.

- Links: `<AppLink>` (a `<NuxtLink>` that appends `?lang=` after the target's own params). A raw `<a>`
  with its own click handling takes its `href` from `useLangLink().href()`.
- Navigations: wrap every `navigateTo()` / `router.push()` target in `localizeTo()`.
- `tests/internalLinks.test.ts` fails on a bare `<NuxtLink>` or a hard-coded `href="/…"` outside
  admin and the language switchers.
- The language menu in the top bar only renders once opened, so `<LanguageLinks>` repeats it as plain
  links: in `<SiteFooter>` (all five), or on trophy set, game and profile pages (their editions, with
  `definePageMeta({ languageLinks: false })` switching the footer's list off).
- Pagers, library categories and leaderboard boards are real links (`hrefFor`, `categoryHref`,
  `boardHref`); a plain click still navigates in place (`interceptClick()` in `utils/trophyLink.ts`).
  So are a trophy page's recent players and similar sets: a plain click opens their menu or card.
- Links to personal views (`?psnid=`, `?tips=`) keep a clean public `href` and add the parameters on
  click.

## Content

- Hidden trophies' names and descriptions are in the HTML, blurred until revealed, so they can be
  indexed without spoiling anyone (`components/trophy/Item.vue`). The `show_spoilers` cookie is only
  written when the reader flips the switch.
- Trophy set titles name the platform and strip the "Trophies" that PS3/Vita set names carry;
  descriptions carry the tier breakdown, the platinum's PSN earn rate and the median time to platinum
  (`utils/trophySeo.ts`). Profile descriptions carry the player's own numbers.
- Structured data (`utils/structuredData.ts`): `BreadcrumbList` on trophy set and game pages,
  `VideoGame` on game pages, `ProfilePage` on members' profiles, `WebSite` on the homepage. Only
  facts the page shows.
- The homepage links into the site below the hero (`components/home/Hub.vue`, see `docs/home.md`).

## Markdown for agents

Every public page is also served as Markdown, for AI agents and other tools. This works the same way as Cloudflare's [Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/), but we run it ourselves, so keep Cloudflare's own switch off.

**How to ask for it.** There are two ways:

- Send `Accept: text/markdown`. A `q=0` turns it off, and `*/*` doesn't count.
- Append `.md` to the path, for example `/trophies/42972.md?lang=en`. The home page is `/index.md`.

HTML pages also carry `<link rel="alternate" type="text/markdown">`, from `useSeo`. `/llms.txt` (`shared/llmsTxt.ts`) indexes the site for agents.

**Where the code is:**

- `server/plugins/markdown-for-agents.ts` converts the rendered page in Nitro's `render:response` hook. Error pages go through the same hook.
- `server/middleware/markdown-for-agents.ts` handles the two kinds of request:
  - For `.md` URLs it fetches the page internally and relays the response. Redirects keep their `.md` form.
  - For Accept requests it adds `text/html;q=0.01` to the Accept header. Without it, Nuxt answers a 404 from curl with JSON instead of rendering `error.vue`.
- Private paths (`isPrivatePath` in `shared/sitemap.ts`) and files are never converted.

**What the response looks like:**

- Headers:
  - `Content-Type: text/markdown; charset=utf-8`
  - `Vary: Accept`. HTML responses of convertible pages carry it too.
  - `x-markdown-tokens`: an estimate, UTF-8 bytes / 4.
  - `Content-Signal: ai-train=yes, search=yes, ai-input=yes`, unless the response already has one.
  - `X-Robots-Tag`, copied from the page's robots meta.
  - For `.md` URLs, `Link: rel=canonical` pointing back at the page.
- Length, encoding and validator headers are dropped.
- The body is YAML front matter, then the content, then the page's JSON-LD in a single ```` ```json ```` block.

**What counts as content.** The conversion is generic (`shared/htmlToMarkdown.ts`, rules in `shared/htmlPrune.ts`):

- It reads `<main>`, without the site footer.
- It drops buttons and widget roles, forms, `aria-hidden` and `hidden` elements, and anything Tailwind hides at desktop width (so the mobile copy of a list goes).
- It drops images whose alt text is already written next to them.
- It turns card links into one link on the card's title.

When a page loses meaning in Markdown, fix its markup for assistive tech instead of adding a rule. An `sr-only` label, or a heading around an accordion toggle, helps both screen readers and agents. Trophy tips are not included, because they only render in client-side dialogs.

```bash
curl -sD- -H 'Accept: text/markdown' 'http://127.0.0.1:3630/trophies/42972' | head -30
curl -s 'http://127.0.0.1:3630/trophies/42972.md?lang=en' | head -30
```

## Checking a change

```bash
pnpm test && pnpm check:locales
pnpm build && HOST=127.0.0.1 PORT=3650 NUXT_PUBLIC_API_BASE=https://api.psray.net node .output/server/index.mjs
# then, as a crawler would see it:
curl -s -A Googlebot 'http://127.0.0.1:3650/trophies/28335?lang=en' | grep -oE '<link rel="(canonical|alternate)"[^>]*>|<meta name="robots"[^>]*>'
curl -sI -A Googlebot 'http://127.0.0.1:3650/trophies/28335?tlang=en-US'   # 301 → ?lang=en, no-store
```
