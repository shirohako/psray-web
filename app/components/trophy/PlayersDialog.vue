<script setup lang="ts">
import { CalendarCheck, Clock, Trophy, Timer, History, Flag } from 'lucide'
import type { IconNode } from 'lucide'
import { useTrophies, type PlayerRanking, type PlayersMeta, type PlayerRankType } from '~/services/trophies'

const props = withDefaults(defineProps<{
  id: number | string
  open: boolean
  /** Sort tab to select when the dialog opens. */
  initialType?: PlayerRankType
}>(), { initialType: 'recent' })
const emit = defineEmits<{ 'update:open': [v: boolean] }>()

const tabs: { value: PlayerRankType; labelKey: string; hintKey?: string; icon: IconNode }[] = [
  { value: 'recent', labelKey: 'trophy.players.recent', icon: History },
  { value: 'progress', labelKey: 'trophy.players.progress', hintKey: 'trophy.players.progressHint', icon: Flag },
  { value: 'speedrun', labelKey: 'trophy.players.speedrun', hintKey: 'trophy.players.speedrunHint', icon: Timer },
]

const type = ref<PlayerRankType>('recent')
// The tab the listed rows were fetched for: rows keep that tab's layout while
// the next tab loads.
const shownType = ref<PlayerRankType>('recent')
const page = ref(1)
const players = ref<PlayerRanking[]>([])
const meta = ref<PlayersMeta>()
const pending = ref(false)

const { players: fetchPlayers } = useTrophies()
const totalPages = computed(() => meta.value?.total_pages ?? 1)

let request = 0
async function load() {
  const current = ++request
  pending.value = true
  try {
    const res = await fetchPlayers(props.id, { type: type.value, page: page.value })
    if (current !== request) return
    players.value = res.data
    meta.value = res.meta
    shownType.value = type.value
  } finally {
    if (current === request) pending.value = false
  }
}

function selectType(t: PlayerRankType) {
  if (t === type.value) return
  type.value = t
  page.value = 1
  load()
}

function setPage(p: number) {
  if (p === page.value) return
  page.value = p
  load()
}

// (Re)load with a fresh state each time the dialog opens, honoring initialType.
watch(() => props.open, (v) => {
  if (!v) return
  type.value = props.initialType
  page.value = 1
  load()
})

function tiers(p: PlayerRanking) {
  return [
    { dot: 'bg-cyan-400', count: p.earned_platinum },
    { dot: 'bg-amber-400', count: p.earned_gold },
    { dot: 'bg-slate-400', count: p.earned_silver },
    { dot: 'bg-orange-400', count: p.earned_bronze },
  ]
}

/** Rows decided by a finish: every speedrun row, and finish-order rows at 100%. */
function finished(p: PlayerRanking) {
  return shownType.value === 'speedrun' || (shownType.value === 'progress' && p.progress >= 100)
}

function rankClass(rank: number) {
  if (rank === 1) return 'bg-amber-100 text-amber-700'
  if (rank === 2) return 'bg-slate-200 text-slate-600'
  if (rank === 3) return 'bg-orange-100 text-orange-700'
  return 'text-slate-400'
}
</script>

<template>
  <Dialog
    :open="open"
    size="3xl"
    :title="$t('trophy.players.title')"
    @update:open="emit('update:open', $event)"
  >
    <!-- Sort tabs (sticky atop the scroll area) -->
    <div class="sticky top-0 z-10 border-b border-slate-100 bg-white/90 px-3 py-2.5 backdrop-blur sm:px-4">
      <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-1">
        <button
          v-for="(t, index) in tabs"
          :key="t.value"
          type="button"
          :title="t.hintKey ? $t(t.hintKey) : undefined"
          class="flex min-h-9 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-center text-sm font-medium transition"
          :class="[
            index === 0 ? 'col-span-2 sm:col-span-1' : '',
            type === t.value
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900',
          ]"
          @click="selectType(t.value)"
        >
          <LucideIcon :icon="t.icon" class="size-3.5 shrink-0" />
          {{ $t(t.labelKey) }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending && !players.length" class="divide-y divide-slate-100">
      <div v-for="i in 8" :key="i" class="flex items-center gap-3 px-4 py-3">
        <div class="size-6 shrink-0 animate-pulse rounded-md bg-slate-200" />
        <div class="size-10 shrink-0 animate-pulse rounded-full bg-slate-200" />
        <div class="flex-1 space-y-2">
          <div class="h-3.5 w-1/3 animate-pulse rounded bg-slate-200" />
          <div class="h-2.5 w-1/4 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <p v-else-if="!players.length" class="px-5 py-16 text-center text-sm text-slate-400">
      {{ $t('trophy.players.empty') }}
    </p>

    <!-- List -->
    <ul v-else class="divide-y divide-slate-100 transition-opacity" :class="{ 'opacity-50': pending }">
      <li v-for="p in players" :key="p.psnid">
        <TrophyPlayerMenu
          :id="id"
          :psnid="p.psnid"
          class="group flex cursor-pointer select-none items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50 sm:px-5"
          @select="emit('update:open', false)"
        >
          <span class="grid size-7 shrink-0 place-items-center rounded-md text-xs font-bold tabular-nums" :class="rankClass(p.rank)">
            {{ p.rank }}
          </span>
          <img :src="p.avatar_url" :alt="p.psnid" class="size-10 shrink-0 rounded-full bg-slate-100 object-cover" />

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="truncate text-sm font-semibold text-slate-900 group-hover:text-slate-700">{{ p.psnid }}</span>
              <LucideIcon v-if="p.earned_platinum > 0" :icon="Trophy" class="size-3.5 shrink-0 text-cyan-500" />
            </div>
            <div class="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-slate-400">
              <span class="inline-flex min-w-0 items-center gap-1">
                <RegionFlag :country="p.country" class="shrink-0" />
                <span class="truncate" :class="{ 'hidden sm:inline': finished(p) }">{{ regionName(p.country) }}</span>
              </span>
              <span class="shrink-0" :class="{ 'hidden sm:inline': finished(p) }">·</span>
              <span v-if="shownType === 'speedrun'" class="inline-flex shrink-0 items-center gap-1" :title="$t('trophy.players.completedOn')">
                <LucideIcon :icon="CalendarCheck" class="size-3" /><LocalTime :value="p.last_earned_at" format="day" />
              </span>
              <span v-else-if="finished(p)" class="inline-flex shrink-0 items-center gap-1" :title="$t('trophy.players.timeTaken')">
                <LucideIcon :icon="Timer" class="size-3" />{{ formatDuration(p.duration) }}
              </span>
              <LocalTime v-else class="shrink-0" :value="p.last_earned_at" />
            </div>
          </div>

          <!-- Finished rows: the old breakdown + percent, then the figure the ranking is decided by -->
          <template v-if="finished(p)">
            <div class="hidden shrink-0 items-center gap-2.5 text-xs text-slate-500 sm:flex">
              <span v-for="(t, i) in tiers(p)" :key="i" class="inline-flex items-center gap-0.5">
                <span class="size-2 rounded-full" :class="t.dot" />{{ t.count }}
              </span>
            </div>
            <div class="hidden w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-400 sm:block">{{ p.progress }}%</div>
            <div class="hidden h-8 w-px shrink-0 bg-slate-100 sm:block" />
            <!-- Speedrun: the time taken, to the second -->
            <div
              v-if="shownType === 'speedrun'"
              class="min-w-24 shrink-0 text-right text-sm sm:min-w-28 sm:text-[15px]"
              :title="formatDuration(p.duration)"
            >
              <TrophyStopwatch :seconds="p.duration" />
            </div>
            <!-- Finish order: when 100% was reached -->
            <div v-else class="min-w-24 shrink-0 text-right tabular-nums leading-tight">
              <div class="text-sm font-semibold text-slate-800 sm:text-[15px]"><LocalTime :value="p.last_earned_at" format="day" /></div>
              <div class="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400">
                <LucideIcon :icon="Clock" class="size-3" /><LocalTime :value="p.last_earned_at" format="time" />
              </div>
            </div>
          </template>

          <!-- Still playing: trophy breakdown and progress -->
          <template v-else>
            <div class="hidden shrink-0 items-center gap-2.5 text-xs text-slate-500 sm:flex">
              <span v-for="(t, i) in tiers(p)" :key="i" class="inline-flex items-center gap-0.5">
                <span class="size-2 rounded-full" :class="t.dot" />{{ t.count }}
              </span>
            </div>
            <div class="w-12 shrink-0 text-right text-sm font-bold text-slate-900 tabular-nums">{{ p.progress }}%</div>
          </template>
        </TrophyPlayerMenu>
      </li>
    </ul>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-slate-400">{{ $t('leaderboard.totalPlayers', { count: fmt(meta?.total) }) }}</span>
        <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" @update:page="setPage" />
      </div>
    </template>
  </Dialog>
</template>
