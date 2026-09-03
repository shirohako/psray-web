import type { Profile } from '~/services/profile'
import { profileCardHtml } from '../../../utils/ogCard'
import { brandLogo, imageDataUri, renderCard } from '../../../utils/ogRender'
import { OG_FALLBACK, apiBase, ogParam, sendCard } from '../../../utils/ogRoute'

/**
 * `GET /og/profile/:psnid.png` — the 1200×630 social card for a player profile.
 *
 * Platforms crop `og:image` to 2:1, which is why the avatar alone used to arrive
 * stretched: it is a 240×240 square. Here it is one fixed tile inside a card that
 * is already the right shape.
 *
 * Anything short of a public, resolvable profile falls back to the brand card —
 * a private profile's trophy counts must never leak into an image that link
 * previews fetch anonymously.
 */
const buildCard = defineCachedFunction(async (psnid: string): Promise<string | null> => {
  let profile: Profile
  try {
    const response = await $fetch<{ data: Profile }>(`${apiBase()}/profile/${encodeURIComponent(psnid)}`)
    profile = response.data
  }
  catch {
    return null
  }

  if (!profile?.is_profile_public) return null

  const [avatar, flag] = await Promise.all([
    imageDataUri(profile.avatar_url),
    // The site already ships these SVGs; the card just borrows one over HTTP.
    imageDataUri(profile.country
      ? `${useRuntimeConfig().public.siteUrl.replace(/\/+$/, '')}/flags/4x3/${profile.country.toLowerCase()}.svg`
      : null),
  ])

  const png = await renderCard(profileCardHtml({
    psnid: profile.psnid,
    trophyLevel: profile.trophy_level,
    rank: profile.rank,
    trophies: {
      platinum: profile.platinum,
      gold: profile.gold,
      silver: profile.silver,
      bronze: profile.bronze,
    },
    playedGames: profile.played_game_count,
    avatar,
    flag,
    logo: await brandLogo(),
  }))

  return png.toString('base64')
}, {
  name: 'og-profile',
  maxAge: 60 * 60 * 6,
  getKey: (psnid: string) => psnid.toLowerCase(),
})

// Not a `.get.ts` route: that suffix would 404 the HEAD requests some
// crawlers and caches send before fetching the image.
export default defineEventHandler(async (event) => {
  const psnid = ogParam(getRouterParam(event, 'psnid'))
  // PSN online IDs are 3–16 of `[A-Za-z0-9_-]`; reject anything else unrendered.
  if (!/^[A-Za-z0-9_-]{3,16}$/.test(psnid)) return sendRedirect(event, OG_FALLBACK, 302)

  return sendCard(event, await buildCard(psnid))
})
