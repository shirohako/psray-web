<script setup lang="ts">
import { AlertTriangle, ArrowLeft, Check, ChevronRight, Loader2, Search, Trophy } from 'lucide'
import type { PlayedTrophySet } from '~/services/profile'
import type { TrophySetDetail } from '~/services/trophies'
import type { PickedTrophy } from '~/utils/profileShowcase'

/**
 * Picks the featured trophies, in two steps: one of the owner's played games
 * (searchable, like the profile's recently played tab), then trophies earned
 * in it (unearned ones aren't listed). The picks so far sit in the footer tray,
 * where they can be reordered or taken out. Nothing changes until "Done";
 * the settings page saves it with the rest of the form.
 */
const props = defineProps<{ psnid: string; picks: PickedTrophy[] }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ apply: [picks: PickedTrophy[]] }>()
const { t } = useI18n()
const api = useApi()
const errorText = useApiErrorText()

/** The picks being edited; copied from `picks` each time the dialog opens. */
const working = ref<PickedTrophy[]>([])
const selected = computed(() => new Set(working.value.map(p => p.trophy_id)))
const full = computed(() => working.value.length >= FEATURED_LIMIT)

// ── Step 1: games ───────────────────────────────────────────────────────────
interface PageMeta { page: number; per_page: number; total: number; total_pages: number }
interface GameRow { id: number; name: string; lang: string | null; icon: string; platform: string[]; earned: number; total: number }

const query = ref('')
const searchError = ref<string | null>(null)
const games = ref<GameRow[]>([])
const gamesPage = ref(0)
const gamesTotalPages = ref(1)
const gamesPending = ref(false)
const gamesError = ref<string | null>(null)
let gamesRequest = 0

function toGame(row: PlayedTrophySet): GameRow {
  const set = row.trophy_set
  const d = set.defined_trophies
  return {
    id: row.trophy_set_id,
    name: set.localized_name || set.name,
    lang: set.display_language ?? set.default_language,
    icon: set.icon_url,
    platform: set.platform,
    earned: row.earned_bronze + row.earned_silver + row.earned_gold + row.earned_platinum,
    total: d.bronze + d.silver + d.gold + d.platinum,
  }
}

async function loadGames(page: number) {
  const request = ++gamesRequest
  gamesPending.value = true
  gamesError.value = null
  try {
    const res = await api.raw.get<PlayedTrophySet[], PageMeta>(recentlyPlayedPath(props.psnid, page, query.value))
    if (request !== gamesRequest) return
    const rows = (res.data ?? []).map(toGame)
    games.value = page === 1 ? rows : [...games.value, ...rows]
    gamesPage.value = page
    gamesTotalPages.value = res.meta?.total_pages ?? 1
  }
  catch (error) {
    if (request === gamesRequest) gamesError.value = errorText(error) ?? t('settings.showcase.picker.loadFailed')
  }
  finally {
    if (request === gamesRequest) gamesPending.value = false
  }
}

// Searches as you type, held back while the words are outside the API's bounds.
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(query, () => {
  if (searchTimer) clearTimeout(searchTimer)
  const result = validateRecentlyPlayedSearch(query.value)
  searchError.value = result.error
    ? t(`profile.recent.searchErrors.${result.error}`, {
        min: RECENTLY_PLAYED_SEARCH_MIN_KEYWORD_LENGTH,
        length: RECENTLY_PLAYED_SEARCH_MAX_LENGTH,
      })
    : null
  if (result.error) return
  searchTimer = setTimeout(() => loadGames(1), 300)
})

const pickedPerGame = computed(() => {
  const counts = new Map<number, number>()
  for (const p of working.value) counts.set(p.trophy_set_id, (counts.get(p.trophy_set_id) ?? 0) + 1)
  return counts
})

// ── Step 2: earned trophies of one game ─────────────────────────────────────
const game = ref<GameRow | null>(null)
const trophies = ref<PickedTrophy[]>([])
const trophiesPending = ref(false)
const trophiesError = ref<string | null>(null)
const rareOnly = ref(false)
let trophiesRequest = 0

async function openGame(row: GameRow) {
  game.value = row
  rareOnly.value = false
  trophies.value = []
  const request = ++trophiesRequest
  trophiesPending.value = true
  trophiesError.value = null
  try {
    const detail = await api.get<TrophySetDetail>(`/trophies/${row.id}`, { query: { psnid: props.psnid } })
    if (request !== trophiesRequest) return
    const earned = new Set(detail.viewer_progress?.earned_trophies ?? [])
    trophies.value = detail.groups
      .flatMap(group => group.trophies)
      .filter(trophy => earned.has(trophy.id))
      .map(trophy => ({
        trophy_set_id: row.id,
        trophy_id: trophy.id,
        name: trophy.localized_name || trophy.name,
        icon_url: trophy.icon_url,
        type: trophy.type,
        psn_earned_rate: trophy.psn_earned_rate,
        set_name: row.name,
        display_language: trophy.localized_name ? detail.display_language : detail.trophy_set.default_language,
      }))
      .sort((a, b) => Number(a.psn_earned_rate) - Number(b.psn_earned_rate))
  }
  catch (error) {
    if (request === trophiesRequest) trophiesError.value = errorText(error) ?? t('settings.showcase.picker.loadFailed')
  }
  finally {
    if (request === trophiesRequest) trophiesPending.value = false
  }
}

function back() {
  trophiesRequest++
  game.value = null
}

const shownTrophies = computed(() => (rareOnly.value ? trophies.value.filter(isRareTrophy) : trophies.value))
const rareCount = computed(() => trophies.value.filter(isRareTrophy).length)

function toggle(pick: PickedTrophy) {
  if (selected.value.has(pick.trophy_id)) {
    working.value = working.value.filter(p => p.trophy_id !== pick.trophy_id)
  }
  else if (!full.value) {
    working.value = [...working.value, pick]
  }
}

// ── Open / close ────────────────────────────────────────────────────────────
watch(open, (value) => {
  if (!value) return
  working.value = [...props.picks]
  game.value = null
  if (query.value) query.value = ''
  else if (!games.value.length || gamesError.value) loadGames(1)
}, { immediate: true })

function done() {
  emit('apply', working.value)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open" size="2xl">
    <template #title>
      <span v-if="game" class="flex min-w-0 items-center gap-2">
        <button
          type="button"
          class="-ml-1.5 grid size-8 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          :aria-label="t('settings.showcase.picker.back')"
          @click="back"
        >
          <LucideIcon :icon="ArrowLeft" class="size-4.5" />
        </button>
        <span class="truncate" :lang="contentLang(game.lang, game.name)">{{ game.name }}</span>
      </span>
      <template v-else>{{ t('settings.showcase.picker.title') }}</template>
    </template>

    <!-- Step 1: games -->
    <div v-if="!game" class="px-5 py-4">
      <div class="relative">
        <LucideIcon :icon="Search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="query"
          type="search"
          :maxlength="RECENTLY_PLAYED_SEARCH_MAX_LENGTH"
          :placeholder="t('settings.showcase.picker.search')"
          :aria-label="t('settings.showcase.picker.search')"
          :aria-invalid="Boolean(searchError)"
          class="h-10 w-full rounded-lg border bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2"
          :class="searchError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'"
        />
      </div>
      <p v-if="searchError" class="mt-1.5 text-xs text-red-600" role="alert">{{ searchError }}</p>

      <p v-if="gamesError" class="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
        <LucideIcon :icon="AlertTriangle" class="size-4 shrink-0" />{{ gamesError }}
      </p>
      <p v-else-if="!gamesPending && !games.length" class="py-12 text-center text-sm text-slate-400">
        {{ t('settings.showcase.picker.noGames') }}
      </p>

      <ul class="mt-3 space-y-0.5 transition-opacity" :class="{ 'opacity-50': gamesPending && games.length }">
        <li v-for="row in games" :key="row.id">
          <button
            type="button"
            class="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-100/80"
            @click="openGame(row)"
          >
            <!-- Fixed slot: the art keeps its own aspect (PS5 square, older 320×176) inside it. -->
            <span class="relative flex h-10 w-18 shrink-0 items-center justify-center">
              <TrophySetImage :src="row.icon" :alt="row.name" :platform="row.platform" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-semibold text-slate-900" :lang="contentLang(row.lang, row.name)">{{ row.name }}</span>
              <span class="mt-1 flex flex-wrap items-center gap-1.5">
                <span v-for="platform in row.platform" :key="platform" class="rounded-full bg-slate-100 px-2 py-px text-[10px] font-medium text-slate-600">{{ platformLabel(platform) }}</span>
                <span class="rounded-full bg-slate-100 px-2 py-px text-[10px] font-medium tabular-nums text-slate-600">
                  {{ t('settings.showcase.picker.earned', { earned: row.earned, total: row.total }) }}
                </span>
                <span v-if="pickedPerGame.get(row.id)" class="rounded-full bg-sky-50 px-2 py-px text-[10px] font-semibold text-sky-700">
                  {{ t('settings.showcase.picker.pickedInGame', { count: pickedPerGame.get(row.id) }) }}
                </span>
              </span>
            </span>
            <LucideIcon :icon="ChevronRight" class="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
          </button>
        </li>
      </ul>

      <div v-if="gamesPending && !games.length" class="grid place-items-center py-12">
        <LucideIcon :icon="Loader2" class="size-5 animate-spin text-slate-400" />
      </div>
      <div v-else-if="gamesPage < gamesTotalPages" class="mt-3 flex justify-center">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          :disabled="gamesPending"
          @click="loadGames(gamesPage + 1)"
        >
          <LucideIcon v-if="gamesPending" :icon="Loader2" class="size-3.5 animate-spin" />
          {{ t('settings.showcase.picker.loadMore') }}
        </button>
      </div>
    </div>

    <!-- Step 2: earned trophies of the game -->
    <div v-else class="px-5 py-4">
      <div class="flex flex-wrap items-center gap-2">
        <div role="radiogroup" :aria-label="t('settings.showcase.picker.filter')" class="inline-flex rounded-lg bg-slate-100 p-1">
          <button
            v-for="option in [false, true]"
            :key="String(option)"
            type="button"
            role="radio"
            :aria-checked="rareOnly === option"
            class="rounded-md px-3 py-1 text-xs font-semibold transition"
            :class="rareOnly === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            @click="rareOnly = option"
          >
            {{ option
              ? t('settings.showcase.picker.rare', { count: rareCount })
              : t('settings.showcase.picker.all', { count: trophies.length }) }}
          </button>
        </div>
        <span class="ml-auto text-xs text-slate-400">{{ t('settings.showcase.picker.order') }}</span>
      </div>

      <p v-if="trophiesError" class="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
        <LucideIcon :icon="AlertTriangle" class="size-4 shrink-0" />{{ trophiesError }}
      </p>
      <div v-else-if="trophiesPending" class="grid place-items-center py-16">
        <LucideIcon :icon="Loader2" class="size-5 animate-spin text-slate-400" />
      </div>
      <p v-else-if="!shownTrophies.length" class="py-16 text-center text-sm text-slate-400">
        {{ t('settings.showcase.picker.noTrophies') }}
      </p>

      <ul v-else class="mt-4 grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-6">
        <li v-for="pick in shownTrophies" :key="pick.trophy_id" class="min-w-0">
          <button
            type="button"
            :aria-pressed="selected.has(pick.trophy_id)"
            :disabled="full && !selected.has(pick.trophy_id)"
            class="group flex w-full flex-col items-center text-center disabled:cursor-not-allowed disabled:opacity-40"
            @click="toggle(pick)"
          >
            <span class="relative block size-14 sm:size-16">
              <img
                :src="pick.icon_url"
                :alt="pick.name"
                loading="lazy"
                class="size-full rounded-lg object-cover shadow-sm transition group-hover:scale-105 group-disabled:group-hover:scale-100 motion-reduce:transition-none"
              />
              <TrophyRareFrame v-if="isRareTrophy(pick)" />
              <span
                class="absolute -bottom-1.5 -right-1.5 grid size-5 place-items-center rounded-full border-2 border-white bg-white shadow-sm"
                :class="trophyTierColor(pick.type)"
              >
                <LucideIcon :icon="Trophy" class="size-3" />
              </span>
              <template v-if="selected.has(pick.trophy_id)">
                <span class="absolute -inset-1 rounded-xl ring-[2.5px] ring-slate-900" />
                <span class="absolute -left-2 -top-2 grid size-5.5 place-items-center rounded-full border-2 border-white bg-slate-900 text-white shadow-sm">
                  <LucideIcon :icon="Check" class="size-3" stroke-width="3" />
                </span>
              </template>
            </span>
            <span class="mt-2.5 w-full truncate text-[11px] font-semibold text-slate-800" :lang="contentLang(pick.display_language, pick.name)">{{ pick.name }}</span>
            <span class="text-[10px] tabular-nums" :class="isRareTrophy(pick) ? 'font-semibold text-violet-700' : 'text-slate-400'">PSN {{ formatPsnRate(pick.psn_earned_rate) }}</span>
          </button>
        </li>
      </ul>
    </div>

    <template #footer>
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-3 text-xs">
          <span class="font-semibold tabular-nums text-slate-600">
            {{ t('settings.showcase.picker.picked', { count: working.length, max: FEATURED_LIMIT }) }}
          </span>
          <span v-if="full" class="text-amber-600">{{ t('settings.showcase.picker.limit', { max: FEATURED_LIMIT }) }}</span>
          <span v-else-if="working.length > 1" class="text-slate-400">{{ t('settings.showcase.tray.hint') }}</span>
        </div>
        <SettingsFeaturedTray v-model="working" size="sm" />
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            @click="open = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            @click="done"
          >
            {{ t('settings.showcase.picker.done') }}
          </button>
        </div>
      </div>
    </template>
  </Dialog>
</template>
