<script setup lang="ts">
import { Search, X } from 'lucide'
import {
  RECENTLY_PLAYED_SEARCH_MAX_KEYWORDS,
  RECENTLY_PLAYED_SEARCH_MAX_LENGTH,
  RECENTLY_PLAYED_SEARCH_MIN_KEYWORD_LENGTH,
  validateRecentlyPlayedSearch,
  type RecentlyPlayedSearchError,
} from '~/utils/recentlyPlayedSearch'

/**
 * Search box over a profile's recently played list. Edits stay local until
 * the form is submitted; a search outside the API's keyword bounds is held
 * back with the reason shown under the box.
 */
const props = defineProps<{
  /** The submitted search (from the URL). */
  query: string
  /** True while the list loads; holds off another submit. */
  pending: boolean
}>()
const emit = defineEmits<{ search: [query: string] }>()

const searchInput = ref(props.query)
const searchError = ref<RecentlyPlayedSearchError | null>(null)

function submitSearch() {
  const result = validateRecentlyPlayedSearch(searchInput.value)
  searchError.value = result.error
  if (result.error) return

  searchInput.value = result.query
  emit('search', result.query)
}

function clearSearch() {
  searchInput.value = ''
  searchError.value = null
  if (props.query) emit('search', '')
}

// Back/Forward can change the submitted search; mirror it in the input.
watch(() => props.query, (query) => {
  searchInput.value = query
  searchError.value = null
})

watch(searchInput, () => {
  if (searchError.value) searchError.value = null
})
</script>

<template>
  <form class="border-b border-slate-100 px-4 py-3 sm:px-5" role="search" novalidate @submit.prevent="submitSearch">
    <div class="relative">
      <LucideIcon :icon="Search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        v-model="searchInput"
        type="search"
        :maxlength="RECENTLY_PLAYED_SEARCH_MAX_LENGTH"
        :aria-label="$t('profile.recent.search')"
        :aria-invalid="Boolean(searchError)"
        :placeholder="$t('profile.recent.searchPlaceholder')"
        class="profile-recent-search h-9 w-full rounded-md border bg-slate-50/60 pl-9 pr-18 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2"
        :class="searchError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'"
      />
      <button
        v-if="searchInput"
        type="button"
        class="absolute right-9 top-1.5 grid size-6 place-items-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
        :aria-label="$t('profile.recent.clearSearch')"
        @click="clearSearch"
      >
        <LucideIcon :icon="X" class="size-3.5" />
      </button>
      <button
        type="submit"
        class="absolute right-1 top-1 grid size-7 place-items-center rounded text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:cursor-wait disabled:opacity-40"
        :aria-label="$t('profile.recent.searchSubmit')"
        :disabled="pending"
      >
        <LucideIcon :icon="Search" class="size-3.5" />
      </button>
    </div>
    <p v-if="searchError" class="mt-1.5 text-xs text-red-600" role="alert">
      {{ $t(`profile.recent.searchErrors.${searchError}`, {
        min: RECENTLY_PLAYED_SEARCH_MIN_KEYWORD_LENGTH,
        max: RECENTLY_PLAYED_SEARCH_MAX_KEYWORDS,
        length: RECENTLY_PLAYED_SEARCH_MAX_LENGTH,
      }) }}
    </p>
  </form>
</template>

<style scoped>
.profile-recent-search::-webkit-search-cancel-button,
.profile-recent-search::-webkit-search-decoration {
  appearance: none;
  -webkit-appearance: none;
}
</style>
