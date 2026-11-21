<template>
  <SeriesDetailSkeleton v-if="pending && !data" />

  <!-- Failures never reach here: `raiseFetchError` shows `error.vue` with a real HTTP status. -->
  <div v-else-if="data" class="space-y-6" :class="{ 'opacity-70 transition-opacity': pending }">
    <nav :aria-label="$t('common.breadcrumb')" class="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
      <AppLink to="/series" class="shrink-0 transition hover:text-slate-900">{{ $t('series.detail.breadcrumb') }}</AppLink>
      <LucideIcon :icon="ChevronRight" class="size-3 shrink-0" />
      <span class="truncate text-slate-600" aria-current="page">{{ data.localized_name }}</span>
    </nav>

    <SeriesHero :series="data" :psnid="psnid" @view="viewPlayer" />

    <section :aria-label="$t('series.detail.stagesTitle')">
      <ol>
        <SeriesStageCard
          v-for="(stage, index) in main"
          :key="stage.id"
          :stage="stage"
          :state="states.get(stage.id)"
          :progress="progress"
          :psnid="viewerPsnid"
          :last="index === main.length - 1"
        />
      </ol>
    </section>

    <section v-if="side.length" class="space-y-3" aria-labelledby="series-side-heading">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="series-side-heading" class="text-sm font-semibold text-slate-900">{{ $t('series.detail.side') }}</h2>
        <p class="text-xs text-slate-400">{{ $t('series.detail.sideHint') }}</p>
      </div>
      <ol>
        <SeriesStageCard
          v-for="(stage, index) in side"
          :key="stage.id"
          :stage="stage"
          :state="states.get(stage.id)"
          :progress="progress"
          :psnid="viewerPsnid"
          :last="index === side.length - 1"
        />
      </ol>
    </section>

    <p v-if="data.description" class="max-w-prose whitespace-pre-line text-sm leading-6 text-slate-600">{{ data.description }}</p>

    <LanguageLinks :locales="editions" class="text-xs text-slate-400" />
  </div>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide'
import type { SeriesDetail } from '~/services/series'
import { contentEditions } from '#shared/locales'
import { breadcrumbJsonLd, jsonLdScript } from '~/utils/structuredData'
import { entryProgressMap, mainStages, seriesCardUrl, sideStages, stageStateMap } from '~/utils/series'

definePageMeta({ path: '/series/:id(\\d+)', languageLinks: false })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const id = computed(() => String(route.params.id))

// A player's progress is driven by `?psnid=`, like the trophy set page. Without
// one, a signed-in reader sees their own — fetched, but not written into the URL,
// so the page stays the same shareable, indexable page.
const psnid = computed(() => (typeof route.query.psnid === 'string' ? route.query.psnid.trim() : ''))
const { user } = useAuth()
const ownPsnid = computed(() => user.value?.psnid ?? '')
const shownPsnid = computed(() => psnid.value || ownPsnid.value)

const { data, status, error } = await useApiFetch<SeriesDetail>(() => `/series/${id.value}`, {
  query: computed(() => ({ psnid: shownPsnid.value || undefined })),
  lazy: true,
})
const pending = useFetchPending(status)

// A missing series has to answer 404, not a 200 page that says "not found".
function raiseFetchError(err: typeof error.value) {
  if (!err) return
  const notFound = (err as { statusCode?: number }).statusCode === 404
  showError(createError({
    statusCode: notFound ? 404 : 502,
    statusMessage: notFound ? 'Series not found' : 'Series service unavailable',
    fatal: true,
  }))
}
raiseFetchError(error.value)
watch(error, raiseFetchError)

const main = computed(() => mainStages(data.value?.stages ?? []))
const side = computed(() => sideStages(data.value?.stages ?? []))
const viewer = computed(() => data.value?.viewer ?? null)
// Rows only switch to the player's view once there is progress to show.
const viewerPsnid = computed(() => (viewer.value?.found && viewer.value.is_public ? viewer.value.psnid : undefined))
const progress = computed(() => entryProgressMap(viewer.value))
const states = computed(() => stageStateMap(viewer.value))

/**
 * Show a player's progress, keeping the rest of the query. '' — or the reader's
 * own PSN ID — drops `?psnid=`, which brings back the reader's own progress (or
 * the plain page for a guest).
 */
function viewPlayer(value: string) {
  const { psnid: _psnid, ...rest } = route.query
  const own = value.toLowerCase() === ownPsnid.value.toLowerCase()
  router.push(localizeTo({ query: value && !own ? { ...rest, psnid: value } : rest }))
}

// Indexed in Japanese, English, and the languages its name is translated into (as in the sitemap).
const editions = computed(() => contentEditions(data.value?.languages ?? []))

const cardBase = useRuntimeConfig().public.cardBase
// Until the series has a card of its own, the brand card stands in (see `resolveSeoImage`).
const cardImage = computed(() => (data.value ? seriesCardUrl(cardBase, data.value, 'jpg') : null))

const seo = useSeo({
  title: () => (data.value ? t('seo.series.detailTitle', { name: data.value.localized_name }) : t('seo.series.detailTitleFallback')),
  description: () => (data.value
    ? t('seo.series.detailDescription', { name: data.value.localized_name, stages: data.value.stage_count, sets: data.value.trophy_set_count })
    : ''),
  image: () => cardImage.value ?? undefined,
  imageAlt: () => (cardImage.value && data.value ? t('card.alt', { name: data.value.name }) : undefined),
  // Dimensions of the backend-generated card.
  imageWidth: 1200,
  imageHeight: 630,
  imageType: 'image/jpeg',
  editions: () => editions.value,
  // One player's progress is a personal view of the page, not a page of its own.
  noindex: () => Boolean(psnid.value),
})

useHead(() => {
  const series = data.value
  const url = seo.canonical.value
  if (!series || !url) return { script: [] }
  return {
    script: [
      jsonLdScript('series-breadcrumb', breadcrumbJsonLd([
        { name: t('series.detail.breadcrumb'), url: seo.absoluteUrl('/series') },
        { name: series.localized_name, url },
      ])),
    ],
  }
})
</script>
