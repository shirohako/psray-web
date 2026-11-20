<script setup lang="ts">
import { Layers, Search, X } from 'lucide'
import type { SeriesBrowseItem, SeriesBrowseMeta, SeriesSort } from '~/services/series'
import {
  parseSeriesLibraryQuery,
  SERIES_PAGE_SIZE,
  SERIES_SORTS,
  seriesBrowsePath,
  seriesLibraryRouteQuery,
  type SeriesLibraryState,
} from '~/utils/series'
import { TROPHY_SEARCH_MIN_LENGTH } from '~/utils/trophyLibrary'

const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const router = useRouter()

// Search, sort and page live in the URL so Back/Forward and shared links restore the same listing.
const state = computed(() => parseSeriesLibraryQuery(route.query))
const page = computed(() => state.value.page)

const searchInput = ref(state.value.search)
const normalizedSearchInput = computed(() => searchInput.value.trim())
const canSubmitSearch = computed(() => normalizedSearchInput.value.length >= TROPHY_SEARCH_MIN_LENGTH)

// The API plugin sends the reader's token (server render included), so a
// signed-in reader gets their own progress on each card.
const { data: response, status, error, refresh } = await useApiFetchRaw<SeriesBrowseItem[], SeriesBrowseMeta>(
  () => seriesBrowsePath(state.value),
  { lazy: true },
)

const series = computed(() => response.value?.data ?? [])
const meta = computed(() => response.value?.meta)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
const pending = useFetchPending(status)
const rangeStart = computed(() => series.value.length ? ((meta.value?.page ?? page.value) - 1) * (meta.value?.per_page ?? SERIES_PAGE_SIZE) + 1 : 0)
const rangeEnd = computed(() => series.value.length ? rangeStart.value + series.value.length - 1 : 0)

const { failed } = useListResponse({ error, meta, page })

useSeo({
  title: () => (page.value > 1 ? t('seo.paged', { title: t('seo.series.title'), page: page.value }) : t('seo.series.title')),
  description: () => t('seo.series.description'),
  // Each page of the popular list is indexed; searches and other orders are views of it.
  canonicalQuery: () => seriesLibraryRouteQuery({ search: '', sort: 'popular', page: page.value }),
  noindex: () => Boolean(state.value.search) || state.value.sort !== 'popular' || failed.value,
})

watch(() => state.value.search, (search) => { searchInput.value = search })

function locationFor(next: Partial<SeriesLibraryState>) {
  return localizeTo({ query: seriesLibraryRouteQuery({ ...state.value, page: 1, ...next }) })
}

/** Search and sort replace the history entry and go back to page 1; paging pushes. */
function navigate(next: Partial<SeriesLibraryState>) {
  const location = locationFor(next)
  return next.page === undefined ? router.replace(location) : router.push(location)
}

const pageHref = (value: number) => router.resolve(locationFor({ page: value })).href

function submitSearch() {
  if (!normalizedSearchInput.value) return clearSearch()
  if (!canSubmitSearch.value) {
    toast.warning({ id: 'series-search-min-length', title: t('series.searchMinLength', { count: TROPHY_SEARCH_MIN_LENGTH }) })
    return
  }
  navigate({ search: normalizedSearchInput.value.slice(0, 100) })
}

function clearSearch() {
  searchInput.value = ''
  navigate({ search: '' })
}

function changeSort(sort: SeriesSort) {
  if (sort !== state.value.sort) navigate({ sort })
}

function changePage(value: number) {
  navigate({ page: value })
  document.getElementById('series-results')?.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader :icon="Layers" :title="$t('series.title')" :description="$t('series.description')" />

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:px-4">
        <form role="search" novalidate class="min-w-0 flex-1" @submit.prevent="submitSearch">
          <div class="relative">
            <input
              v-model="searchInput"
              type="search"
              maxlength="100"
              :aria-label="$t('series.search')"
              :placeholder="$t('series.search')"
              class="h-9 w-full rounded-md border border-slate-200 bg-slate-50/60 pl-3 pr-16 text-xs outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
            <button v-if="searchInput" type="button" class="absolute right-9 top-1.5 grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-200" :aria-label="$t('series.clearSearch')" @click="clearSearch">
              <LucideIcon :icon="X" class="size-3.5" />
            </button>
            <button
              type="submit"
              class="absolute right-1 top-1 grid size-7 place-items-center rounded text-white transition"
              :class="canSubmitSearch ? 'bg-slate-900 hover:bg-slate-700' : 'bg-slate-400 hover:bg-slate-500'"
              :aria-label="$t('series.searchSubmit')"
            >
              <LucideIcon :icon="Search" class="size-3.5" />
            </button>
          </div>
        </form>

        <div class="flex shrink-0 items-center gap-1 rounded-md bg-slate-100 p-0.5" role="group" :aria-label="$t('series.sort.label')">
          <button
            v-for="sort in SERIES_SORTS"
            :key="sort"
            type="button"
            class="rounded px-2.5 py-1 text-xs font-medium transition"
            :class="state.sort === sort ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            :aria-pressed="state.sort === sort"
            @click="changeSort(sort)"
          >
            {{ $t(`series.sort.${sort}`) }}
          </button>
        </div>
      </div>

      <section id="series-results" class="scroll-mt-20 border-t border-slate-200" :aria-label="$t('series.results')" :aria-busy="pending">
        <div v-if="meta && !error && totalPages > 1" class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
          <p class="text-[11px] text-slate-400">{{ $t('series.range', { start: rangeStart, end: rangeEnd, total: meta.total }) }}</p>
          <Pagination :page="page" :total-pages="totalPages" :siblings="2" :href-for="pageHref" @update:page="changePage" />
        </div>

        <div v-if="error && !pending" class="px-6 py-16 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-400"><LucideIcon :icon="Layers" class="size-5" /></span>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('series.loadError') }}</h3>
          <p class="mt-2 text-xs text-slate-500">{{ $t('series.loadErrorHint') }}</p>
          <button class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="refresh()">{{ $t('common.retry') }}</button>
        </div>

        <div
          v-else-if="series.length || pending"
          class="grid grid-cols-1 gap-4 p-3 transition-opacity sm:grid-cols-2 sm:p-4 lg:grid-cols-3"
          :class="pending && series.length ? 'opacity-55' : ''"
        >
          <template v-if="series.length">
            <SeriesCard v-for="item in series" :key="item.id" :series="item" />
          </template>
          <template v-else>
            <SeriesCardSkeleton v-for="index in 6" :key="index" />
          </template>
        </div>

        <div v-else class="px-6 py-16 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><LucideIcon :icon="Layers" class="size-5" /></span>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('series.empty') }}</h3>
          <p class="mt-2 text-xs text-slate-500">{{ $t('series.emptyHint') }}</p>
          <button v-if="state.search" class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="clearSearch">{{ $t('series.reset') }}</button>
        </div>

        <div v-if="meta && !error && series.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4">
          <p role="status" class="text-[11px] text-slate-400">{{ $t('series.range', { start: rangeStart, end: rangeEnd, total: meta.total }) }}</p>
          <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" :siblings="2" :href-for="pageHref" @update:page="changePage" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
input[type='search']::-webkit-search-cancel-button { -webkit-appearance: none; }
</style>
