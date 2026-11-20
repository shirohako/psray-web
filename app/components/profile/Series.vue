<script setup lang="ts">
import { Layers } from 'lucide'
import type { ProfileSeriesFilter, ProfileSeriesItem as SeriesRow, ProfileSeriesMeta, ProfileSeriesSort } from '~/services/series'

/**
 * The profile's series tab: every series the player has played into, with
 * their standing in each. Filter by standing and sort locally; the page lives
 * in the URL like the other tabs.
 */
const props = defineProps<{ psnid: string; page: number }>()
const emit = defineEmits<{ 'update:page': [page: number] }>()

const FILTERS: ProfileSeriesFilter[] = ['all', 'complete', 'partial', 'started']
const SORTS: ProfileSeriesSort[] = ['recent', 'progress', 'name']

const filter = ref<ProfileSeriesFilter>('all')
const sort = ref<ProfileSeriesSort>('recent')
const listEl = ref<HTMLElement | null>(null)

const path = computed(() => {
  const params = new URLSearchParams({ page: String(props.page), status: filter.value, sort: sort.value })
  return `/profile/${encodeURIComponent(props.psnid)}/series?${params.toString()}`
})
const { data: res, status, error, refresh } = useApiFetchRaw<SeriesRow[], ProfileSeriesMeta>(() => path.value, { lazy: true })
const pending = useFetchPending(status)

const items = computed(() => res.value?.data ?? [])
const counts = computed(() => res.value?.meta?.counts)
const totalPages = computed(() => res.value?.meta?.total_pages ?? 1)

function filterLabel(key: ProfileSeriesFilter) {
  return key === 'all' ? 'profile.series.all' : `series.status.${key}`
}

function choose(next: { filter?: ProfileSeriesFilter; sort?: ProfileSeriesSort }) {
  if (next.filter) filter.value = next.filter
  if (next.sort) sort.value = next.sort
  if (props.page !== 1) emit('update:page', 1)
}

function changePage(value: number) {
  emit('update:page', value)
  revealTop(listEl.value)
}

watch(() => props.psnid, () => {
  filter.value = 'all'
  sort.value = 'recent'
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
      <div class="flex flex-wrap gap-1.5" role="group">
        <button
          v-for="key in FILTERS"
          :key="key"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition"
          :class="filter === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'"
          :aria-pressed="filter === key"
          @click="choose({ filter: key })"
        >
          {{ $t(filterLabel(key)) }}
          <span v-if="counts" class="tabular-nums" :class="filter === key ? 'text-white/70' : 'text-slate-400'">{{ counts[key] }}</span>
        </button>
      </div>
      <label class="inline-flex items-center gap-2 text-xs text-slate-500">
        {{ $t('profile.series.sortLabel') }}
        <select
          :value="sort"
          class="h-7 rounded-md border border-slate-200 bg-white pl-2 pr-7 text-xs text-slate-700 outline-none focus:border-slate-400"
          @change="choose({ sort: ($event.target as HTMLSelectElement).value as ProfileSeriesSort })"
        >
          <option v-for="key in SORTS" :key="key" :value="key">{{ $t(`profile.series.sort.${key}`) }}</option>
        </select>
      </label>
    </div>

    <!-- First load -->
    <div v-if="pending && !items.length" class="animate-skeleton-in divide-y divide-slate-100" aria-hidden="true">
      <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-4 py-4">
        <div class="skeleton h-9 w-16 rounded-md" />
        <div class="flex-1 space-y-2">
          <div class="skeleton h-3.5 w-1/2 rounded" />
          <div class="skeleton skeleton-soft h-3 w-1/4 rounded" />
        </div>
        <div class="skeleton skeleton-soft hidden h-1.5 w-60 rounded-full sm:block" />
      </div>
    </div>

    <div v-else-if="error && !items.length" class="px-6 py-16 text-center">
      <p class="text-sm text-slate-500">{{ $t('profile.series.loadFailed') }}</p>
      <button type="button" class="mt-3 text-xs font-semibold text-slate-700 underline underline-offset-4" @click="refresh()">{{ $t('common.retry') }}</button>
    </div>

    <div v-else-if="!items.length" class="px-6 py-16 text-center">
      <span class="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400"><LucideIcon :icon="Layers" class="size-5" /></span>
      <p class="mt-3 text-sm text-slate-500">{{ filter === 'all' ? $t('profile.series.empty') : $t('profile.series.emptyFiltered') }}</p>
    </div>

    <template v-else>
      <div ref="listEl" class="divide-y divide-slate-100 transition-opacity" :class="{ 'opacity-50': pending }">
        <ProfileSeriesItem v-for="item in items" :key="item.id" :series="item" :psnid="psnid" />
      </div>
      <div v-if="totalPages > 1" class="border-t border-slate-100 px-4 py-3">
        <Pagination :page="page" :total-pages="totalPages" :siblings="2" @update:page="changePage" />
      </div>
    </template>
  </div>
</template>
