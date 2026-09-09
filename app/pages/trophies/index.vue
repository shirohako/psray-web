<script setup lang="ts">
import { ChevronDown, Gamepad2, LayoutGrid, List, RotateCcw, Search, SlidersHorizontal, Trophy, X } from 'lucide'
import type { TrophyBrowseItem, TrophyBrowseMeta } from '~/services/trophies'
import { emptyLibraryFilters, TROPHY_SEARCH_MIN_LENGTH, trophyBrowsePath, trophyBrowseQuery, type LibraryCategory } from '~/utils/trophyLibrary'

const { t } = useI18n()
const { acceptLanguage } = usePreferences()
const toast = useToast()
useSeo({ title: () => t('library.title'), description: () => t('library.description') })

const category = ref<LibraryCategory>('trending')
const categories = [
  { key: 'trending' },
  { key: 'new' },
  { key: 'popular' },
] as const
const filters = reactive(emptyLibraryFilters())
const searchInput = ref('')
const advancedOpen = ref(false)
const view = ref<'grid' | 'list'>('list')
const showReferenceTimes = ref(true)
const page = ref(1)
const pageSize = 24
const platforms = ['PS5', 'PS4', 'PS3', 'PSVITA', 'PSPC']
const fields = [
  { key: 'platinum', options: ['all', 'yes', 'no'] },
  { key: 'owners', options: ['all', 'under100', 'from100', 'from1000', 'from10000'] },
  { key: 'rate', options: ['all', 'under5', 'from5', 'from15', 'from30', 'from50'] },
] as const

const normalizedSearchInput = computed(() => searchInput.value.trim())
const searchTooShort = computed(() => normalizedSearchInput.value.length > 0 && normalizedSearchInput.value.length < TROPHY_SEARCH_MIN_LENGTH)
const canSubmitSearch = computed(() => normalizedSearchInput.value.length >= TROPHY_SEARCH_MIN_LENGTH)
const searching = computed(() => Boolean(filters.search.trim()))
const activeCategory = computed<LibraryCategory>(() => searching.value ? 'new' : category.value)
const requestQuery = computed(() => trophyBrowseQuery(activeCategory.value, filters, page.value, pageSize))
const requestUrl = computed(() => trophyBrowsePath(requestQuery.value))
const { data: response, status, error, refresh } = await useApiFetchRaw<TrophyBrowseItem[], TrophyBrowseMeta>(() => requestUrl.value)

const games = computed(() => response.value?.data ?? [])
const meta = computed(() => response.value?.meta)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
const pending = computed(() => status.value === 'pending')
const rangeStart = computed(() => games.value.length ? ((meta.value?.page ?? page.value) - 1) * (meta.value?.per_page ?? pageSize) + 1 : 0)
const rangeEnd = computed(() => games.value.length ? rangeStart.value + games.value.length - 1 : 0)

const chips = computed(() => [
  ...(filters.search ? [{ id: 'search', label: filters.search, clear: clearSearch }] : []),
  ...filters.platforms.map(platform => ({ id: platform, label: platformLabel(platform), clear: () => togglePlatform(platform) })),
  ...fields
    .filter(field => filters[field.key] !== 'all')
    .map(field => ({
      id: field.key,
      label: `${t(`library.advanced.${field.key}`)}: ${t(`library.options.${field.key}.${filters[field.key]}`)}`,
      clear: () => { filters[field.key] = 'all' },
    })),
])

watch([
  category,
  () => filters.platforms.join('|'),
  () => filters.platinum,
  () => filters.owners,
  () => filters.rate,
], () => { page.value = 1 })
watch(acceptLanguage, () => refresh())

function clearSearch() {
  searchInput.value = ''
  filters.search = ''
  page.value = 1
}

function submitSearch() {
  if (!normalizedSearchInput.value) {
    clearSearch()
    return
  }
  if (!canSubmitSearch.value) {
    toast.warning({
      id: 'trophy-search-min-length',
      title: t('library.searchMinLength', { count: TROPHY_SEARCH_MIN_LENGTH }),
    })
    return
  }
  filters.search = normalizedSearchInput.value.slice(0, 100)
  page.value = 1
}

function togglePlatform(platform: string) {
  filters.platforms = filters.platforms.includes(platform)
    ? filters.platforms.filter(value => value !== platform)
    : [...filters.platforms, platform]
}

function reset() {
  searchInput.value = ''
  Object.assign(filters, emptyLibraryFilters())
  page.value = 1
}

function changePage(value: number) {
  page.value = value
  document.getElementById('library-results')?.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <div class="space-y-5">
    <header class="flex items-start gap-3 pb-1 pt-1">
      <span class="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
        <LucideIcon :icon="Trophy" class="size-5" stroke-width="1.5" />
      </span>
      <div>
        <h1 class="text-xl font-bold tracking-tight text-slate-900">{{ $t('library.title') }}</h1>
        <p class="mt-1.5 text-xs leading-5 text-slate-500">{{ $t('library.description') }}</p>
      </div>
    </header>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <section :aria-label="$t('library.advanced.title')">
        <div class="flex flex-col gap-2 p-3 sm:px-4 lg:flex-row lg:items-center">
          <nav class="grid shrink-0 grid-cols-3 rounded-md bg-slate-100 p-1 lg:w-auto" :aria-label="$t('library.browseBy')">
            <button
              v-for="item in categories"
              :key="item.key"
              :aria-pressed="activeCategory === item.key"
              :disabled="searching && item.key !== 'new'"
              class="h-8 whitespace-nowrap rounded px-2.5 text-[11px] font-semibold transition disabled:cursor-default disabled:opacity-40 sm:px-3"
              :class="activeCategory === item.key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70' : 'text-slate-500 hover:text-slate-900'"
              @click="category = item.key"
            >
              {{ $t(`library.categories.${item.key}`) }}
            </button>
          </nav>

          <div class="flex min-w-0 flex-1 items-center gap-2">
            <form class="min-w-0 flex-1" role="search" novalidate @submit.prevent="submitSearch">
              <div class="relative">
                <input
                  v-model="searchInput"
                  type="search"
                  minlength="2"
                  maxlength="100"
                  :aria-label="$t('library.search')"
                  :aria-invalid="searchTooShort"
                  :placeholder="$t('library.search')"
                  class="h-9 w-full rounded-md border border-slate-200 bg-slate-50/60 pl-3 pr-16 text-xs outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
                <button v-if="searchInput" type="button" class="absolute right-9 top-1.5 grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-200" :aria-label="$t('library.clearSearch')" @click="clearSearch">
                  <LucideIcon :icon="X" class="size-3.5" />
                </button>
                <button
                  type="submit"
                  class="absolute right-1 top-1 grid size-7 place-items-center rounded text-white transition"
                  :class="canSubmitSearch ? 'bg-slate-900 hover:bg-slate-700' : 'bg-slate-400 hover:bg-slate-500'"
                  :aria-label="$t('library.searchSubmit')"
                >
                  <LucideIcon :icon="Search" class="size-3.5" />
                </button>
              </div>
            </form>
            <button
              :aria-expanded="advancedOpen"
              aria-controls="library-advanced"
              class="flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50"
              @click="advancedOpen = !advancedOpen"
            >
              <LucideIcon :icon="SlidersHorizontal" class="size-3.5" />
              {{ $t('library.advanced.title') }}
              <LucideIcon :icon="ChevronDown" class="size-3 transition-transform" :class="advancedOpen ? 'rotate-180' : ''" />
            </button>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 px-4 py-2.5">
          <div class="flex min-w-0 basis-full flex-wrap items-center gap-x-4 gap-y-2 sm:basis-auto sm:flex-1">
            <span class="text-[11px] text-slate-400">{{ $t('library.platforms') }}</span>
            <div class="flex flex-wrap gap-1.5">
              <button :aria-pressed="!filters.platforms.length" class="rounded px-2 py-1 text-[11px] font-medium" :class="!filters.platforms.length ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'" @click="filters.platforms = []">
                {{ $t('library.allPlatforms') }}
              </button>
              <button
                v-for="platform in platforms"
                :key="platform"
                :aria-pressed="filters.platforms.includes(platform)"
                class="rounded px-2 py-1 text-[11px] font-medium"
                :class="filters.platforms.includes(platform) ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
                @click="togglePlatform(platform)"
              >
                {{ platformLabel(platform) }}
              </button>
            </div>
            <span class="text-[10px] text-slate-400">{{ $t('library.multiSelect') }}</span>
          </div>
          <div class="flex w-full shrink-0 items-center justify-between gap-2 border-t border-slate-100 pt-2 sm:ml-auto sm:w-auto sm:justify-start sm:border-t-0 sm:pt-0">
            <label class="flex cursor-pointer select-none items-center gap-1.5 whitespace-nowrap text-[11px] text-slate-500">
              <input v-model="showReferenceTimes" type="checkbox" class="size-3.5 accent-slate-900" />
              {{ $t('library.showReferenceTimes') }}
            </label>
            <div class="flex gap-0.5 border-l border-slate-200 pl-2">
              <button
                v-for="item in (['list', 'grid'] as const)"
                :key="item"
                :aria-label="$t(`library.${item}`)"
                :aria-pressed="view === item"
                class="grid size-7 place-items-center rounded-md transition"
                :class="view === item ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'"
                @click="view = item"
              >
                <LucideIcon :icon="item === 'grid' ? LayoutGrid : List" class="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div v-show="advancedOpen" id="library-advanced" class="grid grid-cols-1 gap-3 border-t border-slate-100 bg-slate-50/40 p-3 sm:grid-cols-3 sm:px-4">
          <label v-for="field in fields" :key="field.key" class="filter-field">
            <span>{{ $t(`library.advanced.${field.key}`) }}</span>
            <select v-model="filters[field.key]">
              <option v-for="option in field.options" :key="option" :value="option">{{ $t(`library.options.${field.key}.${option}`) }}</option>
            </select>
          </label>
        </div>

        <div v-if="chips.length" class="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2.5">
          <button
            v-for="chip in chips"
            :key="chip.id"
            :aria-label="$t('library.removeFilter', { name: chip.label })"
            class="inline-flex max-w-full items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-600 hover:border-slate-400"
            @click="chip.clear"
          >
            <span class="truncate">{{ chip.label }}</span><LucideIcon :icon="X" class="size-3 shrink-0" />
          </button>
          <button class="ml-auto flex items-center gap-1 whitespace-nowrap text-[11px] text-slate-500 hover:text-slate-900" @click="reset">
            <LucideIcon :icon="RotateCcw" class="size-3" />{{ $t('library.reset') }}
          </button>
        </div>
      </section>

      <section id="library-results" class="scroll-mt-20 border-t border-slate-200" :aria-label="$t('library.results')" :aria-busy="pending">
        <div v-if="pending && !games.length" class="divide-y divide-slate-100">
          <div v-for="index in 6" :key="index" class="flex items-center gap-4 px-4 py-4">
            <div class="h-16 w-20 shrink-0 animate-pulse rounded-lg bg-slate-200 sm:w-24" />
            <div class="min-w-0 flex-1 space-y-2">
              <div class="h-3.5 w-2/5 animate-pulse rounded bg-slate-200" />
              <div class="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
              <div class="h-3 w-3/5 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </div>

        <div v-else-if="error" class="px-6 py-16 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-400"><LucideIcon :icon="Gamepad2" class="size-5" /></span>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('library.loadError') }}</h3>
          <p class="mt-2 text-xs text-slate-500">{{ $t('library.loadErrorHint') }}</p>
          <button class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="refresh()">{{ $t('library.retry') }}</button>
        </div>

        <div v-else-if="games.length" class="transition-opacity" :class="pending ? 'opacity-55' : ''">
          <div v-if="view === 'list'" class="list-head border-b border-slate-100 bg-slate-50/70 text-[10px] text-slate-400" :class="{ 'no-reference-times': !showReferenceTimes }" aria-hidden="true">
            <span class="col-span-2">{{ $t('library.game') }}</span>
            <span>{{ $t('library.trophies') }}</span>
            <span class="text-right">{{ $t('library.players') }}</span>
            <span class="text-center">{{ $t('library.progress') }}</span>
            <span v-if="showReferenceTimes">{{ $t('library.completionTime') }}</span>
            <span />
          </div>
          <div :class="view === 'list' ? 'divide-y divide-slate-100' : 'grid grid-cols-1 gap-2.5 bg-slate-50/50 p-2 sm:gap-3 sm:p-4 lg:grid-cols-2 2xl:grid-cols-3'">
            <TrophyLibraryEntry v-for="game in games" :key="game.id" :game="game" :view="view" :show-reference-times="showReferenceTimes" />
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
          <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" @update:page="changePage" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.list-head { display: none; }
@media (min-width: 768px) {
  .list-head {
    display: grid;
    grid-template-columns: 96px minmax(160px, 1fr) 148px 100px 120px 166px 12px;
    column-gap: 12px;
    padding: 7px 16px;
  }
  .list-head.no-reference-times {
    grid-template-columns: 96px minmax(160px, 1fr) 148px 100px 120px 12px;
  }
}
.filter-field { display: flex; min-width: 0; flex-direction: column; gap: 6px; font-size: 11px; color: var(--color-slate-500); }
.filter-field select { width: 100%; height: 32px; padding: 0 8px; border: 1px solid var(--color-slate-200); border-radius: 5px; background: white; color: var(--color-slate-700); outline: none; }
.filter-field select:focus-visible { outline: 2px solid var(--color-slate-400); outline-offset: 1px; }
input[type='search']::-webkit-search-cancel-button { -webkit-appearance: none; }
</style>
