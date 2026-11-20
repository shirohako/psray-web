<script setup lang="ts">
import type { SeriesBrowseItem } from '~/services/series'
import { seriesPercent, seriesYears } from '~/utils/series'

/**
 * A series in the browser grid: a mosaic of stage icons, the name, its size
 * and years, then the signed-in reader's own progress (or how many play it).
 */
const props = defineProps<{ series: SeriesBrowseItem }>()

const tiles = computed(() => {
  const covers = props.series.cover_url ? [props.series.cover_url] : props.series.covers
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
    <div
      class="grid aspect-[16/9] gap-px overflow-hidden bg-slate-200"
      :class="tiles.length >= 4 ? 'grid-cols-2 grid-rows-2' : tiles.length === 3 ? 'grid-cols-2 grid-rows-2 [&>*:first-child]:row-span-2' : tiles.length === 2 ? 'grid-cols-2' : 'grid-cols-1'"
    >
      <span v-for="src in tiles" :key="src" class="relative overflow-hidden bg-slate-100">
        <img :src="src" alt="" loading="lazy" class="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none" />
      </span>
      <span v-if="!tiles.length" class="bg-slate-100" />
    </div>

    <div class="flex flex-1 flex-col gap-1.5 p-4">
      <h2 class="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-sky-700" :lang="series.display_language ?? undefined">
        {{ series.localized_name }}
      </h2>
      <p class="text-xs text-slate-500 tabular-nums">
        {{ $t('series.stageCount', series.stage_count) }} · {{ $t('series.trophySetCount', series.trophy_set_count) }}<template v-if="years"> · {{ years }}</template>
      </p>

      <div v-if="progress" class="mt-auto flex items-center gap-2.5 pt-2">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
            :class="progress.status === 'complete' ? 'bg-cyan-500' : 'bg-slate-800'"
            :style="{ width: `${shown ? percent : 0}%` }"
          />
        </div>
        <span class="text-xs font-semibold text-slate-700 tabular-nums">{{ progress.done }}/{{ progress.total }}</span>
      </div>
      <p v-else class="mt-auto pt-2 text-xs text-slate-400 tabular-nums">{{ $t('series.players', { count: fmt(series.popularity) }) }}</p>
    </div>
  </AppLink>
</template>
