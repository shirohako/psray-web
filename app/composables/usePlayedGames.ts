import type { PlayedTrophySet } from '~/services/profile'

/** One of the player's games, as the showcase pickers list it. */
export interface PlayedGameRow {
  /** Trophy set id. */
  id: number
  name: string
  /** Language `name` is in. */
  lang: string | null
  icon: string
  platform: string[]
  /** Trophies earned / defined. */
  earned: number
  total: number
  progress: number
}

interface PageMeta { page: number; per_page: number; total: number; total_pages: number }

function toRow(row: PlayedTrophySet): PlayedGameRow {
  const set = row.trophy_set
  const d = set.defined_trophies
  return {
    id: row.trophy_set_id,
    name: set.localized_name || set.name,
    lang: set.display_language ?? set.default_language,
    icon: set.icon_url,
    platform: set.platform,
    earned: row.earned_bronze + row.earned_silver + row.earned_gold + row.earned_platinum,
    total: d.bronze + d.silver + d.gold + d.platinum,
    progress: row.progress,
  }
}

/**
 * The player's games, most recently played first, searchable by title — the
 * profile's recently played list (`GET /profile/:psnid/recently-played`), for
 * the showcase pickers. Typing searches after a short pause, held back while
 * the words are outside the API's keyword bounds (`searchError` says why).
 * `reset()` clears the search and loads the first page if nothing is
 * loaded yet.
 */
export function usePlayedGames(psnid: MaybeRefOrGetter<string>) {
  const { t } = useI18n()
  const api = useApi()
  const errorText = useApiErrorText()

  const query = ref('')
  const searchError = ref<string | null>(null)
  const games = ref<PlayedGameRow[]>([])
  const page = ref(0)
  const totalPages = ref(1)
  const pending = ref(false)
  const error = ref<string | null>(null)
  let request = 0

  async function load(next: number) {
    const current = ++request
    pending.value = true
    error.value = null
    try {
      const res = await api.raw.get<PlayedTrophySet[], PageMeta>(recentlyPlayedPath(toValue(psnid), next, query.value))
      if (current !== request) return
      const rows = (res.data ?? []).map(toRow)
      games.value = next === 1 ? rows : [...games.value, ...rows]
      page.value = next
      totalPages.value = res.meta?.total_pages ?? 1
    }
    catch (err) {
      if (current === request) error.value = errorText(err) ?? t('settings.showcase.picker.loadFailed')
    }
    finally {
      if (current === request) pending.value = false
    }
  }

  let timer: ReturnType<typeof setTimeout> | null = null
  watch(query, () => {
    if (timer) clearTimeout(timer)
    const result = validateRecentlyPlayedSearch(query.value)
    searchError.value = result.error
      ? t(`profile.recent.searchErrors.${result.error}`, {
          min: RECENTLY_PLAYED_SEARCH_MIN_KEYWORD_LENGTH,
          length: RECENTLY_PLAYED_SEARCH_MAX_LENGTH,
        })
      : null
    if (result.error) return
    timer = setTimeout(() => load(1), 300)
  })
  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  function reset() {
    if (query.value) query.value = ''
    else if (!games.value.length || error.value) load(1)
  }

  const hasMore = computed(() => page.value < totalPages.value)

  return { query, searchError, games, pending, error, hasMore, loadMore: () => load(page.value + 1), reset }
}
