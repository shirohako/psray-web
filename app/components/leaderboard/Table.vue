<script lang="ts">
/**
 * Columns a board can render. A board picks which ones (and their order) to
 * show, so different boards can expose different fields from the same row.
 * Add a metric column here, give it a `META` entry, and render it in the
 * template's cell switch — boards opt in via their `columns` list.
 */
export type LeaderboardColumn =
  | 'rank' | 'user' | 'level'
  | 'platinum' | 'gold' | 'silver' | 'bronze' | 'mix'
  | 'points' | 'tipCount' | 'voteUp' | 'contribution'
</script>

<script setup lang="ts">
import { ThumbsUp } from 'lucide'
import type { LeaderboardRow } from '~/services/leaderboard'

const props = defineProps<{
  columns: LeaderboardColumn[]
  rows: LeaderboardRow[]
  /** True while (re)fetching; dims an existing list, drives the skeleton when empty. */
  pending?: boolean
  /** PSN ID of the signed-in user; their row is highlighted. */
  selfPsnid?: string
}>()

const { t } = useI18n()

// Single source of truth for each column's header + layout. Boards only choose
// which keys to pass in `columns`; rendering for each key lives in the template.
const META: Record<LeaderboardColumn, { labelKey: string; align: 'left' | 'center' | 'right'; class?: string }> = {
  rank: { labelKey: 'leaderboard.column.rank', align: 'center', class: 'w-14' },
  user: { labelKey: 'leaderboard.column.user', align: 'left' },
  level: { labelKey: 'leaderboard.column.level', align: 'center', class: 'w-16' },
  platinum: { labelKey: 'trophy.tier.platinum', align: 'right', class: 'w-16' },
  gold: { labelKey: 'trophy.tierShort.gold', align: 'right', class: 'w-14' },
  silver: { labelKey: 'trophy.tierShort.silver', align: 'right', class: 'w-14' },
  bronze: { labelKey: 'trophy.tierShort.bronze', align: 'right', class: 'w-16' },
  // Only from `xl` up: below that the four tier columns already fill the width.
  mix: { labelKey: 'leaderboard.column.mix', align: 'center', class: 'hidden w-14 xl:table-cell' },
  points: { labelKey: 'leaderboard.column.points', align: 'right', class: 'w-32' },
  tipCount: { labelKey: 'leaderboard.column.tipCount', align: 'right', class: 'w-20' },
  voteUp: { labelKey: 'leaderboard.column.voteUp', align: 'right', class: 'w-20' },
  contribution: { labelKey: 'leaderboard.column.contribution', align: 'right', class: 'w-24' },
}

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' } as const

// The four trophy-tier columns and their accent colour, so each renders uniformly.
const TIERS = ['platinum', 'gold', 'silver', 'bronze'] as const
type Tier = (typeof TIERS)[number]
const TIER_DOT: Record<Tier, string> = {
  platinum: 'bg-cyan-400',
  gold: 'bg-amber-400',
  silver: 'bg-slate-400',
  bronze: 'bg-orange-400',
}
const TIER_STROKE: Record<Tier, string> = {
  platinum: 'stroke-cyan-400',
  gold: 'stroke-amber-400',
  silver: 'stroke-slate-400',
  bronze: 'stroke-orange-400',
}
const TIER_LABEL: Record<Tier, string> = {
  platinum: 'trophy.tier.platinum',
  gold: 'trophy.tier.gold',
  silver: 'trophy.tier.silver',
  bronze: 'trophy.tier.bronze',
}
const isTier = (c: LeaderboardColumn): c is Tier => (TIERS as readonly string[]).includes(c)

// Phone rows show one headline metric on the right and the rest on a second line.
const primary = computed(() => (['points', 'tipCount', 'contribution'] as const).find(c => props.columns.includes(c)))
const has = (c: LeaderboardColumn) => props.columns.includes(c)

// The signed-in user's row, in soft pastel blue: a pale wash, a ringed avatar
// and a soft "you" pill.
const SELF_ROW = 'bg-sky-50/80'
const SELF_AVATAR = 'ring-2 ring-sky-300 ring-offset-2 ring-offset-sky-50'
const SELF_TAG = 'shrink-0 rounded bg-sky-100 px-1.5 py-px text-[10px] font-semibold text-sky-800 ring-1 ring-inset ring-sky-300/70'
// Every other row gets a faint wash; hover goes one step darker so it still
// shows on the striped rows. The self row keeps its own colour instead.
const STRIPE_ROW = 'even:bg-slate-50 hover:bg-slate-200/50'

function isSelf(row: LeaderboardRow) {
  return !!props.selfPsnid && row.psnid.toLowerCase() === props.selfPsnid.toLowerCase()
}

const mixTotal = (row: LeaderboardRow) => TIERS.reduce((sum, tier) => sum + (row[tier] ?? 0), 0)

// Composition ring: one arc per tier on a circle of this radius (SVG units).
const RING_RADIUS = 9
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/** Each tier's count and share, plus its arc on the composition ring. */
function mix(row: LeaderboardRow) {
  const total = mixTotal(row)
  let start = 0
  return TIERS.map((tier) => {
    const share = total ? row[tier] / total : 0
    const length = share * RING_LENGTH
    const arc = { dasharray: `${length} ${RING_LENGTH - length}`, dashoffset: -start }
    start += length
    return { tier, count: row[tier], percent: (share * 100).toFixed(1), arc }
  })
}

function mixLabel(row: LeaderboardRow) {
  return TIERS.map(tier => `${t(TIER_LABEL[tier])} ${fmt(row[tier])}`).join(' · ')
}

function primaryValue(row: LeaderboardRow) {
  if (primary.value === 'points') return fmt(row.points)
  if (primary.value === 'tipCount') return fmt(row.tip_count)
  return fmt(row.contribution_points)
}

// Soft medal pill for the top three, muted number otherwise — matching the
// rank styling used elsewhere (e.g. the players dialog).
function rankClass(rank: number) {
  if (rank === 1) return 'bg-amber-100 text-amber-700'
  if (rank === 2) return 'bg-slate-200 text-slate-600'
  if (rank === 3) return 'bg-orange-100 text-orange-700'
  return 'text-slate-500'
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm">
    <!-- Optional filter bar, kept inside the card above the rows -->
    <div v-if="$slots.header" class="border-b border-slate-100 px-4 py-2.5">
      <slot name="header" />
    </div>

    <template v-if="rows.length">
      <!-- Phones: two-line rows instead of a sideways-scrolling table -->
      <ul class="divide-y divide-slate-100 transition-opacity md:hidden" :class="{ 'opacity-50': pending }">
        <li v-for="r in rows" :key="r.user_id" :data-self-row="isSelf(r) || undefined" :class="isSelf(r) ? SELF_ROW : STRIPE_ROW">
          <NuxtLink :to="`/p/${r.psnid}`" class="flex items-center gap-2.5 px-3 py-2.5">
            <span
              class="grid h-7 min-w-7 shrink-0 place-items-center rounded-md px-1 text-xs font-bold tabular-nums"
              :class="rankClass(r.rank)"
            >{{ r.rank }}</span>
            <img :src="r.avatar_url" :alt="r.psnid" class="size-9 shrink-0 rounded-full bg-slate-100 object-cover" :class="{ [SELF_AVATAR]: isSelf(r) }">
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center gap-1.5">
                <RegionFlag :country="r.country" class="shrink-0 text-sm" />
                <span class="truncate text-sm font-semibold text-slate-900">{{ r.psnid }}</span>
                <span v-if="isSelf(r)" :class="SELF_TAG">{{ $t('leaderboard.you') }}</span>
                <span v-if="primary" class="ml-auto shrink-0 text-sm font-bold tabular-nums text-slate-900">{{ primaryValue(r) }}</span>
              </div>
              <div class="flex items-center gap-2.5 text-[11px] tabular-nums text-slate-500">
                <span v-if="has('level')">Lv {{ r.trophy_level }}</span>
                <template v-for="tier in TIERS" :key="tier">
                  <span v-if="has(tier) && tier !== 'bronze'" class="inline-flex items-center gap-1">
                    <span class="size-1.5 rounded-full" :class="TIER_DOT[tier]" />{{ fmt(r[tier]) }}
                  </span>
                </template>
                <span v-if="has('voteUp')" class="inline-flex items-center gap-1">
                  <LucideIcon :icon="ThumbsUp" class="size-3" />{{ fmt(r.tip_vote_count ?? r.tip_vote_up) }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </li>
      </ul>

      <div class="hidden overflow-x-auto md:block">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
              <th
                v-for="c in columns"
                :key="c"
                scope="col"
                class="whitespace-nowrap px-3 py-2.5"
                :class="[ALIGN[META[c].align], META[c].class]"
              >
                <span v-if="isTier(c)" class="inline-flex items-center gap-1.5">
                  <span class="size-2 rounded-full" :class="TIER_DOT[c]" />{{ $t(META[c].labelKey) }}
                </span>
                <template v-else>{{ $t(META[c].labelKey) }}</template>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 transition-opacity" :class="{ 'opacity-50': pending }">
            <tr
              v-for="r in rows"
              :key="r.user_id"
              :data-self-row="isSelf(r) || undefined"
              class="transition"
              :class="isSelf(r) ? SELF_ROW : STRIPE_ROW"
            >
              <td
                v-for="c in columns"
                :key="c"
                class="px-3 py-3 align-middle"
                :class="[ALIGN[META[c].align], META[c].class]"
              >
                <!-- Rank -->
                <span
                  v-if="c === 'rank'"
                  class="mx-auto grid h-7 min-w-7 place-items-center rounded-md px-1 text-xs font-bold tabular-nums"
                  :class="rankClass(r.rank)"
                >{{ r.rank }}</span>

                <!-- Player -->
                <NuxtLink v-else-if="c === 'user'" :to="`/p/${r.psnid}`" class="group flex items-center gap-3">
                  <img :src="r.avatar_url" :alt="r.psnid" class="size-9 shrink-0 rounded-full bg-slate-100 object-cover" :class="{ [SELF_AVATAR]: isSelf(r) }">
                  <span class="flex min-w-0 items-center gap-1.5">
                    <RegionFlag :country="r.country" class="shrink-0 text-sm" />
                    <span class="truncate font-semibold text-slate-900 group-hover:text-sky-600">{{ r.psnid }}</span>
                    <span v-if="isSelf(r)" :class="SELF_TAG">{{ $t('leaderboard.you') }}</span>
                  </span>
                </NuxtLink>

                <!-- Trophy level -->
                <span v-else-if="c === 'level'" class="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                  {{ r.trophy_level }}
                </span>

                <!-- Trophy tier count (one column per tier) -->
                <span v-else-if="isTier(c)" class="tabular-nums text-slate-700">{{ fmt(r[c]) }}</span>

                <!-- Share of each tier among the player's trophies -->
                <Tooltip v-else-if="c === 'mix'" placement="top" class="justify-center">
                  <svg viewBox="0 0 24 24" class="size-6 -rotate-90" role="img" :aria-label="mixLabel(r)">
                    <circle cx="12" cy="12" :r="RING_RADIUS" fill="none" stroke-width="4" class="stroke-slate-100" />
                    <circle
                      v-for="part in mix(r)"
                      :key="part.tier"
                      cx="12"
                      cy="12"
                      :r="RING_RADIUS"
                      fill="none"
                      stroke-width="4"
                      :class="TIER_STROKE[part.tier]"
                      :stroke-dasharray="part.arc.dasharray"
                      :stroke-dashoffset="part.arc.dashoffset"
                    />
                  </svg>
                  <!-- One line per tier: dot, name, count, share; total underneath -->
                  <template #content>
                    <span class="block min-w-44 py-1 font-normal">
                      <span
                        v-for="part in mix(r)"
                        :key="part.tier"
                        class="grid grid-cols-[auto_1fr_auto_3rem] items-center gap-x-2 py-0.5"
                      >
                        <span class="size-2 rounded-full" :class="TIER_DOT[part.tier]" />
                        <span class="text-slate-300">{{ $t(TIER_LABEL[part.tier]) }}</span>
                        <span class="text-right font-semibold tabular-nums text-white">{{ fmt(part.count) }}</span>
                        <span class="text-right tabular-nums text-slate-400">{{ part.percent }}%</span>
                      </span>
                      <span class="mt-1.5 grid grid-cols-[1fr_auto_3rem] gap-x-2 border-t border-slate-700 pt-1.5">
                        <span class="text-slate-300">{{ $t('leaderboard.mixTotal') }}</span>
                        <span class="text-right font-semibold tabular-nums text-white">{{ fmt(mixTotal(r)) }}</span>
                        <span />
                      </span>
                    </span>
                  </template>
                </Tooltip>

                <!-- Points (primary metric) -->
                <span v-else-if="c === 'points'" class="text-[15px] font-bold tabular-nums text-slate-900">{{ fmt(r.points) }}</span>

                <!-- Tip count (primary metric) -->
                <span v-else-if="c === 'tipCount'" class="text-[15px] font-bold tabular-nums text-slate-900">{{ r.tip_count }}</span>

                <!-- Contribution points (primary metric) -->
                <span v-else-if="c === 'contribution'" class="text-[15px] font-bold tabular-nums text-slate-900">{{ fmt(r.contribution_points) }}</span>

                <!-- Tip up-votes received. Keep icon + number as one right-aligned unit. -->
                <span v-else-if="c === 'voteUp'" class="inline-flex items-center justify-end gap-1.5 text-slate-600">
                  <LucideIcon :icon="ThumbsUp" class="size-3.5 shrink-0 text-slate-400" />
                  <span class="min-w-5 text-right tabular-nums">{{ fmt(r.tip_vote_count ?? r.tip_vote_up) }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- First-load skeleton -->
    <div v-else-if="pending" class="divide-y divide-slate-100">
      <div v-for="i in 10" :key="i" class="flex items-center gap-3 px-4 py-3.5">
        <div class="size-7 shrink-0 animate-pulse rounded-md bg-slate-200" />
        <div class="size-9 shrink-0 animate-pulse rounded-full bg-slate-200" />
        <div class="h-3.5 flex-1 animate-pulse rounded bg-slate-200" />
        <div class="h-3.5 w-16 animate-pulse rounded bg-slate-200" />
      </div>
    </div>

    <!-- Empty -->
    <p v-else class="px-5 py-16 text-center text-sm text-slate-400">{{ $t('leaderboard.empty') }}</p>

    <!-- Footer (count + pagination), kept inside the card -->
    <div v-if="$slots.footer" class="border-t border-slate-100 px-4 py-3">
      <slot name="footer" />
    </div>
  </div>
</template>
