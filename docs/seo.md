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
| Everything else | All five; `/about`, `/privacy`, `/terms` are Japanese only (`staticLocale`) |

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

## Checking a change

```bash
pnpm test && pnpm check:locales
pnpm build && HOST=127.0.0.1 PORT=3650 NUXT_PUBLIC_API_BASE=https://api.psray.net node .output/server/index.mjs
# then, as a crawler would see it:
curl -s -A Googlebot 'http://127.0.0.1:3650/trophies/28335?lang=en' | grep -oE '<link rel="(canonical|alternate)"[^>]*>|<meta name="robots"[^>]*>'
curl -sI -A Googlebot 'http://127.0.0.1:3650/trophies/28335?tlang=en-US'   # 301 → ?lang=en, no-store
```
