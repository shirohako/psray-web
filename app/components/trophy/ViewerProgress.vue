<script setup lang="ts">
import { Check, CircleAlert, Clock } from 'lucide'
import type { DefinedTrophies, ViewerProgress } from '~/services/trophies'

const props = defineProps<{
  progress: ViewerProgress
  total?: number
  definedTrophies?: DefinedTrophies
  /** Fallback when older viewer-progress responses omit the country. */
  country?: string | null
}>()

const country = computed(() => props.progress.country || props.country || '')

// Per-tier earned counts in display order (platinum → bronze).
const earned = computed(() => {
  const p = props.progress
  return [
    { key: 'platinum', count: p.earned_platinum, total: props.definedTrophies?.platinum },
    { key: 'gold', count: p.earned_gold, total: props.definedTrophies?.gold },
    { key: 'silver', count: p.earned_silver, total: props.definedTrophies?.silver },
    { key: 'bronze', count: p.earned_bronze, total: props.definedTrophies?.bronze },
  ] as const
})

const ringClass = computed(() =>
  props.progress.progress === 100 ? 'stroke-cyan-400' : 'stroke-slate-900',
)

function timestamp(value: number | string | null | undefined) {
  if (value == null || value === '') return null
  const ms = typeof value === 'number' ? value * 1000 : new Date(value).getTime()
  return Number.isNaN(ms) ? null : ms
}

// When some earned trophies have no timestamp, first/last cover only the timed
// ones, so any duration between them is wrong — show the notice instead.
const incomplete = computed(() => props.progress.timestamps_incomplete === true)

const duration = computed(() => {
  if (incomplete.value) return null
  const first = timestamp(props.progress.first_earned_at)
  const last = timestamp(props.progress.last_earned_at)
  if (first != null && last != null) return Math.max(0, Math.floor((last - first) / 1000))
  return props.progress.duration ?? null
})

// Date and time are split so the date can lead and the time recede.
function moment(value: number | string | null | undefined) {
  const ms = timestamp(value)
  if (ms == null) return null
  const date = new Date(ms)
  return {
    date: date.toLocaleDateString(currentLocale(), { year: 'numeric', month: '2-digit', day: '2-digit' }),
    time: date.toLocaleTimeString(currentLocale(), { hour: '2-digit', minute: '2-digit', hour12: false }),
  }
}

const first = computed(() => moment(props.progress.first_earned_at))
const last = computed(() => moment(props.progress.last_earned_at))

const earnedTotal = computed(() =>
  props.progress.earned_bronze
  + props.progress.earned_silver
  + props.progress.earned_gold
  + props.progress.earned_platinum,
)

function isComplete(count: number, total: number | undefined) {
  return total != null && total > 0 && count >= total
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <h2 class="mb-4 text-sm font-semibold text-slate-900">{{ $t('trophy.progress.title') }}</h2>

    <div class="flex items-center gap-3">
      <NuxtLink
        :to="`/p/${encodeURIComponent(progress.psnid)}`"
        class="group flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5 transition hover:bg-slate-50"
      >
        <img :src="progress.avatar_url" :alt="progress.psnid" class="size-12 shrink-0 rounded-full bg-slate-100 object-cover" />
        <div class="min-w-0 flex-1">
          <div class="truncate font-semibold leading-6 text-slate-900 group-hover:text-slate-700">
            <RegionFlag v-if="country" :country="country" class="mr-1.5 text-sm align-[-0.125em]" />
            <span>{{ progress.psnid }}</span>
          </div>
          <div class="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span>{{ $t('trophy.progress.earnedLabel') }}</span>
            <span class="inline-flex items-baseline gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-bold tabular-nums text-slate-800">
              <AnimatedNumber :value="earnedTotal" :duration="1400" reserve-width />
              <template v-if="total != null">
                <span class="text-slate-400">/</span>
                <span>{{ fmt(total) }}</span>
              </template>
            </span>
            <span>{{ $t('trophy.progress.trophiesUnit') }}</span>
          </div>
        </div>
      </NuxtLink>
      <TrophyProgressRing :progress="progress.progress" :bar-class="ringClass" :size="56" />
    </div>

    <div class="mt-4 grid grid-cols-4 gap-2 border-t border-slate-100 pt-4">
      <div
        v-for="t in earned"
        :key="t.key"
        class="relative inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-50 px-2 py-1.5 text-slate-900"
      >
        <span
          v-if="isComplete(t.count, t.total)"
          class="absolute -left-0.5 -top-0.5 grid size-3 place-items-center rounded-full border border-white bg-slate-700 text-white shadow-sm"
          :title="$t('trophy.progress.complete')"
        >
          <LucideIcon :icon="Check" class="size-1.75" stroke-width="3" />
        </span>
        <span class="size-2.5 shrink-0 rounded-full" :class="trophyKinds.find(k => k.key === t.key)?.dot" />
        <span class="inline-flex items-baseline gap-0.75 text-sm font-bold tabular-nums">
          <AnimatedNumber :value="t.count" :duration="1400" reserve-width />
          <template v-if="t.total != null">
            <span class="text-xs text-slate-400">/</span>
            <span>{{ t.total }}</span>
          </template>
        </span>
      </div>
    </div>

    <!-- Timeline: first trophy → time taken → latest trophy -->
    <div class="mt-4 border-t border-slate-100 pt-4">
      <div class="grid grid-cols-[0.625rem_minmax(0,1fr)_auto] grid-rows-[1.5rem_auto_1.5rem] items-center gap-x-3">
        <div class="row-span-3 flex h-full flex-col items-center self-stretch py-1.75" aria-hidden="true">
          <span class="size-2.5 shrink-0 rounded-full border-2 border-slate-300 bg-white" />
          <span class="my-1 w-px flex-1 bg-slate-200" />
          <span class="size-2.5 shrink-0 rounded-full" :class="progress.progress === 100 ? 'bg-cyan-400' : 'bg-slate-900'" />
        </div>

        <span class="truncate text-xs text-slate-500">{{ $t('profile.account.firstTrophy') }}</span>
        <span v-if="first" class="whitespace-nowrap text-sm tabular-nums">
          <span class="font-semibold text-slate-800">{{ first.date }}</span>
          <span class="ml-1.5 text-xs text-slate-400">{{ first.time }}</span>
        </span>
        <span v-else-if="incomplete" class="text-xs font-medium text-amber-600/75">{{ $t('common.timestampMissing') }}</span>
        <span v-else class="text-sm text-slate-400">—</span>

        <div class="col-span-2 my-2.5 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
          <span class="inline-flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
            <LucideIcon :icon="Clock" class="size-3.5 text-slate-400" />{{ $t('trophy.progress.duration') }}
          </span>
          <span v-if="incomplete" class="text-right text-sm font-medium leading-tight text-amber-600/75">
            {{ $t('common.timestampMissing') }}
          </span>
          <span v-else class="whitespace-nowrap text-base font-bold leading-tight tabular-nums tracking-tight text-slate-900">
            {{ duration == null ? '—' : formatDuration(duration) }}
          </span>
        </div>

        <!-- A finished set's last trophy is the moment it was completed. -->
        <span class="truncate text-xs text-slate-500">
          {{ progress.progress === 100 ? $t('trophy.progress.complete') : $t('trophy.progress.lastTrophy') }}
        </span>
        <span v-if="last" class="whitespace-nowrap text-sm tabular-nums">
          <span class="font-semibold text-slate-800">{{ last.date }}</span>
          <span class="ml-1.5 text-xs text-slate-400">{{ last.time }}</span>
        </span>
        <span v-else-if="incomplete" class="text-xs font-medium text-amber-600/75">{{ $t('common.timestampMissing') }}</span>
        <span v-else class="text-sm text-slate-400">—</span>
      </div>

      <p v-if="incomplete" class="mt-3 flex gap-1.5 text-[11px] leading-relaxed text-slate-400">
        <LucideIcon :icon="CircleAlert" class="mt-0.5 size-3 shrink-0 text-amber-400" />
        {{ $t('common.timestampsIncompleteHint') }}
      </p>
    </div>
  </div>
</template>
