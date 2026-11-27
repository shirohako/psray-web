<script setup lang="ts">
import { ChevronRight } from 'lucide'
import type { ProfileSeriesItem } from '~/services/series'

/**
 * One series on a profile's series tab: its stage icons and name, the
 * player's stage track and standing. The `href` is the public series page;
 * a plain click opens it with this player's progress (`?psnid=`, a personal
 * view kept out of the index), as trophy links on a profile do.
 */
const props = defineProps<{ series: ProfileSeriesItem; psnid: string }>()

const { t } = useI18n()
const { href } = useLangLink()
function openWithProgress(event: MouseEvent) {
  interceptClick(event, () => navigateTo(localizeTo({ path: `/series/${props.series.id}`, query: { psnid: props.psnid } })))
}
const track = computed(() => props.series.progress.stages.map(state => ({ state })))
const summary = computed(() => t('series.viewer.done', { done: props.series.progress.done, total: props.series.progress.total }))
</script>

<template>
  <a
    :href="href(`/series/${series.id}`)"
    class="group flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4"
    @click="openWithProgress"
  >
    <div class="flex min-w-0 flex-1 items-center gap-3.5">
      <SeriesCoverStack :covers="series.covers" size="sm" />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-sky-700" :lang="contentLang(series.display_language, series.localized_name)">
          {{ series.localized_name }}
        </p>
        <p class="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-400 tabular-nums">
          <span>{{ $t('series.stageCount', series.stage_count) }}</span>
          <span v-if="series.progress.last_played_at" class="inline-flex items-center gap-1">· <LocalTime :value="series.progress.last_played_at" /></span>
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 sm:w-80 sm:shrink-0">
      <div class="min-w-0 flex-1">
        <SeriesStageTrack :stages="track" size="sm" :label="summary" />
      </div>
      <span class="w-10 shrink-0 text-right text-xs font-semibold text-slate-700 tabular-nums">{{ series.progress.done }}/{{ series.progress.total }}</span>
      <SeriesStatusBadge :status="series.progress.status" size="sm" class="w-[4.75rem] justify-center" />
      <LucideIcon :icon="ChevronRight" class="hidden size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 sm:block" />
    </div>
  </a>
</template>
