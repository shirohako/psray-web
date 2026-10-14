<script setup lang="ts">
import { Gamepad2, LibraryBig, RotateCcw, Search, X } from 'lucide'
import type { GameBrowseItem, GameBrowseMeta } from '~/services/games'
import {
  emptyGameLibraryFilters,
  GAME_FILTER_PLATFORMS,
  GAME_PAGE_SIZE,
  gameBrowsePath,
  gameBrowseQuery,
  gameLibraryRouteQuery,
  parseGameLibraryQuery,
  type GameLibraryFilters,
} from '~/utils/gameLibrary'
import { TROPHY_SEARCH_MIN_LENGTH } from '~/utils/trophyLibrary'

const { t } = useI18n()
const { acceptLanguage } = usePreferences()
const toast = useToast()
useSeo({ title: () => t('seo.games.title'), description: () => t('seo.games.description') })

const route = useRoute()
const router = useRouter()
// Filters and page live in the URL so Back/Forward and shared links restore the same listing.
const state = computed(() => parseGameLibraryQuery(route.query))
const filters = computed(() => state.value.filters)
const page = computed(() => state.value.page)

const searchInput = ref(filters.value.search)
const normalizedSearchInput = computed(() => searchInput.value.trim())
const searchTooShort = computed(() => normalizedSearchInput.value.length > 0 && normalizedSearchInput.value.length < TROPHY_SEARCH_MIN_LENGTH)
const canSubmitSearch = computed(() => normalizedSearchInput.value.length >= TROPHY_SEARCH_MIN_LENGTH)

const requestUrl = computed(() => gameBrowsePath(gameBrowseQuery(filters.value, page.value)))
// `lazy` lets client-side navigation open the page at once and show
// placeholders while the list loads; the server still waits for it.
const { data: response, status, error, refresh } = await useApiFetchRaw<GameBrowseItem[], GameBrowseMeta>(() => requestUrl.value, { lazy: true })

const games = computed(() => response.value?.data ?? [])
const meta = computed(() => response.value?.meta)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
// A lazy fetch sits at `idle` until it starts, so count that as loading too.
const pending = computed(() => status.value === 'pending' || status.value === 'idle')
useLoadingBar(pending, () => status.value === 'error')
const rangeStart = computed(() => games.value.length ? ((meta.value?.page ?? page.value) - 1) * (meta.value?.per_page ?? GAME_PAGE_SIZE) + 1 : 0)
const rangeEnd = computed(() => games.value.length ? rangeStart.value + games.value.length - 1 : 0)

const chips = computed(() => [
  ...(filters.value.search ? [{ id: 'search', label: filters.value.search, clear: clearSearch }] : []),
  ...filters.value.platforms.map(platform => ({ id: platform, label: platformLabel(platform), clear: () => togglePlatform(platform) })),
])

watch(() => filters.value.search, (search) => { searchInput.value = search })
watch(acceptLanguage, () => refresh())

/**
 * Filter changes replace the history entry and go back to page 1; page changes
 * push a new entry so Back returns to the previous page. `lang` is kept.
 */
function navigate(next: { filters?: Partial<GameLibraryFilters>, page?: number }) {
  const location = {
    query: {
      ...(route.query.lang ? { lang: route.query.lang } : {}),
      ...gameLibraryRouteQuery({ filters: { ...filters.value, ...next.filters }, page: next.page ?? 1 }),
    },
  }
  return next.page === undefined ? router.replace(location) : router.push(location)
}

function clearSearch() {
  searchInput.value = ''
  navigate({ filters: { search: '' } })
}

function submitSearch() {
  if (!normalizedSearchInput.value) {
    clearSearch()
    return
  }
  if (!canSubmitSearch.value) {
    toast.warning({ id: 'game-search-min-length', title: t('games.searchMinLength', { count: TROPHY_SEARCH_MIN_LENGTH }) })
    return
  }
  navigate({ filters: { search: normalizedSearchInput.value.slice(0, 100) } })
}

function togglePlatform(platform: string) {
  const selected = filters.value.platforms
  navigate({
    filters: {
      platforms: selected.includes(platform) ? selected.filter(value => value !== platform) : [...selected, platform],
    },
  })
}

function reset() {
  searchInput.value = ''
  navigate({ filters: emptyGameLibraryFilters() })
}

function changePage(value: number) {
  navigate({ page: value })
  document.getElementById('game-results')?.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <div class="space-y-5">
    <header class="flex items-start gap-3 pb-1 pt-1">
      <span class="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
        <LucideIcon :icon="LibraryBig" class="size-5" stroke-width="1.5" />
      </span>
      <div>
        <h1 class="text-xl font-bold tracking-tight text-slate-900">{{ $t('games.title') }}</h1>
        <p class="mt-1.5 text-xs leading-5 text-slate-500">{{ $t('games.description') }}</p>
      </div>
    </header>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div>
        <div class="p-3 sm:px-4">
          <form role="search" novalidate @submit.prevent="submitSearch">
            <div class="relative">
              <input
                v-model="searchInput"
                type="search"
                minlength="2"
                maxlength="100"
                :aria-label="$t('games.search')"
                :aria-invalid="searchTooShort"
                :placeholder="$t('games.search')"
                class="h-9 w-full rounded-md border border-slate-200 bg-slate-50/60 pl-3 pr-16 text-xs outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
              <button v-if="searchInput" type="button" class="absolute right-9 top-1.5 grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-200" :aria-label="$t('games.clearSearch')" @click="clearSearch">
                <LucideIcon :icon="X" class="size-3.5" />
              </button>
              <button
                type="submit"
                class="absolute right-1 top-1 grid size-7 place-items-center rounded text-white transition"
                :class="canSubmitSearch ? 'bg-slate-900 hover:bg-slate-700' : 'bg-slate-400 hover:bg-slate-500'"
                :aria-label="$t('games.searchSubmit')"
              >
                <LucideIcon :icon="Search" class="size-3.5" />
              </button>
            </div>
          </form>
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 px-4 py-2.5">
          <span class="text-[11px] text-slate-400">{{ $t('games.platforms') }}</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              :aria-pressed="!filters.platforms.length"
              class="rounded px-2 py-1 text-[11px] font-medium"
              :class="!filters.platforms.length ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'"
              @click="navigate({ filters: { platforms: [] } })"
            >
              {{ $t('games.allPlatforms') }}
            </button>
            <button
              v-for="platform in GAME_FILTER_PLATFORMS"
              :key="platform"
              :aria-pressed="filters.platforms.includes(platform)"
              class="rounded px-2 py-1 text-[11px] font-medium"
              :class="filters.platforms.includes(platform) ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
              @click="togglePlatform(platform)"
            >
              {{ platformLabel(platform) }}
            </button>
          </div>
          <span class="text-[10px] text-slate-400">{{ $t('games.multiSelect') }}</span>
        </div>

        <div v-if="chips.length" class="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2.5">
          <button
            v-for="chip in chips"
            :key="chip.id"
            :aria-label="$t('games.removeFilter', { name: chip.label })"
            class="inline-flex max-w-full items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-600 hover:border-slate-400"
            @click="chip.clear"
          >
            <span class="truncate">{{ chip.label }}</span><LucideIcon :icon="X" class="size-3 shrink-0" />
          </button>
          <button class="ml-auto flex items-center gap-1 whitespace-nowrap text-[11px] text-slate-500 hover:text-slate-900" @click="reset">
            <LucideIcon :icon="RotateCcw" class="size-3" />{{ $t('games.reset') }}
          </button>
        </div>
      </div>

      <section id="game-results" class="scroll-mt-20 border-t border-slate-200" :aria-label="$t('games.results')" :aria-busy="pending">
        <div v-if="meta && !error && totalPages > 1" class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
          <p class="text-[11px] text-slate-400">{{ $t('games.range', { start: rangeStart, end: rangeEnd, total: meta.total }) }}</p>
          <Pagination :page="page" :total-pages="totalPages" :siblings="2" @update:page="changePage" />
        </div>
        <!-- The listing almost always spans pages, so hold the bar's place on first load -->
        <div v-else-if="pending && !meta" class="animate-skeleton-in flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5" aria-hidden="true">
          <div class="skeleton skeleton-soft h-3 w-36 rounded" />
          <div class="flex items-center gap-1.5">
            <div v-for="i in 3" :key="i" class="skeleton skeleton-soft size-7 rounded-md" />
          </div>
        </div>

        <div v-if="error && !pending" class="px-6 py-16 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-400"><LucideIcon :icon="Gamepad2" class="size-5" /></span>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('games.loadError') }}</h3>
          <p class="mt-2 text-xs text-slate-500">{{ $t('games.loadErrorHint') }}</p>
          <button class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="refresh()">{{ $t('games.retry') }}</button>
        </div>

        <!-- Loaded games, or (first load) placeholders on the same grid -->
        <div
          v-else-if="games.length || pending"
          class="grid grid-cols-2 gap-x-3 gap-y-6 p-3 transition-opacity sm:grid-cols-3 sm:gap-x-4 sm:p-4 md:grid-cols-4 xl:grid-cols-6"
          :class="pending && games.length ? 'opacity-55' : ''"
        >
          <template v-if="games.length">
            <GameCard v-for="game in games" :key="game.id" :game="game" />
          </template>
          <template v-else>
            <GameCardSkeleton v-for="index in 12" :key="index" :index="index - 1" />
          </template>
        </div>

        <div v-else class="px-6 py-16 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><LucideIcon :icon="Gamepad2" class="size-5" /></span>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('games.empty') }}</h3>
          <p class="mt-2 text-xs text-slate-500">{{ $t('games.emptyHint') }}</p>
          <button class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="reset">{{ $t('games.reset') }}</button>
        </div>

        <div v-if="meta && !error" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4">
          <p role="status" class="text-[11px] text-slate-400">{{ $t('games.range', { start: rangeStart, end: rangeEnd, total: meta.total }) }}</p>
          <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" :siblings="2" @update:page="changePage" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
input[type='search']::-webkit-search-cancel-button { -webkit-appearance: none; }
</style>
