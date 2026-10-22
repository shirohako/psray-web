<script setup lang="ts">
import { Gamepad2, Trophy } from 'lucide'
import type { TrophyBrowseItem, TrophyBrowseMeta } from '~/services/trophies'
import {
  emptyLibraryFilters,
  libraryRouteQuery,
  parseLibraryQuery,
  trophyBrowsePath,
  trophyBrowseQuery,
  type LibraryCategory,
  type LibraryFilters,
} from '~/utils/trophyLibrary'

const { t } = useI18n()
const { acceptLanguage } = usePreferences()
useSeo({ title: () => t('library.title'), description: () => t('library.description') })

const route = useRoute()
const router = useRouter()
// Category, filters and page live in the URL so Back/Forward and shared links
// restore the same listing.
const state = computed(() => parseLibraryQuery(route.query))
const category = computed(() => state.value.category)
const filters = computed(() => state.value.filters)
const page = computed(() => state.value.page)

const searchInput = ref(filters.value.search)
const view = ref<'grid' | 'list'>('list')
const showReferenceTimes = ref(true)
const pageSize = 24

const searching = computed(() => Boolean(filters.value.search))
const activeCategory = computed<LibraryCategory>(() => searching.value ? 'new' : category.value)
const requestQuery = computed(() => trophyBrowseQuery(activeCategory.value, filters.value, page.value, pageSize))
const requestUrl = computed(() => trophyBrowsePath(requestQuery.value))
// `lazy` lets client-side navigation open the page at once and show
// placeholders while the list loads; the server still waits for it.
const { data: response, status, error, refresh } = await useApiFetchRaw<TrophyBrowseItem[], TrophyBrowseMeta>(() => requestUrl.value, { lazy: true })

const games = computed(() => response.value?.data ?? [])
const meta = computed(() => response.value?.meta)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
const pending = useFetchPending(status)
const rangeStart = computed(() => games.value.length ? ((meta.value?.page ?? page.value) - 1) * (meta.value?.per_page ?? pageSize) + 1 : 0)
const rangeEnd = computed(() => games.value.length ? rangeStart.value + games.value.length - 1 : 0)

watch(() => filters.value.search, (search) => { searchInput.value = search })
watch(acceptLanguage, () => refresh())

/**
 * Filter changes replace the history entry and go back to page 1; page changes
 * push a new entry so Back returns to the previous page. `lang` is kept.
 */
function navigate(next: { category?: LibraryCategory; filters?: Partial<LibraryFilters>; page?: number }) {
  const location = {
    query: {
      ...(route.query.lang ? { lang: route.query.lang } : {}),
      ...libraryRouteQuery({
        category: next.category ?? category.value,
        filters: { ...filters.value, ...next.filters },
        page: next.page ?? 1,
      }),
    },
  }
  return next.page === undefined ? router.replace(location) : router.push(location)
}

function setFilters(value: Partial<LibraryFilters>) {
  navigate({ filters: value })
}

function reset() {
  searchInput.value = ''
  setFilters(emptyLibraryFilters())
}

function changePage(value: number) {
  navigate({ page: value })
  document.getElementById('library-results')?.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader :icon="Trophy" :title="$t('library.title')" :description="$t('library.description')" />

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <TrophyLibraryToolbar
        v-model:search="searchInput"
        v-model:view="view"
        v-model:show-reference-times="showReferenceTimes"
        :category="activeCategory"
        :filters="filters"
        @category="navigate({ category: $event })"
        @filters="setFilters"
        @reset="reset"
      />

      <section id="library-results" class="scroll-mt-20 border-t border-slate-200" :aria-label="$t('library.results')" :aria-busy="pending">
        <div v-if="meta && !error && totalPages > 1" class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
          <p class="text-[11px] text-slate-400">{{ $t('library.range', { start: rangeStart, end: rangeEnd, total: meta.total }) }}</p>
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
          <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('library.loadError') }}</h3>
          <p class="mt-2 text-xs text-slate-500">{{ $t('library.loadErrorHint') }}</p>
          <button class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="refresh()">{{ $t('library.retry') }}</button>
        </div>

        <!-- Loaded entries, or (first load) placeholders laid out on the same grid -->
        <div v-else-if="games.length || pending" class="transition-opacity" :class="pending && games.length ? 'opacity-55' : ''">
          <TrophyLibraryListHead v-if="view === 'list'" :show-reference-times="showReferenceTimes" />
          <div :class="view === 'list' ? 'divide-y divide-slate-100' : 'grid grid-cols-1 gap-2.5 bg-slate-50/50 p-2 sm:gap-3 sm:p-4 lg:grid-cols-2 2xl:grid-cols-3'">
            <template v-if="games.length">
              <TrophyLibraryEntry v-for="game in games" :key="game.id" :game="game" :view="view" :show-reference-times="showReferenceTimes" />
            </template>
            <template v-else>
              <TrophyLibraryEntrySkeleton
                v-for="index in (view === 'list' ? 8 : 6)"
                :key="index"
                :index="index - 1"
                :view="view"
                :show-reference-times="showReferenceTimes"
              />
            </template>
          </div>
        </div>

        <div v-else class="px-6 py-16 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><LucideIcon :icon="Gamepad2" class="size-5" /></span>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('library.empty') }}</h3>
          <p class="mt-2 text-xs text-slate-500">{{ $t('library.emptyHint') }}</p>
          <button class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="reset">{{ $t('library.reset') }}</button>
        </div>

        <div v-if="meta && !error" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4">
          <p role="status" class="text-[11px] text-slate-400">{{ $t('library.range', { start: rangeStart, end: rangeEnd, total: meta.total }) }}</p>
          <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" :siblings="2" @update:page="changePage" />
        </div>
      </section>
    </div>
  </div>
</template>
