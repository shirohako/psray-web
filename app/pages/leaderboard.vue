<script setup lang="ts">
import { Check, LocateFixed, Trophy } from 'lucide'
import type { LeaderboardRow, LeaderboardMeta } from '~/services/leaderboard'
import type { LeaderboardBoard } from '~/composables/useRankingBoards'
import { LEADERBOARD_DEFAULT_REGION, leaderboardRouteQuery, parseLeaderboardQuery, type LeaderboardQueryState } from '~/utils/leaderboardQuery'

const { t } = useI18n()
const auth = useAuth()

useSeo({
  title: () => t('seo.leaderboard.title'),
  description: () => t('seo.leaderboard.description'),
})

// All available boards (registry). Each owns its label, icon, filters, columns
// and fetcher — see `useRankingBoards`.
const hiddenBoardKeys = new Set(['tips', 'contribution'])
const boards = useRankingBoards().filter(board => !hiddenBoardKeys.has(board.key))

const boardKeys = boards.map(b => b.key)
const defaultBoard = boards[0]!

// Picker card colours per board accent, a muted pastel palette: a pale wash
// with a border one step deeper in the same hue (no shadow or halo), and a
// soft mid-pastel icon tile with a dark icon. Idle cards stay white; their tile
// keeps a pale tint. `mark` fills the corner marker of the selected card.
const ACCENTS: Record<LeaderboardBoard['accent'], { selected: string; tile: string; idleTile: string; mark: string }> = {
  violet: { selected: 'border-violet-300 bg-violet-50/70', tile: 'bg-violet-200 text-violet-700', idleTile: 'bg-violet-50 text-violet-500', mark: 'border-violet-400 bg-violet-400' },
  sky: { selected: 'border-sky-300 bg-sky-50/70', tile: 'bg-sky-200 text-sky-700', idleTile: 'bg-sky-50 text-sky-500', mark: 'border-sky-400 bg-sky-400' },
  pink: { selected: 'border-pink-300 bg-pink-50/70', tile: 'bg-pink-200 text-pink-700', idleTile: 'bg-pink-50 text-pink-500', mark: 'border-pink-400 bg-pink-400' },
}

// Board, filters and page live in the URL so Back/Forward and shared links
// restore the same ranking.
const route = useRoute()
const router = useRouter()
const state = computed(() => parseLeaderboardQuery(route.query, boardKeys))
const activeKey = computed(() => state.value.board)
const board = computed(() => boards.find(b => b.key === activeKey.value) ?? defaultBoard)

// Page-level filters. A board only consumes the ones it declares support for.
const region = computed(() => state.value.region)
const registeredOnly = computed(() => state.value.registeredOnly)
const page = computed(() => state.value.page)

// One fetcher driven by the active board; SSR-rendered, re-run whenever the URL
// state changes. The key is static and carries no locale: leaderboard rows are
// PSN IDs and numbers, with no localized body text to refetch on a language
// switch. Add the locale to the key if the backend ever starts translating
// anything here.
const { data, status } = await useAsyncData('leaderboard', () =>
  board.value.fetch({ page: page.value, registeredOnly: registeredOnly.value, region: region.value }),
{ watch: [state] })

const rows = computed<LeaderboardRow[]>(() => data.value?.data ?? [])
const meta = computed<LeaderboardMeta | undefined>(() => data.value?.meta)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
const pending = computed(() => status.value === 'pending')
const rangeStart = computed(() => rows.value.length ? (page.value - 1) * (meta.value?.per_page ?? rows.value.length) + 1 : 0)
const rangeEnd = computed(() => rows.value.length ? rangeStart.value + rows.value.length - 1 : 0)

// The signed-in user's standing. Their row, when it is on screen, is the board's
// own answer; otherwise fall back to the ranks on their profile, which the
// board maps to its own basis where it can (see `selfRank`).
const user = computed(() => auth.user.value)
const isSelfRow = (row: LeaderboardRow) => row.psnid.toLowerCase() === user.value?.psnid.toLowerCase()
const selfRank = computed(() => {
  if (!user.value) return null
  const onScreen = rows.value.find(isSelfRow)
  if (onScreen) return onScreen.rank
  if (!board.value.selfRank) return null
  const rank = board.value.selfRank(user.value, { page: page.value, registeredOnly: registeredOnly.value, region: region.value })
  return rank && rank > 0 ? rank : null
})
const selfPage = computed(() => {
  const perPage = meta.value?.per_page
  return selfRank.value && perPage ? Math.ceil(selfRank.value / perPage) : null
})
const selfTopPercent = computed(() => {
  const total = meta.value?.total
  if (!selfRank.value || !total) return null
  return Math.max(selfRank.value / total * 100, 0.1).toFixed(1)
})
// Points to the next rank up need the row above the user's, which usually
// sits on another page than the one on screen: fetch that page on the client.
const abovePage = computed(() => {
  const perPage = meta.value?.per_page
  return selfRank.value && selfRank.value > 1 && perPage ? Math.ceil((selfRank.value - 1) / perPage) : null
})
const needsAbovePage = computed(() => abovePage.value !== null && abovePage.value !== page.value)
const { data: aboveData } = useAsyncData(
  () => needsAbovePage.value
    ? `leaderboard-above:${activeKey.value}:${region.value}:${registeredOnly.value}:${abovePage.value}`
    : 'leaderboard-above:none',
  () => needsAbovePage.value
    ? board.value.fetch({ page: abovePage.value!, registeredOnly: registeredOnly.value, region: region.value })
    : Promise.resolve(null),
  { server: false, lazy: true },
)
const selfToNext = computed(() => {
  const rank = selfRank.value
  if (!rank || rank <= 1 || abovePage.value === null) return null
  const list = needsAbovePage.value ? aboveData.value?.data ?? [] : rows.value
  const index = list.findIndex(isSelfRow)
  const above = index > 0 ? list[index - 1] : list.filter(r => r.rank < rank).at(-1)
  const own = index >= 0 ? list[index]!.points : user.value?.points
  return above?.points != null && own != null ? Math.max(above.points - own, 0) : null
})

/**
 * Board and page changes push a history entry so Back returns to them; filter
 * changes replace it. Anything but a page change goes back to page 1. Filters
 * the target board doesn't support are left out of the URL, and anything else
 * in the query (e.g. `lang`) is kept.
 */
function navigate(next: Partial<LeaderboardQueryState>, mode: 'push' | 'replace' = 'push') {
  const target = boards.find(b => b.key === (next.board ?? activeKey.value)) ?? defaultBoard
  const { board: _board, region: _region, registered: _registered, page: _page, ...rest } = route.query
  const location = {
    query: {
      ...rest,
      ...leaderboardRouteQuery({
        board: target.key,
        region: target.region ? next.region ?? region.value : LEADERBOARD_DEFAULT_REGION,
        registeredOnly: Boolean(target.registered) && (next.registeredOnly ?? registeredOnly.value),
        page: next.page ?? 1,
      }, defaultBoard.key),
    },
  }
  return mode === 'push' ? router.push(location) : router.replace(location)
}

function selectBoard(key: string) {
  if (key !== activeKey.value) navigate({ board: key })
}

function setPage(p: number) {
  if (p === page.value) return
  navigate({ page: p })
  document.getElementById('leaderboard-results')?.scrollIntoView({ block: 'start' })
}

function setRegion(value: string) {
  if (value !== region.value) navigate({ region: value }, 'replace')
}

// "Go to my position": open the user's page, then scroll their row into view
// once it has loaded. Both the phone list and the table carry the marker, so
// pick the one that is actually displayed.
const revealSelfPending = ref(false)

function revealSelf() {
  revealSelfPending.value = false
  nextTick(() => {
    const marked = Array.from(document.querySelectorAll<HTMLElement>('[data-self-row]'))
    marked.find(el => el.offsetParent !== null)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

function goToSelf() {
  if (!selfPage.value) return
  if (selfPage.value === page.value) {
    revealSelf()
    return
  }
  revealSelfPending.value = true
  navigate({ page: selfPage.value })
}

watch(rows, () => {
  if (revealSelfPending.value) revealSelf()
})
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-4">
    <!-- Title, then each board as a selectable card with its own description -->
    <header class="space-y-4">
      <div class="flex items-center gap-2.5 pt-1">
        <LucideIcon :icon="Trophy" class="size-6 text-violet-400" stroke-width="2" />
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ $t('nav.leaderboard') }}</h1>
      </div>
      <p class="-mt-2 text-xs leading-5 text-slate-500">{{ $t('seo.leaderboard.description') }}</p>

      <div role="tablist" :aria-label="$t('leaderboard.boards')" class="grid grid-cols-2 gap-3">
        <button
          v-for="b in boards"
          :key="b.key"
          type="button"
          role="tab"
          :aria-selected="b.key === activeKey"
          class="group relative flex min-w-0 items-center gap-3 rounded-xl border px-2 py-3 text-left transition max-sm:justify-center max-sm:text-center sm:p-4"
          :class="b.key === activeKey
            ? ACCENTS[b.accent].selected
            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'"
          @click="selectBoard(b.key)"
        >
          <!-- Corner marker on every card: filled with a check when chosen, an empty circle otherwise -->
          <span
            class="absolute right-3 top-3 grid size-5 place-items-center rounded-full border-2 transition max-sm:hidden"
            :class="b.key === activeKey ? ACCENTS[b.accent].mark : 'border-slate-300 bg-white group-hover:border-slate-400'"
          >
            <LucideIcon v-if="b.key === activeKey" :icon="Check" class="size-3 text-white" stroke-width="3" />
          </span>
          <span
            class="grid size-10 shrink-0 place-items-center rounded-lg transition max-sm:hidden"
            :class="b.key === activeKey ? ACCENTS[b.accent].tile : ACCENTS[b.accent].idleTile"
          >
            <LucideIcon :icon="b.icon" class="size-5" />
          </span>
          <span class="min-w-0">
            <span
              class="block whitespace-nowrap text-sm font-semibold max-sm:text-[13px]"
              :class="b.key === activeKey ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'"
            >{{ $t(b.labelKey) }}</span>
            <span class="mt-0.5 block text-xs leading-5 text-slate-500 max-sm:hidden">{{ $t(b.descriptionKey) }}</span>
          </span>
        </button>
      </div>
    </header>

    <!-- Signed-in user's standing, on every page and board -->
    <section
      v-if="user"
      aria-labelledby="leaderboard-self-title"
      class="rounded-xl border border-slate-200/80 bg-white shadow-sm"
    >
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <h2 id="leaderboard-self-title" class="text-sm font-semibold text-slate-900">{{ $t('leaderboard.self.title') }}</h2>
        <button
          v-if="selfPage"
          type="button"
          class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700"
          @click="goToSelf"
        >
          <LucideIcon :icon="LocateFixed" class="size-3.5" />
          {{ $t('leaderboard.self.jump', { page: selfPage }) }}
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
            <dd class="text-sm font-semibold tabular-nums text-slate-900">{{ selfRank ? `#${fmt(selfRank)}` : '—' }}</dd>
          </div>
          <div>
            <dt class="text-[11px] text-slate-500">{{ $t('leaderboard.column.points') }}</dt>
            <dd class="text-sm font-semibold tabular-nums text-slate-900">{{ fmt(user.points) }}</dd>
          </div>
          <div v-if="selfTopPercent">
            <dt class="text-[11px] text-slate-500">{{ $t('leaderboard.self.top') }}</dt>
            <dd class="text-sm font-semibold tabular-nums text-slate-900">{{ selfTopPercent }}%</dd>
          </div>
          <div v-if="selfToNext != null">
            <dt class="text-[11px] text-slate-500">{{ $t('leaderboard.self.toNext') }}</dt>
            <dd class="text-sm font-semibold tabular-nums text-slate-900">{{ fmt(selfToNext) }}</dd>
          </div>
        </dl>
        <p v-if="!selfRank" class="text-xs text-slate-500">{{ $t('leaderboard.self.unranked') }}</p>
      </div>
    </section>

    <section id="leaderboard-results" class="scroll-mt-20" :aria-label="$t(board.labelKey)">
      <LeaderboardTable :columns="board.columns" :rows="rows" :pending="pending" :self-psnid="user?.psnid">
        <!-- Filters the active board supports, right above the rows they filter -->
        <template v-if="board.region" #header>
          <div class="flex items-center gap-3">
            <span class="text-xs font-medium text-slate-500">{{ $t('leaderboard.regionLabel') }}</span>
            <LeaderboardRegionSelect :model-value="region" @update:model-value="setRegion" />
          </div>
        </template>
        <template #footer>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="text-xs text-slate-500">
              {{ rows.length
                ? $t('leaderboard.range', { start: fmt(rangeStart), end: fmt(rangeEnd), total: fmt(meta?.total) })
                : $t('leaderboard.totalPlayers', { count: fmt(meta?.total) }) }}
            </span>
            <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" :siblings="2" jump @update:page="setPage" />
          </div>
        </template>
      </LeaderboardTable>
    </section>
  </div>
</template>
