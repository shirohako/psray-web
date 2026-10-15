import type { RouterConfig } from 'nuxt/schema'

/** Offset for scrolling to `#hash` targets, as Nuxt's default computes it. */
function hashMarginTop(selector: string) {
  try {
    const el = document.querySelector(selector)
    if (el) {
      return (Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0)
        + (Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0)
    }
  }
  catch {}
  return 0
}

/**
 * Nuxt's default scroll behaviour, with one exception: the navigation that
 * hydrates a server-rendered page leaves the scroll alone.
 *
 * After a reload the browser has already put the page back where the reader
 * left it. Nuxt's default would then scroll to the position vue-router saved in
 * `history.state`, which current vue-router only records when the page is
 * hidden — so a plain reload has none (or a stale one) and the page slid back
 * to the top a moment after loading. Hash links on first load are handled by
 * the pages that use them (e.g. `#trophy-…` on the trophy page).
 */
export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    const nuxtApp = useNuxtApp()
    if (nuxtApp.isHydrating) return false

    // Same page: only a query or hash change.
    if (to.path.replace(/\/$/, '') === from.path.replace(/\/$/, '')) {
      if (from.hash && !to.hash) return savedPosition ?? { left: 0, top: 0 }
      if (to.hash) return { el: to.hash, top: hashMarginTop(to.hash) }
      return false
    }

    const scrollToTop = typeof to.meta.scrollToTop === 'function' ? to.meta.scrollToTop(to, from) : to.meta.scrollToTop
    if (scrollToTop === false) return false

    // Another page: scroll once it has rendered (back/forward restores the saved position).
    const router = useRouter()
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce('page:loading:end', () => {
        requestAnimationFrame(() => {
          if (router.currentRoute.value.fullPath !== to.fullPath) return resolve(false)
          if (savedPosition) return resolve(savedPosition)
          resolve(to.hash ? { el: to.hash, top: hashMarginTop(to.hash) } : { left: 0, top: 0 })
        })
      })
    })
  },
}
