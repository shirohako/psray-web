<template>
  <!-- Loading: the page's own frame in placeholders -->
  <TrophyDetailSkeleton v-if="pending && !data" />

  <!-- Content. Failures never reach here: `raiseFetchError` shows `error.vue`
       with a real HTTP status instead. -->
  <div v-else-if="data" class="space-y-6">
    <TrophyBanner :trophy-set="data.trophy_set" :display-name="displayName" />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Main: grouped trophy list -->
      <div class="lg:col-span-2">
        <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <TrophyListHeading
            :total="totalDefined(data.trophy_set.defined_trophies)"
            :languages="availableLanguages"
            :current="data.display_language"
            :loading="pending"
            @language="switchLanguage"
          />

          <TrophyListToolbar
            v-model:filter="filter"
            v-model:sort="sort"
            v-model:show-spoilers="showSpoilers"
            :has-viewer="hasViewer"
          />

          <TrophyListCollapse v-model:expanded="trophyListExpanded" :collapsible="visibleTrophyCount > 6">
            <TrophyGroupSection
              v-for="group in sortedGroups"
              :key="group.id"
              :group="group"
              :earned-info="earnedInfo"
              :has-viewer="hasViewer"
              :filter="filter"
              :sort="sort"
              :show-spoilers="showSpoilers"
              :numbers="trophyNumbers"
              :tip-counts="tipCounts"
              @detail="dialogHost?.open('detail', $event)"
              @earners="dialogHost?.open('earners', $event)"
              @tips="dialogHost?.open('tips', $event)"
            />
          </TrophyListCollapse>
        </div>
      </div>

      <!-- Side: viewer progress (when ?psnid= resolves), the set's game, stats, recent players -->
      <aside class="space-y-6">
        <TrophyViewerProgress
          v-if="data.viewer_progress"
          :progress="data.viewer_progress"
          :country="viewerCountry"
          :total="totalDefined(data.trophy_set.defined_trophies)"
          :defined-trophies="data.trophy_set.defined_trophies"
        />

        <TrophyGameCard v-if="data.game" :game="data.game" />

        <TrophyStatistics :trophy-set="data.trophy_set" />

        <TrophySimilarSets v-if="data.similar_trophy_sets?.length" :sets="data.similar_trophy_sets" :current-set="data.trophy_set" />

        <TrophyRecentPlayers :id="data.trophy_set.id" :players="data.recent_players" />
      </aside>
    </div>

    <TrophyDialogHost
      ref="dialogHost"
      :trophies="allTrophies"
      :display-language="data.display_language"
      @count="updateTipCount"
    />
  </div>
</template>

<script setup lang="ts">
import TrophyStatistics from '~/components/trophy/Statistics.vue'
import type { Trophy, TrophySetDetail } from '~/services/trophies'
import {
  buildEarnedInfo,
  buildTrophyNumbers,
  countVisibleTrophies,
  sortTrophyGroups,
  type TrophyFilterMode,
  type TrophySortMode,
} from '~/utils/trophyList'
import { DEFAULT_LOCALE, PSN_LANG, canonicalContentLang, isUiLocale, type UiLocale } from '#shared/locales'

definePageMeta({ path: '/trophies/:id(\\d+)' })

type TrophyDialogKind = 'detail' | 'earners' | 'tips'

const dialogHost = useTemplateRef<{
  open: (kind: TrophyDialogKind, trophy: Trophy) => void
}>('dialogHost')
const tipCounts = reactive<Record<number, number>>({})

function updateTipCount(trophyId: number, value: number) {
  tipCounts[trophyId] = value
}

const route = useRoute()
const { t, locale } = useI18n()
const id = computed(() => String(route.params.id))
const cardBase = useRuntimeConfig().public.cardBase.replace(/\/+$/, '')

// Optional viewer progress is driven entirely by the `?psnid=` query param.
// The player may have no record for this title — the API decides via
// `viewer_progress` (null when absent), so we just render what comes back.
const psnid = computed(() =>
  typeof route.query.psnid === 'string' ? route.query.psnid : '',
)
const hasViewer = computed(() => Boolean(psnid.value))

// Picking a player further down the page (recent players, rankings) only changes
// the query, which keeps the scroll position; jump up so their progress is seen.
watch(psnid, (value) => {
  if (value) window.scrollTo({ top: 0, behavior: 'smooth' })
})

// Trophy body text has its own param, `?tlang=`, deliberately separate from the
// interface language in `?lang=`: a set ships in up to 25 PSN languages, most of
// which we have no interface for, and reading French trophy names shouldn't drag
// the rest of the site out of the reader's own language.
//
// Without the param we ask for whatever the interface language implies, so a
// bare URL renders identically for every visitor instead of following whatever
// `Accept-Language` the browser happened to send.
const uiContentLang = computed(() =>
  PSN_LANG[isUiLocale(locale.value) ? locale.value as UiLocale : DEFAULT_LOCALE])
const contentLangParam = computed(() => canonicalContentLang(route.query.tlang))
const requestedLang = computed(() => contentLangParam.value || uiContentLang.value)

// `lazy` lets client-side navigation open the page at once and show
// placeholders while the set loads; the server still waits for it, so a
// missing set still answers 404 on first load.
const { data, status, error } = await useApiFetch<TrophySetDetail>(
  () => `/trophies/${id.value}`,
  {
    query: computed(() => ({
      psnid: psnid.value || undefined,
      lang: requestedLang.value,
    })),
    lazy: true,
  },
)

// The bar also runs while a language switch or `?psnid=` lookup refetches.
const pending = useFetchPending(status)

const viewerCountry = computed(() => {
  const progress = data.value?.viewer_progress
  if (!progress) return ''
  return progress.country
    || data.value?.recent_players.find(player => player.psnid === progress.psnid)?.country
    || ''
})

// A missing set has to answer 404, not a 200 page that says "not found".
// Watched rather than checked once: navigating between two trophy pages reuses
// this component, so setup doesn't re-run but `error` does change.
function raiseFetchError(err: typeof error.value) {
  if (!err) return
  const notFound = (err as { statusCode?: number }).statusCode === 404
  showError(createError({
    statusCode: notFound ? 404 : 502,
    statusMessage: notFound ? 'Trophy set not found' : 'Trophy service unavailable',
    fatal: true,
  }))
}
raiseFetchError(error.value)
watch(error, raiseFetchError)

const availableLanguages = computed(() => data.value?.available_languages ?? [])

/**
 * Switching the trophy language is a navigation, not a patch: the URL carries
 * the choice, so the result is shareable, survives a reload, and gives each
 * translation its own indexable address. It writes `?tlang=` only — `?lang=`,
 * and with it the interface language, is left exactly as the reader set it.
 */
function switchLanguage(code: string) {
  if (!code || code === data.value?.display_language) return
  const query = { ...route.query }
  // Back to what the interface language already implies: drop the param rather
  // than spell it out, so each variant keeps a single canonical URL.
  if (code === uiContentLang.value) delete query.tlang
  else query.tlang = code
  return navigateTo({ path: route.path, query, hash: route.hash })
}

// The trophy list: groups (and their trophies) in PSN order, the viewer's
// earned order, and each trophy's row number.
const earnedInfo = computed(() => buildEarnedInfo(data.value?.viewer_progress, data.value?.groups ?? []))
const sortedGroups = computed(() => sortTrophyGroups(data.value?.groups ?? []))
const allTrophies = computed(() => sortedGroups.value.flatMap(group => group.trophies))
const trophyNumbers = computed(() => buildTrophyNumbers(data.value?.groups ?? []))

// Filter + sort controls for the trophy list.
const filter = ref<TrophyFilterMode>('all')
const sort = ref<TrophySortMode>('default')
const visibleTrophyCount = computed(() =>
  countVisibleTrophies(sortedGroups.value, filter.value, hasViewer.value, earnedInfo.value))
// Phones fold the list after its first rows. URL fragments are unavailable to
// SSR: start collapsed on both server and client, then reveal and re-scroll
// after hydration to avoid a class mismatch.
const trophyListExpanded = ref(false)

// Mask spoiler (PSN-hidden) trophies until toggled on; earned ones stay visible.
// Persisted in a cookie so the preference survives reloads / navigation.
const showSpoilers = useCookie<boolean>('show_spoilers', {
  default: () => false,
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
})

// Earned-based filter/sort need a viewer; reset them when the lookup is cleared.
watch(hasViewer, (v) => {
  if (!v) {
    filter.value = 'all'
    if (sort.value === 'earned') sort.value = 'default'
  }
})

watch([filter, sort, showSpoilers], () => {
  trophyListExpanded.value = false
})

async function revealHashTarget(hash: string) {
  if (!/^#trophy-\d+$/.test(hash)) return
  trophyListExpanded.value = true
  await nextTick()
  document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
}

onMounted(() => revealHashTarget(route.hash))
watch(() => route.hash, revealHashTarget)

/**
 * The set's title in the language actually being displayed. `available_languages`
 * carries a localized `name` per language; `trophy_set.name` is the raw default.
 */
const displayName = computed(() => {
  const detail = data.value
  if (!detail) return ''
  const match = detail.available_languages
    ?.find(l => l.language_code === detail.display_language)
  return match?.name || detail.trophy_set.name
})

useSeo({
  title: () => (displayName.value
    ? t('seo.trophy.title', { name: displayName.value })
    : t('seo.trophy.titleFallback')),
  description: () => (data.value
    ? t('seo.trophy.description', {
        name: displayName.value,
        count: totalDefined(data.value.trophy_set.defined_trophies),
        platform: data.value.trophy_set.platform.join(' / '),
      })
    : ''),
  // The set icon is a 512×512 square; the generated card is already 2:1, so no
  // platform has to crop the cover art to make it fit.
  image: () => (data.value ? `${cardBase}/card/trophies/${id.value}.png?v=3` : undefined),
  // Dimensions of the backend-generated card.
  imageWidth: 1200,
  imageHeight: 630,
  imageType: 'image/png',
  // Canonical editions depend on served trophy text, regardless of UI language.
  canonicalLang: DEFAULT_LOCALE,
  contentLang: () => canonicalContentLang(data.value?.display_language),
  // Advertise one canonical edition per available trophy language.
  altContentLangs: () => availableLanguages.value.map(l => l.language_code),
  trophyDefaultLang: () => data.value?.trophy_set.default_language,
  // `?psnid=` renders one visitor's progress: same set, personalised. Keep it
  // out of the index rather than spending crawl budget on id × psnid.
  noindex: () => hasViewer.value,
})
</script>
