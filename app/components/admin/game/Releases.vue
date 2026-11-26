<script setup lang="ts">
import { CalendarDays, ChevronDown, Plus, Trash2 } from 'lucide'
import type { AdminGameRelease, AdminPlatform } from '~/types/admin'
import type { SelectOption } from '~/types/select'
import {
  derivedFirstRelease,
  draftRelease,
  formatAdminReleaseDate,
  GAME_PRECISION_OPTIONS,
  GAME_REGION_OPTIONS,
  GAME_STATUS_LABELS,
  releaseRegionLabel,
  type DraftRelease,
} from '~/utils/adminGame'

/**
 * The release list of the game editor (one row per platform / region / date),
 * plus the first release date: derived from the releases, or pinned by hand.
 * Lock states come from the page (see utils/adminGame `lockPlan`).
 */
const releases = defineModel<DraftRelease[]>('releases', { required: true })
const firstMode = defineModel<'auto' | 'manual'>('firstMode', { required: true })
const firstDate = defineModel<string>('firstDate', { required: true })
const firstPrecision = defineModel<DraftRelease['precision']>('firstPrecision', { required: true })

const props = defineProps<{
  platforms: AdminPlatform[]
  releasesState: 'locked' | 'lock' | 'unlock' | 'free'
  firstState: 'locked' | 'lock' | 'unlock' | 'free'
  /** IGDB's release list from the last refresh; `null` before the first one. */
  igdb: AdminGameRelease[] | null
  /** Stored first release date, kept by the API when no release is dated. */
  stored: { date: string | null, precision: DraftRelease['precision'] | null }
  /** Whether the game has an IGDB source (lock chips only make sense then). */
  hasIgdb: boolean
}>()
const emit = defineEmits<{ restore: [field: 'releases' | 'first_release_date'], cancel: [field: 'releases' | 'first_release_date'] }>()

const platformOptions = computed<SelectOption[]>(() => {
  const known = props.platforms.map(p => ({ value: p.code, label: p.code, hint: p.code === p.name ? undefined : p.name }))
  // A code no longer in the catalogue stays selectable for its own row.
  const extra = releases.value.filter(r => !props.platforms.some(p => p.code === r.platform)).map(r => ({ value: r.platform, label: r.platform }))
  return [...known, ...extra]
})

function add() {
  const last = releases.value[releases.value.length - 1]
  releases.value = [...releases.value, draftRelease({ platform: last?.platform ?? 'PS5', region: 'WW', date_precision: 'day' })]
}
function remove(key: string) {
  releases.value = releases.value.filter(r => r.key !== key)
}

const derived = computed(() => derivedFirstRelease(releases.value))
function pin() {
  firstMode.value = 'manual'
  if (!firstDate.value) {
    firstDate.value = derived.value?.date ?? props.stored.date ?? ''
    firstPrecision.value = derived.value?.precision ?? props.stored.precision ?? 'day'
  }
}

const showIgdb = ref(false)
const igdbDiffers = computed(() => {
  if (!props.igdb) return false
  const key = (r: { platform: string, region: string, date: string | null, precision: string, status: string | null }) => [r.platform, r.region, r.date ?? '', r.precision, r.status ?? ''].join('|')
  const mine = releases.value.map(r => key({ ...r, date: r.date || null })).sort().join('\n')
  const theirs = props.igdb.map(r => key({ ...r, date: r.release_date, precision: r.date_precision })).sort().join('\n')
  return mine !== theirs
})
</script>

<template>
  <section class="admin-panel">
    <header class="admin-panel-head">
      <h2 class="admin-panel-title">发售信息<span class="admin-count">{{ releases.length }}</span></h2>
      <div class="flex items-center gap-3">
        <AdminLockState v-if="hasIgdb" :state="releasesState" source="IGDB" @restore="emit('restore', 'releases')" @cancel="emit('cancel', 'releases')" />
        <button type="button" class="admin-button" @click="add"><LucideIcon :icon="Plus" class="size-3.5" />添加</button>
      </div>
    </header>

    <p v-if="!releases.length" class="px-4 py-6 text-center text-xs text-slate-400">还没有发售信息。添加后首发日会按最早的已定档日期计算。</p>
    <TransitionGroup
      v-else
      tag="ul"
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <li v-for="release in releases" :key="release.key" class="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2 first:border-t-0">
        <SelectMenu v-model="release.platform" :options="platformOptions" size="sm" searchable panel-width="260" class="w-28" aria-label="平台" />
        <SelectMenu v-model="release.region" :options="GAME_REGION_OPTIONS" size="sm" class="w-24" aria-label="地区" />
        <input v-model="release.date" type="date" class="admin-input w-36 tabular-nums" aria-label="发售日期" />
        <SelectMenu v-model="release.precision" :options="GAME_PRECISION_OPTIONS" size="sm" class="w-28" aria-label="日期精度" />
        <span class="min-w-0 flex-1">
          <span v-if="release.status" class="inline-flex h-5 items-center rounded-full border border-slate-200 px-2 text-[11px] font-medium text-slate-600">{{ GAME_STATUS_LABELS[release.status] ?? release.status }}</span>
          <span v-else-if="!release.date" class="text-xs text-slate-400">未定档</span>
        </span>
        <button type="button" class="grid size-8 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600" aria-label="删除这条发售信息" @click="remove(release.key)">
          <LucideIcon :icon="Trash2" class="size-3.5" />
        </button>
      </li>
    </TransitionGroup>

    <div v-if="hasIgdb && igdb && igdbDiffers && releasesState !== 'free'" class="border-t border-slate-100 px-4 py-2.5">
      <button type="button" class="admin-link" :aria-expanded="showIgdb" @click="showIgdb = !showIgdb">
        <LucideIcon :icon="ChevronDown" class="size-3 transition-transform" :class="showIgdb ? 'rotate-180' : ''" />IGDB 当前有 {{ igdb.length }} 条发售信息
      </button>
      <ul v-if="showIgdb" class="mt-2 flex flex-wrap gap-1.5">
        <li v-for="(release, i) in igdb" :key="i" class="inline-flex h-6 items-center gap-1.5 rounded-md bg-slate-50 px-2 text-xs text-slate-600">
          <span class="font-semibold text-slate-800">{{ release.platform }}</span>
          <span>{{ releaseRegionLabel(release.region) }}</span>
          <span class="tabular-nums">{{ formatAdminReleaseDate(release.release_date, release.date_precision) }}</span>
          <span v-if="release.status" class="text-slate-400">{{ GAME_STATUS_LABELS[release.status] ?? release.status }}</span>
        </li>
      </ul>
    </div>

    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-b-xl border-t border-slate-200 bg-slate-50 px-4 py-3">
      <span class="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900"><LucideIcon :icon="CalendarDays" class="size-4 text-slate-500" />首发日</span>
      <div class="flex rounded-lg bg-slate-200/70 p-0.5" role="radiogroup" aria-label="首发日来源">
        <button type="button" role="radio" :aria-checked="firstMode === 'auto'" class="h-7 rounded-md px-3 text-xs font-medium transition" :class="firstMode === 'auto' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'" @click="firstMode = 'auto'">按发售信息</button>
        <button type="button" role="radio" :aria-checked="firstMode === 'manual'" class="h-7 rounded-md px-3 text-xs font-medium transition" :class="firstMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'" @click="pin">手动指定</button>
      </div>
      <template v-if="firstMode === 'manual'">
        <input v-model="firstDate" type="date" class="admin-input w-36 tabular-nums" aria-label="首发日" />
        <SelectMenu v-model="firstPrecision" :options="GAME_PRECISION_OPTIONS" size="sm" class="w-28" aria-label="首发日精度" />
      </template>
      <span v-else class="text-[13px] tabular-nums text-slate-700">
        <template v-if="derived">{{ formatAdminReleaseDate(derived.date, derived.precision) }}</template>
        <template v-else-if="stored.date">{{ formatAdminReleaseDate(stored.date, stored.precision) }}<span class="ml-2 text-xs text-slate-400">没有已定档的发售信息，保留原值</span></template>
        <span v-else class="text-slate-400">未定档</span>
      </span>
      <span class="ml-auto"><AdminLockState v-if="hasIgdb" :state="firstState" source="IGDB" @restore="emit('restore', 'first_release_date')" @cancel="emit('cancel', 'first_release_date')" /></span>
    </div>
  </section>
</template>
