import type { Profile } from '~/services/profile'
import { profileCardHtml } from '../../../utils/ogCard'
import { brandLogo, fetchImage, pageQrCode, renderCard } from '../../../utils/ogRender'
import { OG_FALLBACK, apiBase, ogParam, sendCard } from '../../../utils/ogRoute'

/**
 * `GET /card/profile/:psnid.png` — the 1200×630 social card for a player profile.
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

  const siteUrl = useRuntimeConfig().public.siteUrl.replace(/\/+$/, '')
  const pageUrl = `${siteUrl}/p/${encodeURIComponent(profile.psnid)}`
  const [avatar, flag, logo, qr] = await Promise.all([
    fetchImage(profile.avatar_url),
    // The site already ships these SVGs; the card just borrows one over HTTP and
    // draws it as a vector, so a 24px flag still resolves its own detail.
    fetchImage(profile.country
      ? `${siteUrl}/flags/4x3/${profile.country.toLowerCase()}.svg`
      : null),
    brandLogo(),
    pageQrCode(pageUrl),
  ])

  const png = await renderCard(profileCardHtml({
    psnid: profile.psnid,
    trophyLevel: profile.trophy_level,
    rank: profile.rank,
    regionalRank: profile.server_rank,
    trophies: {
      platinum: profile.platinum,
      gold: profile.gold,
      silver: profile.silver,
      bronze: profile.bronze,
    },
    playedGames: profile.played_game_count,
    avatar,
    // Flags are drawn at a fixed 4:3, so only the bytes are needed.
    flag: flag?.uri ?? null,
    country: profile.country || null,
    logo,
    url: pageUrl,
    qr,
    lastUpdatedAt: profile.last_synced_at,
  }))

  return png.toString('base64')
}, {
  // Version the render cache alongside the public `?v=3` image URL so a style
  // deployment cannot inherit PNGs produced by the previous layout.
  name: 'og-profile-v3',
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
