import type { Ref } from 'vue'

// Fetches currently holding the bar, across every component on the page (a
// profile and its active tab can both be loading). The bar runs while any of
// them is, and fills once the last one lands. Client-only, so one app per
// module instance.
let active = 0
let anyFailed = false
// Filling the bar waits one task: a fetch that lands often mounts content that
// starts the next one (a profile, then its tab), and that one should carry the
// same bar on rather than restart it from zero.
let finishTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Keeps the top-of-page `<NuxtLoadingIndicator>` running while a lazy fetch is
 * in flight, and fills it when the data lands (red if any of them failed).
 *
 * Lazy pages mount before their data arrives, and Nuxt fires
 * `page:loading:end` as soon as the page has mounted, which would finish the
 * bar early. So on that hook (ours runs after the indicator's own) the bar is
 * started again while anything is still loading. Both happen in the same tick,
 * so the bar never flashes full in between.
 *
 * ```ts
 * const pending = computed(() => status.value === 'pending')
 * useLoadingBar(pending, () => status.value === 'error')
 * ```
 */
export function useLoadingBar(pending: Ref<boolean>, failed: () => boolean = () => false) {
  if (import.meta.server) return

  const nuxtApp = useNuxtApp()
  const indicator = useLoadingIndicator()
  // Whether this caller currently holds the bar.
  let holding = false

  function release(error: boolean) {
    if (!holding) return
    holding = false
    active--
    anyFailed ||= error
    if (active > 0) return
    finishTimer = setTimeout(() => {
      finishTimer = undefined
      indicator.finish({ error: anyFailed })
      anyFailed = false
    })
  }

  watch(pending, (loading) => {
    if (!loading) return release(failed())
    if (holding) return
    holding = true
    // Joining a bar that is running, or about to fill, leaves it where it is.
    if (active++ > 0) return
    if (finishTimer) {
      clearTimeout(finishTimer)
      finishTimer = undefined
    }
    else indicator.start()
  }, { immediate: true })

  const off = nuxtApp.hook('page:loading:end', () => {
    if (active > 0) indicator.start()
  })
  onScopeDispose(() => {
    off()
    release(false)
  })
}
