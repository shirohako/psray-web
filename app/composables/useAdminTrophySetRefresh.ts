import type { AdminTrophySetRefresh } from '~/types/admin'

/**
 * "Refresh from PSN" for the trophy-set drawer, shared by its footer (button,
 * translations toggle) and its body (result). The result remembers which set
 * it belongs to, so opening another set doesn't show a stale one.
 */
export function useAdminTrophySetRefresh() {
  const api = useAdminApi()
  const busy = ref(false)
  const localize = ref(false)
  const state = ref<{ id: number, result: AdminTrophySetRefresh | null, error: any } | null>(null)

  async function run(id: number, reload: () => Promise<unknown>) {
    if (busy.value) return
    busy.value = true
    state.value = { id, result: null, error: null }
    try {
      const result = await api.write<AdminTrophySetRefresh>(`/trophy-sets/${id}/refresh`, { localize: localize.value })
      state.value = { id, result, error: null }
      await reload()
    } catch (e) {
      state.value = { id, result: null, error: e }
    } finally {
      busy.value = false
    }
  }

  const resultFor = (id: number) => (state.value?.id === id ? state.value.result : null)
  const errorFor = (id: number) => (state.value?.id === id ? state.value.error : null)

  return { busy, localize, run, resultFor, errorFor }
}
