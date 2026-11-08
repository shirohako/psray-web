<template>
  <!-- Loading: the page's own frame in placeholders -->
  <TrophyDetailSkeleton v-if="pending && !data" />

  <!-- Content. Failures never reach here: `raiseFetchError` shows `error.vue`
       with a real HTTP status instead. -->
  <div v-else-if="data" class="space-y-6">
    <nav :aria-label="$t('common.breadcrumb')" class="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
      <template v-for="crumb in crumbs.slice(0, -1)" :key="crumb.path">
        <AppLink :to="crumb.path" class="min-w-0 shrink truncate transition hover:text-slate-900">{{ crumb.name }}</AppLink>
        <LucideIcon :icon="ChevronRight" class="size-3 shrink-0" />
      </template>
      <span class="truncate text-slate-600" aria-current="page" :lang="data.display_language">{{ displayName }}</span>
    </nav>

    <TrophyBanner :trophy-set="data.trophy_set" :display-name="displayName" :lang="data.display_language" />

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

          <TrophyListCollapse ref="trophyList" v-model:expanded="trophyListExpanded" :collapsible="visibleTrophyCount > 6" :lang="data.display_language">
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

    <!-- This set in each language it's indexed in (the footer's list is off). -->
    <LanguageLinks :locales="editions" class="text-xs text-slate-400" />
  </div>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide'
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
import { canonicalContentLang, contentEditions } from '#shared/locales'
import { pickTrophyLanguage, tlangRedirect, withTrophyLanguage } from '#shared/trophyLanguage'
import { breadcrumbJsonLd, jsonLdScript } from '~/utils/structuredData'
import { medianPlatinumTime, platinumEarnRate, seoPlatforms, trophySetSeoName } from '~/utils/trophySeo'

definePageMeta({ path: '/trophies/:id(\\d+)', languageLinks: false })

type TrophyDialogKind = 'detail' | 'earners' | 'tips'

const dialogHost = useTemplateRef<{
  open: (kind: TrophyDialogKind, trophy: Trophy) => void
}>('dialogHost')
const trophyList = useTemplateRef<{ reveal: (id: string) => Promise<void> }>('trophyList')
const tipCounts = reactive<Record<number, number>>({})

function updateTipCount(trophyId: number, value: number) {
  tipCounts[trophyId] = value
}

const route = useRoute()
const router = useRouter()
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

// The trophy text follows the interface language (`?lang=`): one language per
// URL, which is what gets indexed (`docs/seo.md`). `?tlang=` is a reader's
// override of the text — French trophy names in a Chinese interface, say.
//
// The override goes to the API as `lang`, ahead of the order the API plugin
// sends as `Accept-Language`: the reader's trophy-language preference (primary,
// then fallback), then the interface language; the set's own language comes
// last. Without a preference a bare URL therefore shows the interface
// language's text, identically for every visitor whatever their browser sends.
const { trophyLang, trophyLanguageOrder } = usePreferences()
const contentLangParam = computed(() => canonicalContentLang(route.query.tlang))
const hasTlang = computed(() => route.query.tlang !== undefined)

// `lazy` lets client-side navigation open the page at once and show
// placeholders while the set loads; the server still waits for it, so a
// missing set still answers 404 on first load.
const { data, status, error } = await useApiFetch<TrophySetDetail>(
  () => `/trophies/${id.value}`,
  {
    query: computed(() => ({
      psnid: psnid.value || undefined,
      lang: contentLangParam.value || undefined,
    })),
    lazy: true,
  },
)

// The bar also runs while a language switch or `?psnid=` lookup refetches.
const pending = useFetchPending(status)

const availableLanguages = computed(() => data.value?.available_languages ?? [])
const languageCodes = computed(() => availableLanguages.value.map(l => l.language_code))

/** Where this `?tlang=` URL should go instead, if anywhere (`#shared/trophyLanguage`). */
const tlangTarget = () => (data.value
  ? tlangRedirect(route.query, {
      available: languageCodes.value,
      defaultLanguage: data.value.trophy_set.default_language,
      served: data.value.display_language,
      preferenceEnabled: trophyLang.value.enabled,
    })
  : null)

// An old `?tlang=` link, or an override that changes nothing, 301s to the URL
// showing the same text. Decided here, on the server, where the API's answer
// for this exact request is at hand. `no-store`: the decision depends on the
// reader's preference cookie, and browsers keep 301s forever.
if (import.meta.server) {
  const target = tlangTarget()
  if (target) {
    useResponseHeader('cache-control').value = 'no-store'
    await navigateTo({ path: route.path, query: target }, { redirectCode: 301 })
  }
}

// The same in the browser, after client-side navigation or an interface
// switch that made the override redundant (`?lang=en&tlang=ko-KR` → Korean).
watch([() => route.query, data], () => {
  if (pending.value) return
  const target = tlangTarget()
  if (target) router.replace({ path: route.path, query: target, hash: route.hash })
})

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

/**
 * Switching the trophy language is a navigation, not a patch: the URL carries
 * the choice, so the result is shareable and survives a reload. It writes
 * `?tlang=` (with the interface spelled out beside it) and leaves the interface
 * language exactly as the reader set it. Picking what this reader would see
 * anyway drops the override instead, back to the indexable URL.
 */
function switchLanguage(code: string) {
  if (!code || code === data.value?.display_language) return
  const natural = pickTrophyLanguage(languageCodes.value, trophyLanguageOrder.value, data.value?.trophy_set.default_language)
  const query = withTrophyLanguage(route.query, currentUiLocale(), code === natural ? null : code)
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
// Persisted in a cookie so the preference survives reloads / navigation. No
// default value: the cookie is only written once the reader flips the switch,
// not on every first response (crawlers' included).
const spoilerCookie = useCookie<boolean | null>('show_spoilers', {
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
})
const showSpoilers = computed({
  get: () => spoilerCookie.value === true,
  set: (value: boolean) => { spoilerCookie.value = value },
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

// `#trophy-…` links (a Tip's way back to its trophy, say) open the list at that
// row. The row exists once its set has loaded: at mount after a server render,
// but only later after client-side navigation, so look again when it arrives.
function revealHashTarget() {
  if (data.value && /^#trophy-\d+$/.test(route.hash)) trophyList.value?.reveal(route.hash.slice(1))
}

onMounted(revealHashTarget)
watch([() => data.value?.trophy_set.id, () => route.hash], revealHashTarget, { flush: 'post' })

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

const editions = computed(() =>
  contentEditions(languageCodes.value, data.value?.trophy_set.default_language))

// Title and description name the platform and carry the numbers only this
// site has: platinum rate and the median time to the platinum.
const seoName = computed(() => (data.value ? trophySetSeoName(displayName.value, data.value.trophy_set.platform) : ''))
const seoDescription = computed(() => {
  const detail = data.value
  if (!detail) return ''
  const set = detail.trophy_set
  const tiers = (['platinum', 'gold', 'silver', 'bronze'] as const)
    .filter(tier => set.defined_trophies[tier] > 0)
    .map(tier => t('seo.trophy.tier', { count: set.defined_trophies[tier], label: t(`trophy.tier.${tier}`) }))
    .join(t('seo.trophy.tierSeparator'))
  const sentences = [t('seo.trophy.descCount', {
    name: seoName.value,
    platform: seoPlatforms(set.platform),
    count: totalDefined(set.defined_trophies),
    tiers,
  })]
  const rate = platinumEarnRate(detail.groups)
  if (rate !== null) sentences.push(t('seo.trophy.descPlatinumRate', { rate: rate.toFixed(1) }))
  const time = medianPlatinumTime(set)
  if (time) sentences.push(t('seo.trophy.descPlatinumTime', { time: formatDuration(time, t) }))
  sentences.push(t('seo.trophy.descTail'))
  // Latin and Hangul sentences are spaced; CJK ones run on after the full stop.
  // (`locale`, not the `utils/locale` helpers: unhead reads this outside setup.)
  return sentences.join(['en', 'ko'].includes(locale.value) ? ' ' : '')
})

// The trail from the library (through the set's game, when linked) to this set.
const crumbs = computed(() => [
  { name: t('nav.trophies'), path: '/trophies' },
  ...(data.value?.game ? [{ name: data.value.game.localized_name, path: `/games/${data.value.game.id}` }] : []),
  { name: displayName.value, path: route.path },
])

const seo = useSeo({
  title: () => (seoName.value
    ? t('seo.trophy.title', { name: seoName.value, platform: seoPlatforms(data.value?.trophy_set.platform ?? []) })
    : t('seo.trophy.titleFallback')),
  description: () => seoDescription.value,
  // The set icon is a 512×512 square; the generated card is already 2:1, so no
  // platform has to crop the cover art to make it fit.
  image: () => (data.value ? `${cardBase}/card/trophies/${id.value}.png?v=3` : undefined),
  // Dimensions of the backend-generated card.
  imageWidth: 1200,
  imageHeight: 630,
  imageType: 'image/png',
  // Indexed only in the languages its trophy text exists in.
  editions: () => editions.value,
  // `?psnid=` renders one visitor's progress, `?tlang=` one reader's choice of
  // text: personal views of the same set. Keep them out of the index rather
  // than spending crawl budget on id × psnid × tlang.
  noindex: () => hasViewer.value || hasTlang.value,
})

useHead(() => ({
  script: data.value && seo.indexable.value
    ? [jsonLdScript('trophy-breadcrumb', breadcrumbJsonLd(crumbs.value.map((crumb, index) => ({
        name: crumb.name,
        url: index === crumbs.value.length - 1 ? seo.canonical.value! : seo.absoluteUrl(crumb.path),
      }))))]
    : [],
}))
</script>
