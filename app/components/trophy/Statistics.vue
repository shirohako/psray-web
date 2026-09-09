<script setup lang="ts">
import { Activity, Award, CheckCircle2, Clock3, Gauge, Timer, Trophy, Users, Zap } from 'lucide'
import type { TrophySetDetailInfo } from '~/services/trophies'

const props = defineProps<{ trophySet: TrophySetDetailInfo }>()

const overviewStats = computed(() => [
  {
    key: 'owners',
    label: 'trophy.banner.owners',
    icon: Users,
    iconClass: 'text-slate-700',
    value: fmt(props.trophySet.owners),
  },
  {
    key: 'averageProgress',
    label: 'trophy.banner.averageProgress',
    icon: Activity,
    iconClass: 'text-sky-500',
    value: `${props.trophySet.average_progress}%`,
  },
  {
    key: 'completed',
    label: 'trophy.banner.completed',
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    value: fmt(props.trophySet.completed_players),
  },
  {
    key: 'platinums',
    label: 'trophy.banner.platinums',
    icon: Trophy,
    iconClass: 'text-cyan-500',
    value: fmt(props.trophySet.platinum_achievers),
  },
])

const durationRows = computed(() => [
  {
    key: 'average',
    label: 'trophy.statistics.averageCompletion',
    icon: Timer,
    iconClass: 'text-sky-500',
    value: props.trophySet.average_completion_time,
  },
  {
    key: 'p10',
    label: 'trophy.statistics.p10Completion',
    icon: Gauge,
    iconClass: 'text-violet-500',
    value: props.trophySet.p10_completion_time,
  },
  {
    key: 'fastest',
    label: 'trophy.statistics.fastestCompletion',
    icon: Zap,
    iconClass: 'text-amber-500',
    value: props.trophySet.fastest_completion_time,
  },
])

// Without add-on groups, earning the platinum and reaching 100% describe the
// same finish, so the separate platinum median would only duplicate the row.
const showPlatinumTime = computed(() =>
  props.trophySet.has_trophy_groups
  && props.trophySet.defined_trophies.platinum > 0,
)
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-labelledby="trophy-statistics-heading">
    <header class="flex items-center gap-1.5 border-b border-slate-100 px-4 py-2.5">
      <h2 id="trophy-statistics-heading" class="text-sm font-semibold text-slate-900">
        {{ $t('trophy.statistics.title') }}
      </h2>
      <Tooltip :content="$t('trophy.statistics.updateHint')" placement="top">
        <button
          type="button"
          class="grid size-5 place-items-center rounded-full border border-slate-200 bg-white text-[11px] font-bold leading-none text-slate-400 transition hover:border-slate-300 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          :aria-label="$t('trophy.statistics.updateHint')"
        >
          ?
        </button>
      </Tooltip>
    </header>

    <dl class="grid grid-cols-2 border-b border-slate-100">
      <div
        v-for="stat in overviewStats"
        :key="stat.key"
        class="flex min-w-0 items-center gap-2.5 px-4 py-3.5 odd:border-r odd:border-slate-100 nth-[n+3]:border-t nth-[n+3]:border-slate-100"
      >
        <span class="grid size-8 shrink-0 place-items-center rounded-full bg-slate-50">
          <LucideIcon :icon="stat.icon" class="size-4" :class="stat.iconClass" />
        </span>
        <div class="flex min-w-0 flex-col leading-tight">
          <dt class="order-2 mt-0.5 truncate text-[11px] text-slate-400">{{ $t(stat.label) }}</dt>
          <dd class="order-1 truncate text-base font-bold text-slate-900 tabular-nums">{{ stat.value }}</dd>
        </div>
      </div>
    </dl>

    <div class="p-4">
      <div class="mb-2.5">
        <h3 class="text-xs font-semibold text-slate-700">{{ $t('trophy.statistics.referenceTimes') }}</h3>
        <p class="mt-0.5 text-[11px] text-slate-400">{{ $t('trophy.statistics.subtitle') }}</p>
      </div>

      <div class="rounded-lg bg-slate-50 px-3.5 py-3">
        <div class="flex items-center gap-1.5 text-[11px] text-slate-500">
          <LucideIcon :icon="Clock3" class="size-3.5 text-slate-400" />
          {{ $t('trophy.statistics.medianCompletion') }}
        </div>
        <div class="mt-1 text-sm font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
          {{ formatDuration(trophySet.median_completion_time) }}
        </div>
      </div>

      <dl class="mt-2 divide-y divide-slate-100">
        <div v-for="row in durationRows" :key="row.key" class="flex items-center gap-2 py-2.5 text-xs">
          <LucideIcon :icon="row.icon" class="size-4 shrink-0" :class="row.iconClass" />
          <dt class="min-w-0 flex-1 text-slate-500">{{ $t(row.label) }}</dt>
          <dd class="shrink-0 font-semibold text-slate-800 tabular-nums">{{ formatDuration(row.value) }}</dd>
        </div>
        <div v-if="showPlatinumTime" class="flex items-center gap-2 py-2.5 text-xs">
          <LucideIcon :icon="Award" class="size-4 shrink-0 text-cyan-500" />
          <dt class="min-w-0 flex-1 text-slate-500">{{ $t('trophy.statistics.medianPlatinum') }}</dt>
          <dd class="shrink-0 font-semibold text-slate-800 tabular-nums">{{ formatDuration(trophySet.median_platinum_time) }}</dd>
        </div>
      </dl>

      <dl class="mt-2 border-t border-slate-100 pt-3">
        <div class="relative flex items-center gap-3 overflow-hidden rounded-lg bg-slate-50 px-3.5 py-3 ring-1 ring-inset ring-slate-100">
          <span class="absolute inset-y-2 left-0 w-0.75 rounded-r-full bg-slate-300" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <dt class="text-xs font-semibold text-slate-700">{{ $t('trophy.statistics.difficult') }}</dt>
            <p class="mt-0.5 text-[10px] leading-4 text-slate-400">{{ $t('trophy.statistics.difficultHint') }}</p>
          </div>
          <dd class="grid min-w-10 shrink-0 place-items-center rounded-lg bg-white px-2.5 py-2 text-sm font-bold leading-none text-slate-800 shadow-sm ring-1 ring-inset ring-slate-200 tabular-nums">
            {{ fmt(trophySet.difficult_trophy_count) }}
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>
