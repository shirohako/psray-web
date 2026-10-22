<script setup lang="ts">
import { LocateFixed } from 'lucide'
import type { AuthUser } from '~/services/auth'
import type { LeaderboardMeta, LeaderboardRow } from '~/services/leaderboard'

/**
 * The signed-in user's standing on the board on screen: rank and points, the
 * top percentage and gap to the next rank when the board reports them, and a
 * jump to the page their row is on.
 */
const props = defineProps<{
  user: AuthUser
  /** Rows on screen, and the page they are. */
  rows: LeaderboardRow[]
  page: number
  meta: LeaderboardMeta | undefined
  /** Nothing to show for the standing until the first response lands. */
  loading: boolean
}>()

const emit = defineEmits<{ jump: [page: number] }>()

// The standing as the board reports it in `meta.me` (same filters, any page).
// Boards that don't report it fall back to the user's row when it happens to
// be on screen.
const me = computed(() => props.meta?.me ?? null)
const rank = computed(() => {
  if (props.meta?.me !== undefined) return me.value?.rank ?? null
  const psnid = props.user.psnid.toLowerCase()
  return props.rows.find(row => row.psnid.toLowerCase() === psnid)?.rank ?? null
})
const points = computed(() => me.value?.score ?? props.user.points)
// Without `meta.me` the rank only comes from a row on screen, so that's the page.
const rankPage = computed(() => {
  if (props.meta?.me !== undefined) return me.value?.on_page ?? null
  return rank.value ? props.page : null
})
// Whole percentages come back without the `.0`, so pad to one decimal here.
const topPercent = computed(() => me.value?.top_percent?.toFixed(1) ?? null)
const toNext = computed(() => me.value?.gap_to_next ?? null)
</script>

<template>
  <section
    aria-labelledby="leaderboard-self-title"
    class="rounded-xl border border-slate-200/80 bg-white shadow-sm"
  >
    <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
      <h2 id="leaderboard-self-title" class="text-sm font-semibold text-slate-900">{{ $t('leaderboard.self.title') }}</h2>
      <button
        v-if="rankPage"
        type="button"
        class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700"
        @click="emit('jump', rankPage)"
      >
        <LucideIcon :icon="LocateFixed" class="size-3.5" />
        {{ $t('leaderboard.self.jump', { page: rankPage }) }}
      </button>
    </div>
    <div class="flex flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
      <div class="flex min-w-0 items-center gap-2.5">
        <img :src="user.avatar_url" :alt="user.psnid" class="size-10 shrink-0 rounded-full bg-slate-100 object-cover">
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-900">{{ user.psnid }}</p>
          <p class="text-[11px] text-slate-500">{{ $t('leaderboard.column.level') }} {{ user.trophy_level }}</p>
        </div>
      </div>
      <dl class="flex flex-wrap items-start gap-x-6 gap-y-2">
        <div>
          <dt class="text-[11px] text-slate-500">{{ $t('leaderboard.column.rank') }}</dt>
          <dd v-if="loading" class="skeleton mt-1 h-4 w-12 rounded" />
          <dd v-else class="text-sm font-semibold tabular-nums text-slate-900">{{ rank ? `#${fmt(rank)}` : '—' }}</dd>
        </div>
        <div>
          <dt class="text-[11px] text-slate-500">{{ $t('leaderboard.column.points') }}</dt>
          <dd v-if="loading" class="skeleton mt-1 h-4 w-16 rounded" />
          <dd v-else class="text-sm font-semibold tabular-nums text-slate-900">{{ fmt(points) }}</dd>
        </div>
        <div v-if="topPercent">
          <dt class="text-[11px] text-slate-500">{{ $t('leaderboard.self.top') }}</dt>
          <dd class="text-sm font-semibold tabular-nums text-slate-900">{{ topPercent }}%</dd>
        </div>
        <div v-if="toNext != null">
          <dt class="text-[11px] text-slate-500">{{ $t('leaderboard.self.toNext') }}</dt>
          <dd class="text-sm font-semibold tabular-nums text-slate-900">{{ fmt(toNext) }}</dd>
        </div>
      </dl>
      <p v-if="!rank && !loading" class="text-xs text-slate-500">{{ $t('leaderboard.self.unranked') }}</p>
    </div>
  </section>
</template>
