<script setup lang="ts">
import { Trophy } from 'lucide'
import type { LeaderboardRow, LeaderboardMeta } from '~/services/leaderboard'
import { LEADERBOARD_DEFAULT_REGION, leaderboardRouteQuery, parseLeaderboardQuery, type LeaderboardQueryState } from '~/utils/leaderboardQuery'
import { readNavState } from '~/utils/navState'

const { t } = useI18n()
const auth = useAuth()

// Opened at a player (a profile's rank, `navState('leaderboardPlayer')`): this
// page scrolls to their row once it is there, so the router doesn't scroll.
definePageMeta({ scrollToTop: () => !readNavState('leaderboardPlayer') })

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

// One fetcher driven by the active board; SSR-rendered, re-run whenever the URL
// state changes. `lazy` lets client-side navigation open the page at once and
// show placeholders while the rows load; the server still waits for them. The
// key is static and carries no locale: leaderboard rows are PSN IDs and
// numbers, with no localized body text to refetch on a language switch. Add the
// locale to the key if the backend ever starts translating anything here.
//
// Opened at a player with no page in the URL yet, the request names them and
// the API answers with the page they are on (`meta.player`); the URL is then
// replaced with that page, and that second fetch reuses the first response.
type BoardResponse = Awaited<ReturnType<typeof defaultBoard.fetch>>
const stateKey = (s: LeaderboardQueryState) => `${s.board}|${s.region}|${s.registeredOnly}|${s.page}`
let located: { key: string, response: BoardResponse } | null = null

const { data, status, error } = await useAsyncData('leaderboard', async () => {
  const reuse = located
  located = null
  if (reuse?.key === stateKey(state.value)) return reuse.response

  const player = route.query.page ? null : readNavState('leaderboardPlayer')
  const response = await board.value.fetch({ page: state.value.page, registeredOnly: registeredOnly.value, region: region.value, player })
  const found = response.meta?.player
  if (found && found.page > 1) located = { key: stateKey({ ...state.value, page: found.page }), response }
  return response
}, { watch: [state], lazy: true })

const rows = computed<LeaderboardRow[]>(() => data.value?.data ?? [])
const meta = computed<LeaderboardMeta | undefined>(() => data.value?.meta)
const pending = useFetchPending(status)
// The page on screen: the URL's, or the one the API picked for a player.
const page = computed(() => (!route.query.page && !pending.value && meta.value?.player?.page) || state.value.page)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
const rangeStart = computed(() => rows.value.length ? (page.value - 1) * (meta.value?.per_page ?? rows.value.length) + 1 : 0)
const rangeEnd = computed(() => rows.value.length ? rangeStart.value + rows.value.length - 1 : 0)

// 503 while the API is down, 404 past the last page: only real lists get indexed.
const { failed } = useListResponse({ error, meta, page })

useSeo({
  title: () => (page.value > 1 ? t('seo.paged', { title: t('seo.leaderboard.title'), page: page.value }) : t('seo.leaderboard.title')),
  description: () => t('seo.leaderboard.description'),
  // Each board (and region) and each page of it is a list of its own; the
  // registered-members filter is a view of one: `noindex`.
  canonicalQuery: () => leaderboardRouteQuery({
    board: board.value.key,
    region: board.value.region ? region.value : LEADERBOARD_DEFAULT_REGION,
    registeredOnly: false,
    page: page.value,
  }, defaultBoard.key),
  noindex: () => registeredOnly.value || failed.value,
})

// The signed-in user: their row is marked, and their standing shows on every
// page and board.
const user = computed(() => auth.user.value)
// Nothing to show for the standing until the first response lands.
const standingLoading = computed(() => pending.value && !meta.value)

/**
 * Board and page changes push a history entry so Back returns to them; filter
 * changes replace it. Anything but a page change goes back to page 1. Filters
 * the target board doesn't support are left out of the URL, anything else in
 * the query is kept, and the interface language goes last.
 */
function locationFor(next: Partial<LeaderboardQueryState>) {
  const target = boards.find(b => b.key === (next.board ?? activeKey.value)) ?? defaultBoard
  const { board: _board, region: _region, registered: _registered, page: _page, lang: _lang, ...rest } = route.query
  return localizeTo({
    query: {
      ...rest,
      ...leaderboardRouteQuery({
        board: target.key,
        region: target.region ? next.region ?? region.value : LEADERBOARD_DEFAULT_REGION,
        registeredOnly: Boolean(target.registered) && (next.registeredOnly ?? registeredOnly.value),
        page: next.page ?? 1,
      }, defaultBoard.key),
    },
  })
}

function navigate(next: Partial<LeaderboardQueryState>, mode: 'push' | 'replace' = 'push') {
  const location = locationFor(next)
  return mode === 'push' ? router.push(location) : router.replace(location)
}

// Real URLs for the pager and the board cards, so crawlers can walk the rankings.
const pageHref = (value: number) => router.resolve(locationFor({ page: value })).href
const boardHref = (key: string) => router.resolve(locationFor({ board: key })).href

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

// Opened at a player: put the page the API picked into the URL, so reload and
// Back land on it. Replacing keeps history.state, and so the player.
watch(() => meta.value?.player, (found) => {
  if (found && found.page > 1 && !route.query.page) router.replace(locationFor({ page: found.page }))
})

// The player this history entry opened the board at. Only the browser knows it,
// so it's read once mounted and again on each URL change (Back, Forward, paging).
const statePlayer = ref<string | null>(null)
watch(() => route.fullPath, () => {
  statePlayer.value = readNavState('leaderboardPlayer')
})

// Mark their row and bring it to the middle of the screen whenever their page
// arrives (or is already there after a reload).
const focusPsnid = computed(() => meta.value?.player?.psnid ?? statePlayer.value ?? undefined)
const playerMissing = computed(() => (statePlayer.value && !pending.value && meta.value?.player === null ? statePlayer.value : null))

function revealPlayer() {
  nextTick(() => {
    const marked = Array.from(document.querySelectorAll<HTMLElement>('[data-focus-row]'))
    marked.find(el => el.offsetParent !== null)?.scrollIntoView({ block: 'center' })
  })
}

onMounted(() => {
  statePlayer.value = readNavState('leaderboardPlayer')
  if (focusPsnid.value) revealPlayer()
})
watch(rows, () => {
  if (focusPsnid.value) revealPlayer()
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

      <LeaderboardBoardPicker :boards="boards" :active="activeKey" :board-href="boardHref" @select="selectBoard" />
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

    <p v-if="playerMissing" class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500 shadow-sm">
      {{ $t('leaderboard.playerMissing', { psnid: playerMissing }) }}
    </p>

    <section id="leaderboard-results" class="scroll-mt-20" :aria-label="$t(board.labelKey)">
      <LeaderboardTable :columns="board.columns" :rows="rows" :pending="pending" :self-psnid="user?.psnid" :focus-psnid="focusPsnid">
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
            <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" :siblings="2" jump :href-for="pageHref" @update:page="setPage" />
          </div>
        </template>
      </LeaderboardTable>
    </section>
  </div>
</template>
