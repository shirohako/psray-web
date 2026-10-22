<script setup lang="ts">
import type { TrophyKey } from '~/utils/profile'
import type { LeaderboardRow } from '~/services/leaderboard'

/**
 * Share of each trophy tier among a player's trophies: a ring with one arc per
 * tier, and a tooltip listing each tier's count and share over the total.
 */
const props = defineProps<{ row: LeaderboardRow }>()

const { t } = useI18n()

// Arc colour per tier, matching the tier dots.
const TIER_STROKE: Record<TrophyKey, string> = {
  platinum: 'stroke-cyan-400',
  gold: 'stroke-amber-400',
  silver: 'stroke-slate-400',
  bronze: 'stroke-orange-400',
}

// Composition ring: one arc per tier on a circle of this radius (SVG units).
const RING_RADIUS = 9
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

const total = computed(() => trophyKinds.reduce((sum, kind) => sum + (props.row[kind.key] ?? 0), 0))

/** Each tier's count and share, plus its arc on the composition ring. */
const parts = computed(() => {
  let start = 0
  return trophyKinds.map((kind) => {
    const share = total.value ? props.row[kind.key] / total.value : 0
    const length = share * RING_LENGTH
    const arc = { dasharray: `${length} ${RING_LENGTH - length}`, dashoffset: -start }
    start += length
    return { ...kind, stroke: TIER_STROKE[kind.key], count: props.row[kind.key], percent: (share * 100).toFixed(1), arc }
  })
})

const label = computed(() => trophyKinds.map(kind => `${t(kind.labelKey)} ${fmt(props.row[kind.key])}`).join(' · '))
</script>

<template>
  <Tooltip placement="top" class="justify-center">
    <svg viewBox="0 0 24 24" class="size-6 -rotate-90" role="img" :aria-label="label">
      <circle cx="12" cy="12" :r="RING_RADIUS" fill="none" stroke-width="4" class="stroke-slate-100" />
      <circle
        v-for="part in parts"
        :key="part.key"
        cx="12"
        cy="12"
        :r="RING_RADIUS"
        fill="none"
        stroke-width="4"
        :class="part.stroke"
        :stroke-dasharray="part.arc.dasharray"
        :stroke-dashoffset="part.arc.dashoffset"
      />
    </svg>
    <!-- One line per tier: dot, name, count, share; total underneath -->
    <template #content>
      <span class="block min-w-44 py-1 font-normal">
        <span
          v-for="part in parts"
          :key="part.key"
          class="grid grid-cols-[auto_1fr_auto_3rem] items-center gap-x-2 py-0.5"
        >
          <span class="size-2 rounded-full" :class="part.dot" />
          <span class="text-slate-300">{{ $t(part.labelKey) }}</span>
          <span class="text-right font-semibold tabular-nums text-white">{{ fmt(part.count) }}</span>
          <span class="text-right tabular-nums text-slate-400">{{ part.percent }}%</span>
        </span>
        <span class="mt-1.5 grid grid-cols-[1fr_auto_3rem] gap-x-2 border-t border-slate-700 pt-1.5">
          <span class="text-slate-300">{{ $t('leaderboard.mixTotal') }}</span>
          <span class="text-right font-semibold tabular-nums text-white">{{ fmt(total) }}</span>
          <span />
        </span>
      </span>
    </template>
  </Tooltip>
</template>
