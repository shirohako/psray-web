<script setup lang="ts">
import { Calendar, ChevronDown, Layers } from 'lucide'
import type { SeriesEntryProgress, SeriesStage, StageState } from '~/services/series'
import { orderStageEntries, visibleEntryCount } from '~/utils/series'

/**
 * One stage on the series timeline: its marker on the rail, then a card with
 * the stage's name and year and its versions. Only the first few versions show
 * (for a player, everything they played); the rest unfold in place.
 */
const props = defineProps<{
  stage: SeriesStage
  /** The player's state of this stage; absent for guests. */
  state?: { state: StageState; best: number }
  progress: Map<number, SeriesEntryProgress>
  psnid?: string
  /** Last stage of its section: the rail stops at the marker. */
  last?: boolean
}>()

const open = ref(false)
const entries = computed(() => orderStageEntries(props.stage.entries, props.progress))
const visible = computed(() => visibleEntryCount(props.stage.entries, props.progress))
const head = computed(() => entries.value.slice(0, visible.value))
const rest = computed(() => entries.value.slice(visible.value))
const year = computed(() => props.stage.release_date?.slice(0, 4) ?? '')
const isSide = computed(() => props.stage.kind === 'side')

const CHIP: Record<StageState, string> = {
  complete: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  platinum: 'bg-white text-cyan-700 ring-cyan-300',
  started: 'bg-slate-100 text-slate-700 ring-slate-200',
  none: 'bg-white text-slate-400 ring-slate-200',
}

watch(() => props.psnid, () => { open.value = false })
</script>

<template>
  <li class="flex gap-3 sm:gap-4">
    <!-- Rail -->
    <div class="flex w-9 shrink-0 flex-col items-center">
      <SeriesStageNode :label="stage.number" :state="state?.state ?? 'guest'" :best="state?.best" />
      <span v-if="!last" class="mt-1 w-px flex-1" :class="state?.state === 'complete' ? 'bg-cyan-200' : 'bg-slate-200'" />
    </div>

    <article class="mb-4 min-w-0 flex-1 overflow-hidden rounded-lg border bg-white shadow-sm" :class="isSide ? 'border-dashed border-slate-300' : 'border-slate-200'">
      <header class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 px-4 py-2.5">
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {{ isSide ? $t('series.detail.side') : $t('series.detail.stage', { n: stage.number }) }}
          </p>
          <h3 class="mt-0.5 text-sm font-semibold text-slate-900">{{ stage.name }}</h3>
        </div>
        <div class="flex shrink-0 items-center gap-4 text-xs text-slate-500 tabular-nums">
          <span v-if="year" class="inline-flex items-center gap-1.5">
            <LucideIcon :icon="Calendar" class="size-3.5 text-slate-400" />{{ year }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <LucideIcon :icon="Layers" class="size-3.5 text-slate-400" />{{ $t('series.detail.versions', stage.entries.length) }}
          </span>
          <span
            v-if="state"
            class="inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold ring-1 ring-inset"
            :class="CHIP[state.state]"
          >{{ $t(`series.state.${state.state}`) }}</span>
        </div>
      </header>

      <div class="divide-y divide-slate-100">
        <SeriesEntryRow v-for="entry in head" :key="entry.id" :entry="entry" :psnid="psnid" :progress="progress.get(entry.id)" />
      </div>

      <template v-if="rest.length">
        <!-- Unfolds by animating the grid row from 0fr to 1fr, so the height follows the content. -->
        <div class="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none" :class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
          <div class="divide-y divide-slate-100 overflow-hidden" :class="open ? 'border-t border-slate-100' : ''" :inert="!open">
            <SeriesEntryRow v-for="entry in rest" :key="entry.id" :entry="entry" :psnid="psnid" :progress="progress.get(entry.id)" />
          </div>
        </div>
        <button
          type="button"
          class="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          :aria-expanded="open"
          @click="open = !open"
        >
          {{ open ? $t('series.detail.showLess') : $t('series.detail.showMore', rest.length) }}
          <LucideIcon :icon="ChevronDown" class="size-3.5 transition-transform duration-300" :class="open ? 'rotate-180' : ''" />
        </button>
      </template>
    </article>
  </li>
</template>
