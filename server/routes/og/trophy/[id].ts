import type { TrophySetDetail } from '~/services/trophies'
import { trophyCardHtml } from '../../../utils/ogCard'
import { brandLogo, imageDataUri, renderCard } from '../../../utils/ogRender'
import { OG_FALLBACK, apiBase, ogParam, sendCard } from '../../../utils/ogRoute'

/**
 * `GET /og/trophy/:id.png` — the 1200×630 social card for a trophy set.
 *
 * No `lang` is passed to the API: the card draws the set's *default*-language
 * name, so one render serves every locale and the cache stays keyed by id alone.
 * The preview's own title line still carries the reader's language, from `og:title`.
 */
const buildCard = defineCachedFunction(async (id: string): Promise<string | null> => {
  let detail: TrophySetDetail
  try {
    const response = await $fetch<{ data: TrophySetDetail }>(`${apiBase()}/trophies/${id}`)
    detail = response.data
  }
  catch {
    return null
  }

  const set = detail?.trophy_set
  if (!set) return null

  const png = await renderCard(trophyCardHtml({
    // The set's own default-language name, so the card does not vary by request.
    name: set.name,
    platforms: set.platform ?? [],
    trophies: {
      platinum: set.defined_trophies.platinum,
      gold: set.defined_trophies.gold,
      silver: set.defined_trophies.silver,
      bronze: set.defined_trophies.bronze,
    },
    owners: set.owners,
    averageProgress: set.average_progress,
    icon: await imageDataUri(set.icon_url),
    logo: await brandLogo(),
  }))

  return png.toString('base64')
}, {
  name: 'og-trophy',
  maxAge: 60 * 60 * 6,
  getKey: (id: string) => id,
})

// Not a `.get.ts` route: that suffix would 404 the HEAD requests some
// crawlers and caches send before fetching the image.
export default defineEventHandler(async (event) => {
  const id = ogParam(getRouterParam(event, 'id'))
  if (!/^\d+$/.test(id)) return sendRedirect(event, OG_FALLBACK, 302)

  return sendCard(event, await buildCard(id))
})
