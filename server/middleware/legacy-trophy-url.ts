import { legacyTrophyRedirect } from '../../shared/legacyTrophyUrl'

/** 301s old `/trophies/:id/:lang/:slug` links onto the current trophy page. */
export default defineEventHandler((event) => {
  if (!event.path.startsWith('/trophies/')) return
  const url = getRequestURL(event)
  const target = legacyTrophyRedirect(url.pathname, url.search)
  if (target) return sendRedirect(event, target, 301)
})
