<script setup lang="ts">
import { Trophy } from 'lucide'
import type { LeaderboardRow, LeaderboardMeta } from '~/services/leaderboard'
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
// state changes. `lazy` lets client-side navigation open the page at once and
// show placeholders while the rows load; the server still waits for them. The
// key is static and carries no locale: leaderboard rows are PSN IDs and
// numbers, with no localized body text to refetch on a language switch. Add the
// locale to the key if the backend ever starts translating anything here.
const { data, status } = await useAsyncData('leaderboard', () =>
  board.value.fetch({ page: page.value, registeredOnly: registeredOnly.value, region: region.value }),
{ watch: [state], lazy: true })

const rows = computed<LeaderboardRow[]>(() => data.value?.data ?? [])
const meta = computed<LeaderboardMeta | undefined>(() => data.value?.meta)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
const pending = useFetchPending(status)
const rangeStart = computed(() => rows.value.length ? (page.value - 1) * (meta.value?.per_page ?? rows.value.length) + 1 : 0)
const rangeEnd = computed(() => rows.value.length ? rangeStart.value + rows.value.length - 1 : 0)

// The signed-in user: their row is marked, and their standing shows on every
// page and board.
const user = computed(() => auth.user.value)
// Nothing to show for the standing until the first response lands.
const standingLoading = computed(() => pending.value && !meta.value)

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

function goToSelf(selfPage: number) {
  if (selfPage === page.value) {
    revealSelf()
    return
  }
  revealSelfPending.value = true
  navigate({ page: selfPage })
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

      <LeaderboardBoardPicker :boards="boards" :active="activeKey" @select="selectBoard" />
    </header>

    <!-- Signed-in user's standing, on every page and board -->
    <LeaderboardStanding
      v-if="user"
      :user="user"
      :rows="rows"
      :page="page"
      :meta="meta"
      :loading="standingLoading"
      @jump="goToSelf"
    />

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
            <span v-if="standingLoading" class="skeleton h-3 w-32 rounded" />
            <span v-else class="text-xs text-slate-500">
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
