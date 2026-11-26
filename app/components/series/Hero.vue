<script setup lang="ts">
import { PencilLine, UserRound, X } from 'lucide'
import type { SeriesDetail } from '~/services/series'
import { mainStages, seriesCardUrl, seriesYears, stageStateMap } from '~/utils/series'

/**
 * Top of the series page: the generated share card (the cover stack until one
 * exists), the name as text so it can be selected and copied, the series' size
 * as a short list, and the trophies one version of each stage adds up to.
 *
 * The footer shows whose progress the page carries: `?psnid=` when given,
 * otherwise the signed-in reader's own (the page fetches it without touching
 * the URL). A PSN ID box to look up someone else is always there; a guest with
 * no `?psnid=` gets just the box.
 */
const props = defineProps<{
  series: SeriesDetail
  /** `?psnid=` as given in the URL; empty when the page falls back to the reader. */
  psnid: string
}>()
const emit = defineEmits<{ view: [psnid: string] }>()

const { t } = useI18n()
const { user, hasRole } = useAuth()

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

const cardBase = useRuntimeConfig().public.cardBase
// The 800px WebP the list uses is enough on a 1× screen; 2× screens get the 1200px JPEG.
const card = computed(() => {
  const webp = seriesCardUrl(cardBase, props.series, 'webp')
  const jpeg = seriesCardUrl(cardBase, props.series, 'jpg')
  return webp && jpeg ? { src: webp, srcset: `${webp} 800w, ${jpeg} 1200w` } : null
})
const facts = computed(() => [
  { label: t('series.detail.facts.stages'), value: fmt(props.series.stage_count) },
  ...(props.series.side_count ? [{ label: t('series.detail.facts.side'), value: fmt(props.series.side_count) }] : []),
  { label: t('series.detail.facts.trophySets'), value: fmt(props.series.trophy_set_count) },
  ...(years.value ? [{ label: t('series.detail.facts.years'), value: years.value }] : []),
  { label: t('series.detail.facts.players'), value: fmt(props.series.popularity) },
])
// Someone picked through `?psnid=`: offer the way back — to the reader's own
// progress when signed in, to the plain page for a guest.
const picked = computed(() => Boolean(props.psnid) && props.psnid.toLowerCase() !== ownPsnid.value.toLowerCase())
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div class="group flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8">
      <img
        v-if="card"
        :src="card.src"
        :srcset="card.srcset"
        sizes="(min-width: 1024px) 560px, 100vw"
        width="1200"
        height="630"
        :alt="$t('card.alt', { name: series.name })"
        class="aspect-[40/21] w-full shrink-0 rounded-lg bg-[#0c0f1a] object-cover lg:w-[56%] lg:max-w-[560px]"
      />
      <SeriesCoverStack v-else :covers="series.covers" size="lg" />

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-3">
          <p class="text-[11px] font-semibold tracking-wider text-cyan-700">{{ $t('series.detail.eyebrow') }}</p>
          <AppLink
            v-if="hasRole('admin')"
            :to="`/admin/series/${series.id}`"
            class="-mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <LucideIcon :icon="PencilLine" class="size-3.5" />{{ $t('series.detail.edit') }}
          </AppLink>
        </div>
        <h1 class="mt-1.5 text-2xl font-bold leading-tight text-slate-900 text-balance" :lang="contentLang(series.display_language, series.localized_name)">{{ series.localized_name }}</h1>
        <p v-if="showOriginal" class="mt-1 text-sm text-slate-500">{{ series.name }}</p>

        <dl class="mt-4 divide-y divide-slate-100 border-y border-slate-100 text-[13px]">
          <div v-for="fact in facts" :key="fact.label" class="flex items-baseline justify-between gap-4 py-2">
            <dt class="text-slate-500">{{ fact.label }}</dt>
            <dd class="font-semibold text-slate-900 tabular-nums">{{ fact.value }}</dd>
          </div>
        </dl>

        <p class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{{ $t('series.detail.tierTotals') }}</span>
          <span v-for="tier in tiers" :key="tier.label" class="inline-flex items-center gap-1 tabular-nums" :title="tier.label">
            <span class="size-2 rounded-full" :class="tier.dot" />{{ tier.count }}
          </span>
        </p>
      </div>
    </div>

    <div class="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <!-- A player's progress -->
        <template v-if="hasProgress && viewer">
          <AppLink :to="`/p/${viewer.psnid}`" class="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-sky-700">
            <img v-if="viewer.avatar_url" :src="viewer.avatar_url" alt="" class="size-7 rounded-full bg-slate-200 object-cover" />
            <span v-else class="grid size-7 place-items-center rounded-full bg-slate-200 text-slate-500"><LucideIcon :icon="UserRound" class="size-4" /></span>
            {{ viewer.psnid }}
          </AppLink>
          <span class="text-[13px] text-slate-600 tabular-nums">{{ $t('series.viewer.done', { done: viewer.done, total: viewer.total }) }}</span>
          <SeriesStatusBadge :status="viewer.status!" />
        </template>

        <!-- Unknown or private player -->
        <span v-else-if="viewer" class="text-[13px] text-slate-600">
          {{ viewer.found ? $t('series.viewer.private', { psnid: viewer.psnid }) : $t('series.viewer.notFound', { psnid: viewer.psnid }) }}
        </span>

        <div class="flex flex-wrap items-center gap-2" :class="viewer ? 'ml-auto' : ''">
          <SeriesPlayerLookup @view="emit('view', $event)" />
          <button
            v-if="picked && ownPsnid"
            type="button"
            class="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            @click="emit('view', '')"
          >
            <LucideIcon :icon="UserRound" class="size-3.5" />{{ $t('series.viewer.mine') }}
          </button>
          <button
            v-else-if="picked"
            type="button"
            class="inline-flex h-8 items-center gap-1 px-1 text-xs text-slate-500 transition hover:text-slate-900"
            @click="emit('view', '')"
          >
            <LucideIcon :icon="X" class="size-3.5" />{{ $t('series.viewer.clear') }}
          </button>
        </div>
      </div>

      <SeriesStageTrack
        v-if="hasProgress && viewer"
        class="mt-3"
        :stages="track"
        :label="$t('series.viewer.done', { done: viewer.done, total: viewer.total })"
      />
    </div>
  </section>
</template>
