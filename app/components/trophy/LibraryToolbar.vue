<script setup lang="ts">
import { ChevronDown, LayoutGrid, List, RotateCcw, Search, SlidersHorizontal, X } from 'lucide'
import {
  LIBRARY_PLATFORMS,
  TROPHY_SEARCH_MIN_LENGTH,
  type LibraryCategory,
  type LibraryFilters,
} from '~/utils/trophyLibrary'

/**
 * Browse controls over the trophy library: category tabs, search, platform
 * filter, reference-time and list/grid switches, the advanced filters, and a
 * chip per active filter to clear it. Filter changes go up as patches for the
 * page to write into the URL.
 */
const props = defineProps<{
  /** Category in effect (a search always lists newest first). */
  category: LibraryCategory
  /** Filters in effect, from the URL. */
  filters: LibraryFilters
}>()

const emit = defineEmits<{
  category: [category: LibraryCategory]
  filters: [filters: Partial<LibraryFilters>]
  reset: []
}>()

/** Text in the search box. The page owns it, so its own reset can clear it too. */
const searchInput = defineModel<string>('search', { required: true })
const view = defineModel<'grid' | 'list'>('view', { required: true })
const showReferenceTimes = defineModel<boolean>('showReferenceTimes', { required: true })

const { t } = useI18n()
const toast = useToast()

const categories = [
  { key: 'trending' },
  { key: 'new' },
  { key: 'popular' },
] as const
const advancedOpen = ref(false)
const platforms = LIBRARY_PLATFORMS
const fields = [
  { key: 'platinum', options: ['all', 'yes', 'no'] },
  { key: 'owners', options: ['all', 'under100', 'from100', 'from1000', 'from10000'] },
  { key: 'rate', options: ['all', 'under5', 'from5', 'from15', 'from30', 'from50'] },
] as const

const normalizedSearchInput = computed(() => searchInput.value.trim())
const searchTooShort = computed(() => normalizedSearchInput.value.length > 0 && normalizedSearchInput.value.length < TROPHY_SEARCH_MIN_LENGTH)
const canSubmitSearch = computed(() => normalizedSearchInput.value.length >= TROPHY_SEARCH_MIN_LENGTH)
const searching = computed(() => Boolean(props.filters.search))

const chips = computed(() => [
  ...(props.filters.search ? [{ id: 'search', label: props.filters.search, clear: clearSearch }] : []),
  ...props.filters.platforms.map(platform => ({ id: platform, label: platformLabel(platform), clear: () => togglePlatform(platform) })),
  ...fields
    .filter(field => props.filters[field.key] !== 'all')
    .map(field => ({
      id: field.key,
      label: `${t(`library.advanced.${field.key}`)}: ${t(`library.options.${field.key}.${props.filters[field.key]}`)}`,
      clear: () => setFilters({ [field.key]: 'all' }),
    })),
])

function setFilters(value: Partial<LibraryFilters>) {
  emit('filters', value)
}

function clearSearch() {
  searchInput.value = ''
  setFilters({ search: '' })
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
  setFilters({ search: normalizedSearchInput.value.slice(0, 100) })
}

function togglePlatform(platform: string) {
  const selected = props.filters.platforms
  setFilters({
    platforms: selected.includes(platform)
      ? selected.filter(value => value !== platform)
      : [...selected, platform],
  })
}
</script>

<template>
  <section :aria-label="$t('library.advanced.title')">
    <div class="flex flex-col gap-2 p-3 sm:px-4 lg:flex-row lg:items-center">
      <nav class="grid shrink-0 grid-cols-3 rounded-md bg-slate-100 p-1 lg:w-auto" :aria-label="$t('library.browseBy')">
        <button
          v-for="item in categories"
          :key="item.key"
          :aria-pressed="category === item.key"
          :disabled="searching && item.key !== 'new'"
          class="h-8 whitespace-nowrap rounded px-2.5 text-[11px] font-semibold transition disabled:cursor-default disabled:opacity-40 sm:px-3"
          :class="category === item.key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70' : 'text-slate-500 hover:text-slate-900'"
          @click="emit('category', item.key)"
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
          <button :aria-pressed="!filters.platforms.length" class="rounded px-2 py-1 text-[11px] font-medium" :class="!filters.platforms.length ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'" @click="setFilters({ platforms: [] })">
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
        <SelectMenu
          :model-value="filters[field.key]"
          :options="field.options.map(option => ({ value: option, label: $t(`library.options.${field.key}.${option}`) }))"
          size="sm"
          class="w-full"
          @update:model-value="setFilters({ [field.key]: $event })"
        />
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
      <button class="ml-auto flex items-center gap-1 whitespace-nowrap text-[11px] text-slate-500 hover:text-slate-900" @click="emit('reset')">
        <LucideIcon :icon="RotateCcw" class="size-3" />{{ $t('library.reset') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.filter-field { display: flex; min-width: 0; flex-direction: column; gap: 6px; font-size: 11px; color: var(--color-slate-500); }
input[type='search']::-webkit-search-cancel-button { -webkit-appearance: none; }
</style>
