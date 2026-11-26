<script setup lang="ts">
import type { SeriesBrowseItem } from '~/services/series'
import { seriesCardUrl, seriesPercent, seriesYears } from '~/utils/series'

/**
 * A series in the browser grid: its generated share card as the cover, then a
 * single row with the name in the reader's language and their own progress (or
 * how many play it). The card already shows the size and years, so the row does
 * not repeat them — except over the stage-icon mosaic a series shows until its
 * card exists, which says nothing on its own.
 */
const props = defineProps<{ series: SeriesBrowseItem }>()

const cardBase = useRuntimeConfig().public.cardBase
const card = computed(() => seriesCardUrl(cardBase, props.series, 'webp'))
const tiles = computed(() => {
  const covers = props.series.cover ? [props.series.cover.url] : props.series.covers
  return covers.slice(0, 4)
})
const years = computed(() => seriesYears(props.series))
const progress = computed(() => props.series.viewer_progress)
const percent = computed(() => (progress.value ? seriesPercent(progress.value.done, progress.value.total) : 0))

const shown = ref(false)
onMounted(() => requestAnimationFrame(() => { shown.value = true }))
</script>

<template>
  <AppLink
    :to="`/series/${series.id}`"
    class="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
  >
    <!-- The card's own 1200×630 shape, so the whole card shows uncropped. -->
    <div v-if="card" class="relative aspect-[40/21] overflow-hidden bg-[#0c0f1a]">
      <img :src="card" alt="" width="800" height="420" loading="lazy" decoding="async" class="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none" />
    </div>
    <div
      v-else
      class="grid aspect-[40/21] gap-px overflow-hidden bg-slate-200"
      :class="tiles.length >= 4 ? 'grid-cols-2 grid-rows-2' : tiles.length === 3 ? 'grid-cols-2 grid-rows-2 [&>*:first-child]:row-span-2' : tiles.length === 2 ? 'grid-cols-2' : 'grid-cols-1'"
    >
      <span v-for="src in tiles" :key="src" class="relative overflow-hidden bg-slate-100">
        <img :src="src" alt="" loading="lazy" class="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none" />
      </span>
      <span v-if="!tiles.length" class="bg-slate-100" />
    </div>

    <div class="flex flex-1 items-center gap-3 px-4 py-3">
      <h2 class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-sky-700" :title="series.localized_name" :lang="contentLang(series.display_language, series.localized_name)">
        {{ series.localized_name }}
      </h2>
      <div v-if="progress" class="flex shrink-0 items-center gap-2" :title="$t('series.progress', { done: progress.done, total: progress.total })">
        <div class="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
            :class="progress.status === 'complete' ? 'bg-cyan-500' : 'bg-slate-800'"
            :style="{ width: `${shown ? percent : 0}%` }"
          />
        </div>
        <span class="text-xs font-semibold text-slate-700 tabular-nums">{{ progress.done }}/{{ progress.total }}</span>
      </div>
      <span v-else class="shrink-0 text-xs text-slate-400 tabular-nums">{{ $t('series.players', { count: fmt(series.popularity) }) }}</span>
    </div>
    <p v-if="!card" class="-mt-2 flex flex-wrap gap-x-3 px-4 pb-3 text-xs text-slate-500 tabular-nums">
      <span>{{ $t('series.stageCount', series.stage_count) }}</span>
      <span>{{ $t('series.trophySetCount', series.trophy_set_count) }}</span>
      <span v-if="years">{{ years }}</span>
    </p>
  </AppLink>
</template>
