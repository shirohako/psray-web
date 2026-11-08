import type { Ref } from 'vue'

/**
 * HTTP semantics for a server-rendered list page built from one API list call,
 * so that only real lists get indexed:
 *
 * - the API failed (5xx, or no answer at all): 503 + `Retry-After` — "come
 *   back later", where a 200 would get the error state indexed as the page;
 * - a page past the end, or a query the API rejects: 404.
 *
 * The page keeps its in-page error UI either way. Call it after the (awaited)
 * fetch; the returned flag makes the page `noindex` in those states.
 */
export function useListResponse(source: {
  error: Ref<unknown>
  meta: Ref<{ total_pages?: number } | undefined>
  page: Ref<number>
}) {
  const statusCode = computed(() => {
    const error = source.error.value as { statusCode?: number } | null | undefined
    if (error) {
      const code = error.statusCode ?? 0
      return code >= 400 && code < 500 ? 404 : 503
    }
    const totalPages = source.meta.value?.total_pages
    if (totalPages !== undefined && source.page.value > Math.max(totalPages, 1)) return 404
    return 200
  })

  if (import.meta.server && statusCode.value !== 200) {
    const event = useRequestEvent()
    if (event) setResponseStatus(event, statusCode.value)
    if (statusCode.value === 503) useResponseHeader('retry-after').value = '300'
  }

  return { failed: computed(() => statusCode.value !== 200) }
}
