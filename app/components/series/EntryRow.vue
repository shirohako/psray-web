<script setup lang="ts">
import { ChevronRight, Globe } from 'lucide'
import type { SeriesEntry, SeriesEntryProgress } from '~/services/series'

/**
 * One version (trophy set) inside a stage: artwork, title, platforms, region
 * and trophy counts. Guests see how many played it and how many finished it; a
 * player's view always shows a progress bar, empty at 0% for a version they
 * haven't played. The row opens the trophy set, with the player's progress
 * when there is one.
 */
const props = defineProps<{
  entry: SeriesEntry
  /** The `?psnid=` player, when the page shows one. */
  psnid?: string
  progress?: SeriesEntryProgress
}>()

const { t } = useI18n()
const { href } = useLangLink()
const platforms = computed(() => platformList(props.entry.platform))
const tiers = computed(() => trophyKinds.map(kind => ({ dot: kind.dot, count: props.entry.defined_trophies[kind.key] ?? 0 })))
const complete = computed(() => props.progress?.progress === 100)
const percent = computed(() => props.progress?.progress ?? 0)
/** Hover text on the bar: says outright that 0% means never played. */
const barTitle = computed(() => (props.progress ? undefined : t('series.detail.unplayed')))

const shown = ref(false)
onMounted(() => requestAnimationFrame(() => { shown.value = true }))

function open(event: MouseEvent) {
  if (props.psnid && props.progress) openTrophyWithProgress(event, props.entry.id, props.psnid)
}
</script>

<template>
  <a
    :href="href(`/trophies/${entry.id}`)"
    class="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50 sm:gap-4"
    @click="open"
  >
    <div class="relative flex h-11 w-20 shrink-0 items-center justify-center">
      <TrophySetImage :src="entry.icon_url" :alt="entry.localized_name" :platform="platforms" />
    </div>

    <div class="min-w-0 flex-1 space-y-1">
      <p class="truncate text-sm font-medium text-slate-900 transition-colors group-hover:text-sky-700" :lang="contentLang(entry.display_language, entry.localized_name)">
        {{ entry.localized_name }}
      </p>
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
        <span
          v-for="platform in platforms"
          :key="platform"
          class="inline-flex h-4 items-center rounded px-1.5 text-[10px] font-bold leading-none"
          :class="platformBadgeClass(platform)"
        >{{ platformLabel(platform) }}</span>
        <span v-if="entry.region" class="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide text-slate-500">
          <LucideIcon :icon="Globe" class="size-3 text-slate-400" />{{ entry.region }}
        </span>
        <span v-for="(tier, index) in tiers" :key="index" class="inline-flex items-center gap-1 tabular-nums">
          <span class="size-2 rounded-full" :class="tier.dot" />{{ tier.count }}
        </span>
      </div>
      <!-- Phones: the right-hand column folds under the title -->
      <div v-if="psnid" class="flex items-center gap-2 pt-0.5 sm:hidden" :title="barTitle">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div class="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none" :class="complete ? 'bg-cyan-500' : 'bg-slate-800'" :style="{ width: `${shown ? percent : 0}%` }" />
        </div>
        <span class="w-9 text-right text-xs font-semibold tabular-nums" :class="complete ? 'text-cyan-700' : progress ? 'text-slate-700' : 'text-slate-300'">{{ percent }}%</span>
      </div>
    </div>

    <div class="hidden w-52 shrink-0 justify-end sm:flex">
      <div v-if="!psnid" class="text-right text-xs leading-5 text-slate-500 tabular-nums">
        <p>{{ $t('series.detail.owners', { count: fmt(entry.owners) }) }}</p>
        <p v-if="entry.completion_rate != null">{{ $t('series.detail.completionRate', { rate: `${entry.completion_rate}%` }) }}</p>
      </div>
      <div v-else class="flex w-full items-center gap-2.5" :title="barTitle">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div class="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none" :class="complete ? 'bg-cyan-500' : 'bg-slate-800'" :style="{ width: `${shown ? percent : 0}%` }" />
        </div>
        <span class="w-10 text-right text-xs font-semibold tabular-nums" :class="complete ? 'text-cyan-700' : progress ? 'text-slate-700' : 'text-slate-300'">{{ percent }}%</span>
      </div>
    </div>

    <LucideIcon :icon="ChevronRight" class="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
  </a>
</template>
