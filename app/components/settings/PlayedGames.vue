<script setup lang="ts">
import { AlertTriangle, Check, ChevronRight, Loader2, Search } from 'lucide'
import type { PlayedGameRow } from '~/composables/usePlayedGames'

/**
 * The player's games for a showcase picker: a search box over the recently
 * played list, the rows, and "load more". `mode="open"` rows lead somewhere
 * (a chevron); `mode="check"` rows toggle a checkbox, and with `full` the
 * unchecked ones are disabled. The first page loads when it mounts (a dialog
 * mounts its content each time it opens).
 */
const props = withDefaults(defineProps<{
  psnid: string
  mode: 'open' | 'check'
  /** Check mode: trophy-set ids that are checked. */
  checked?: number[]
  /** Check mode: the limit is reached. */
  full?: boolean
}>(), { checked: () => [], full: false })
const emit = defineEmits<{ select: [row: PlayedGameRow] }>()
defineSlots<{ badges?(props: { row: PlayedGameRow }): unknown }>()
const { t } = useI18n()

const { query, searchError, games, pending, error, hasMore, loadMore, reset } = usePlayedGames(() => props.psnid)
const checkedIds = computed(() => new Set(props.checked))

onMounted(reset)
</script>

<template>
  <div>
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

    <p v-if="error" class="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
      <LucideIcon :icon="AlertTriangle" class="size-4 shrink-0" />{{ error }}
    </p>
    <p v-else-if="!pending && !games.length" class="py-12 text-center text-sm text-slate-400">
      {{ t('settings.showcase.picker.noGames') }}
    </p>

    <ul class="mt-3 space-y-0.5 transition-opacity" :class="{ 'opacity-50': pending && games.length }">
      <li v-for="row in games" :key="row.id">
        <button
          type="button"
          class="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-100/80 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          :class="{ 'bg-slate-50': mode === 'check' && checkedIds.has(row.id) }"
          :aria-pressed="mode === 'check' ? checkedIds.has(row.id) : undefined"
          :disabled="mode === 'check' && full && !checkedIds.has(row.id)"
          @click="emit('select', row)"
        >
          <span
            v-if="mode === 'check'"
            class="grid size-5 shrink-0 place-items-center rounded-md transition"
            :class="checkedIds.has(row.id) ? 'bg-slate-900 text-white' : 'border-[1.5px] border-slate-300 bg-white'"
          >
            <LucideIcon v-if="checkedIds.has(row.id)" :icon="Check" class="size-3.5" stroke-width="3" />
          </span>
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
              <slot name="badges" :row="row" />
            </span>
          </span>
          <LucideIcon
            v-if="mode === 'open'"
            :icon="ChevronRight"
            class="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
          />
        </button>
      </li>
    </ul>

    <div v-if="pending && !games.length" class="grid place-items-center py-12">
      <LucideIcon :icon="Loader2" class="size-5 animate-spin text-slate-400" />
    </div>
    <div v-else-if="hasMore" class="mt-3 flex justify-center">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        :disabled="pending"
        @click="loadMore"
      >
        <LucideIcon v-if="pending" :icon="Loader2" class="size-3.5 animate-spin" />
        {{ t('settings.showcase.picker.loadMore') }}
      </button>
    </div>
  </div>
</template>
