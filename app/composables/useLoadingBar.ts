import type { Ref } from 'vue'

/**
 * Keeps the top-of-page `<NuxtLoadingIndicator>` running while a page's lazy
 * fetch is in flight, and fills it when the data lands (red on error).
 *
 * Lazy pages mount before their data arrives, and Nuxt fires
 * `page:loading:end` as soon as the page has mounted, which would finish the
 * bar early. So on that hook (ours runs after the indicator's own) the bar is
 * started again while `pending` is still true. Both happen in the same tick,
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
  // Only finish a run this page started, so it never cuts short a navigation
  // away that is already driving the bar.
  let running = false

  watch(pending, (loading) => {
    if (loading) {
      running = true
      indicator.start()
    }
    else if (running) {
      running = false
      indicator.finish({ error: failed() })
    }
  }, { immediate: true })

  const off = nuxtApp.hook('page:loading:end', () => {
    if (pending.value) indicator.start()
  })
  onScopeDispose(off)
}
