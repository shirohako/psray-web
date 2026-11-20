<script setup lang="ts">
import { PencilLine, Search, UserRound, X } from 'lucide'
import type { SeriesDetail } from '~/services/series'
import { mainStages, seriesYears, stageStateMap } from '~/utils/series'

/**
 * Top of the series page: cover stack, names, size of the series and the
 * trophies one version of each stage adds up to. The footer switches between
 * the guest view and a player's progress (`?psnid=`): a stage track with the
 * player's standing, or a form to pick a player.
 */
const props = defineProps<{ series: SeriesDetail; psnid: string }>()
const emit = defineEmits<{ view: [psnid: string] }>()

const { t } = useI18n()
const { user, hasRole } = useAuth()

const input = ref('')
const viewer = computed(() => props.series.viewer)
const hasProgress = computed(() => Boolean(viewer.value?.found && viewer.value.is_public && viewer.value.status))
const states = computed(() => stageStateMap(viewer.value))
const track = computed(() => mainStages(props.series.stages).map(stage => ({
  name: stage.name,
  state: states.value.get(stage.id)?.state ?? 'none',
  best: states.value.get(stage.id)?.best ?? 0,
})))
const years = computed(() => seriesYears(props.series))
const showOriginal = computed(() => props.series.name !== props.series.localized_name)
const ownPsnid = computed(() => user.value?.psnid ?? '')
const tiers = computed(() => trophyKinds.map(kind => ({ dot: kind.dot, label: t(kind.labelKey), count: props.series.tier_totals[kind.key] })))

function submit() {
  const value = input.value.trim()
  if (value) emit('view', value)
}
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="group flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-7 sm:p-6">
      <SeriesCoverStack :covers="series.covers" size="lg" />

      <div class="min-w-0 flex-1 space-y-2.5">
        <p class="text-[11px] font-semibold tracking-wider text-cyan-700">{{ $t('series.detail.eyebrow') }}</p>
        <h1 class="text-2xl font-bold leading-tight text-slate-900 text-balance" :lang="series.display_language ?? undefined">{{ series.localized_name }}</h1>
        <p v-if="showOriginal" class="text-sm text-slate-500">{{ series.name }}</p>
        <p class="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-600 tabular-nums">
          <span>{{ $t('series.stageCount', series.stage_count) }}</span>
          <span v-if="series.side_count">{{ $t('series.sideCount', series.side_count) }}</span>
          <span>{{ $t('series.trophySetCount', series.trophy_set_count) }}</span>
          <span v-if="years">{{ years }}</span>
        </p>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{{ $t('series.detail.tierTotals') }}</span>
          <span v-for="tier in tiers" :key="tier.label" class="inline-flex items-center gap-1 tabular-nums" :title="tier.label">
            <span class="size-2 rounded-full" :class="tier.dot" />{{ tier.count }}
          </span>
        </p>
      </div>

      <AppLink
        v-if="hasRole('admin')"
        :to="`/admin/series/${series.id}`"
        class="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
      >
        <LucideIcon :icon="PencilLine" class="size-3.5" />{{ $t('series.detail.edit') }}
      </AppLink>
    </div>

    <div class="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
      <!-- A player's progress -->
      <div v-if="hasProgress && viewer" class="space-y-3">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <AppLink :to="`/p/${viewer.psnid}`" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-sky-700">
            <img v-if="viewer.avatar_url" :src="viewer.avatar_url" alt="" class="size-7 rounded-full bg-slate-200 object-cover" />
            <span v-else class="grid size-7 place-items-center rounded-full bg-slate-200 text-slate-500"><LucideIcon :icon="UserRound" class="size-4" /></span>
            {{ viewer.psnid }}
          </AppLink>
          <span class="text-[13px] text-slate-600 tabular-nums">{{ $t('series.viewer.done', { done: viewer.done, total: viewer.total }) }}</span>
          <SeriesStatusBadge :status="viewer.status!" />
          <button type="button" class="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-900" @click="emit('view', '')">
            <LucideIcon :icon="X" class="size-3.5" />{{ $t('series.viewer.clear') }}
          </button>
        </div>
        <SeriesStageTrack :stages="track" :label="$t('series.viewer.done', { done: viewer.done, total: viewer.total })" />
      </div>

      <!-- Unknown or private player -->
      <div v-else-if="viewer" class="flex flex-wrap items-center gap-3 text-[13px] text-slate-600">
        <span>{{ viewer.found ? $t('series.viewer.private', { psnid: viewer.psnid }) : $t('series.viewer.notFound', { psnid: viewer.psnid }) }}</span>
        <button type="button" class="ml-auto inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-900" @click="emit('view', '')">
          <LucideIcon :icon="X" class="size-3.5" />{{ $t('series.viewer.clear') }}
        </button>
      </div>

      <!-- Guest: pick a player -->
      <form v-else class="flex flex-wrap items-center gap-2" role="search" @submit.prevent="submit">
        <label for="series-viewer" class="mr-1 text-[13px] text-slate-600">{{ $t('series.viewer.label') }}</label>
        <div class="relative w-full max-w-56 sm:w-56">
          <input
            id="series-viewer"
            v-model="input"
            type="text"
            maxlength="32"
            autocomplete="off"
            spellcheck="false"
            :placeholder="$t('series.viewer.placeholder')"
            class="h-8 w-full rounded-md border border-slate-200 bg-white pl-2.5 pr-9 text-xs outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
          <button type="submit" class="absolute right-1 top-1 grid size-6 place-items-center rounded bg-slate-900 text-white transition hover:bg-slate-700" :aria-label="$t('series.viewer.submit')">
            <LucideIcon :icon="Search" class="size-3.5" />
          </button>
        </div>
        <button
          v-if="ownPsnid"
          type="button"
          class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          @click="emit('view', ownPsnid)"
        >
          <LucideIcon :icon="UserRound" class="size-3.5" />{{ $t('series.viewer.mine') }}
        </button>
      </form>
    </div>
  </section>
</template>
