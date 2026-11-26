<script setup lang="ts">
import { AlertTriangle, ArrowLeft, Check, Loader2, Trophy } from 'lucide'
import type { PlayedGameRow } from '~/composables/usePlayedGames'
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

// ── Step 1: games (kept mounted under step 2, so going back keeps the list) ──
const pickedPerGame = computed(() => {
  const counts = new Map<number, number>()
  for (const p of working.value) counts.set(p.trophy_set_id, (counts.get(p.trophy_set_id) ?? 0) + 1)
  return counts
})

// ── Step 2: earned trophies of one game ─────────────────────────────────────
const game = ref<PlayedGameRow | null>(null)
const trophies = ref<PickedTrophy[]>([])
const trophiesPending = ref(false)
const trophiesError = ref<string | null>(null)
const rareOnly = ref(false)
let trophiesRequest = 0

async function openGame(row: PlayedGameRow) {
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
    <SettingsPlayedGames v-show="!game" class="px-5 py-4" :psnid="psnid" mode="open" @select="openGame">
      <template #badges="{ row }">
        <span v-if="pickedPerGame.get(row.id)" class="rounded-full bg-sky-50 px-2 py-px text-[10px] font-semibold text-sky-700">
          {{ t('settings.showcase.picker.pickedInGame', { count: pickedPerGame.get(row.id) }) }}
        </span>
      </template>
    </SettingsPlayedGames>

    <!-- Step 2: earned trophies of the game -->
    <div v-if="game" class="px-5 py-4">
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
        <SettingsSortTray
          v-model="working"
          :item-key="pick => pick.trophy_id"
          :item-label="pick => pick.name"
          :limit="FEATURED_LIMIT"
          tile-class="size-10"
        >
          <template #tile="{ item }">
            <SettingsTrophyTile :pick="item" />
          </template>
        </SettingsSortTray>
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
