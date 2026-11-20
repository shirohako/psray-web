<script setup lang="ts">
import { Check } from 'lucide'
import type { SeriesStatus } from '~/services/series'

/** A player's overall standing in a series: fully cleared, partly cleared, in progress or not started. */
defineProps<{ status: SeriesStatus; size?: 'sm' | 'md' }>()

const TONE: Record<SeriesStatus, string> = {
  complete: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  partial: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  started: 'bg-slate-100 text-slate-600 ring-slate-200',
  none: 'bg-white text-slate-400 ring-slate-200',
}
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-1 rounded-full font-semibold ring-1 ring-inset"
    :class="[TONE[status], size === 'sm' ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-xs']"
  >
    <LucideIcon v-if="status === 'complete'" :icon="Check" class="size-3" stroke-width="3" />
    {{ $t(`series.status.${status}`) }}
  </span>
</template>
