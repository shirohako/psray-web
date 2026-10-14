<template>
  <!-- Loading: the page's own frame in placeholders -->
  <GameDetailSkeleton v-if="pending && !data" />

  <!-- Content. Failures never reach here: `raiseFetchError` shows `error.vue`
       with a real HTTP status instead. -->
  <div v-else-if="data" class="space-y-6">
    <nav :aria-label="$t('games.detail.breadcrumb')" class="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
      <NuxtLink to="/games" class="shrink-0 transition hover:text-slate-900">{{ $t('games.detail.breadcrumb') }}</NuxtLink>
      <LucideIcon :icon="ChevronRight" class="size-3 shrink-0" />
      <span class="truncate text-slate-600" aria-current="page">{{ data.localized_name }}</span>
    </nav>

    <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <!-- Banner art when the API has it, otherwise one drawn in the cover's colours -->
      <GameBanner
        :src="data.banner_url ?? null"
        :seed="data.id"
        :cover="data.cover_url"
        :cover-color="data.cover_color"
        class="h-24 sm:h-32"
      />

      <div class="flex flex-col gap-5 px-5 pb-5 sm:flex-row sm:px-6 sm:pb-6">
        <div class="-mt-16 w-32 shrink-0 self-center rounded-lg bg-white p-1 shadow-lg shadow-slate-900/15 sm:-mt-20 sm:w-40 sm:self-start">
          <GameCover :src="data.cover_url" :alt="data.localized_name" :seed="data.id" :lang="data.display_language ?? undefined" />
        </div>

        <div class="min-w-0 flex-1 sm:pt-4">
          <h1 class="text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl" :lang="data.display_language ?? undefined">
            {{ data.localized_name }}
          </h1>
          <p v-if="originalName" class="mt-1 text-sm text-slate-500">{{ originalName }}</p>

          <dl class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
            <div class="inline-flex items-center gap-1.5">
              <dt>
                <LucideIcon :icon="CalendarDays" class="size-3.5 text-slate-400" />
                <span class="sr-only">{{ $t('games.detail.firstRelease') }}</span>
              </dt>
              <dd class="tabular-nums" :class="{ 'text-slate-400': !data.first_release_date }">
                <time :datetime="data.first_release_date ?? undefined">{{ formatReleaseDate(data.first_release_date, data.first_release_precision) }}</time>
              </dd>
            </div>
            <div class="inline-flex items-center gap-1.5">
              <dt>
                <LucideIcon :icon="Trophy" class="size-3.5 text-slate-400" />
                <span class="sr-only">{{ $t('games.detail.trophySets') }}</span>
              </dt>
              <dd>{{ $t('games.trophySetCount', data.trophy_set_count) }}</dd>
            </div>
          </dl>

          <GamePlatformBadges v-if="data.platforms.length" :platforms="data.platforms" class="mt-3" />

          <div v-if="summary" class="mt-4 max-w-prose">
            <p
              class="whitespace-pre-line text-sm leading-6 text-slate-600"
              :class="{ 'line-clamp-5': summaryLong && !summaryExpanded }"
              :lang="summaryLang"
            >
              {{ summary }}
            </p>
            <button
              v-if="summaryLong"
              type="button"
              class="mt-1 text-xs font-medium text-slate-500 transition hover:text-slate-900"
              :aria-expanded="summaryExpanded"
              @click="summaryExpanded = !summaryExpanded"
            >
              {{ summaryExpanded ? $t('games.detail.showLess') : $t('games.detail.showMore') }}
            </button>
          </div>

          <div v-if="data.links.length" class="mt-4 flex flex-wrap items-center gap-2">
            <a
              v-for="link in data.links"
              :key="link.url"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              {{ sourceLabel(link.source) }}
              <LucideIcon :icon="ExternalLink" class="size-3 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-labelledby="game-trophy-sets-heading">
      <div class="flex items-baseline gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
        <h2 id="game-trophy-sets-heading" class="font-semibold text-slate-900">{{ $t('games.detail.trophySets') }}</h2>
        <span class="text-sm text-slate-400 tabular-nums">{{ data.trophy_sets.length }}</span>
      </div>

      <template v-if="data.trophy_sets.length">
        <TrophyLibraryListHead :show-reference-times="true" :name-label="$t('games.detail.trophySets')" />
        <div class="divide-y divide-slate-100">
          <TrophyLibraryEntry v-for="set in data.trophy_sets" :key="set.id" :game="set" view="list" :show-reference-times="true" />
        </div>
      </template>
      <div v-else class="px-6 py-12 text-center">
        <span class="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400"><LucideIcon :icon="Trophy" class="size-5" /></span>
        <h3 class="mt-3 text-sm font-semibold text-slate-900">{{ $t('games.detail.trophySetsEmpty') }}</h3>
        <p class="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">{{ $t('games.detail.trophySetsEmptyHint') }}</p>
      </div>
    </section>

    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
      <GameReleases :releases="data.releases" :platforms="data.platforms" class="lg:col-span-2" />

      <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-labelledby="game-names-heading">
        <h2 id="game-names-heading" class="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">
          {{ $t('games.detail.names') }}
        </h2>
        <dl class="divide-y divide-slate-100">
          <div class="px-4 py-2.5">
            <dt class="text-[11px] text-slate-400">{{ $t('games.detail.commonName') }}</dt>
            <dd class="mt-0.5 text-sm text-slate-800">{{ data.name }}</dd>
          </div>
          <div v-for="translation in data.translations" :key="translation.language_code" class="px-4 py-2.5">
            <dt class="text-[11px] text-slate-400">{{ langLabel(translation.language_code) }}</dt>
            <dd class="mt-0.5 text-sm text-slate-800" :lang="translation.language_code">{{ translation.name }}</dd>
          </div>
        </dl>
        <div v-if="data.aliases.length" class="border-t border-slate-100 px-4 py-3">
          <h3 class="text-[11px] text-slate-400">{{ $t('games.detail.aliases') }}</h3>
          <ul class="mt-1.5 flex flex-wrap gap-1.5">
            <li v-for="alias in data.aliases" :key="alias" class="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">
              {{ alias }}
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, ChevronRight, ExternalLink, Trophy } from 'lucide'
import type { GameDetail } from '~/services/games'

definePageMeta({ path: '/games/:id(\\d+)' })

const route = useRoute()
const { t } = useI18n()
const { acceptLanguage } = usePreferences()
const id = computed(() => String(route.params.id))

// Names follow the reader's language preference (sent as Accept-Language by
// the API plugin), the same as the trophy and game lists.
// `lazy` lets client-side navigation open the page at once and show
// placeholders; the server still waits, so a missing game still answers 404.
const { data, status, error, refresh } = await useApiFetch<GameDetail>(() => `/games/${id.value}`, { lazy: true })

// A lazy fetch sits at `idle` until it starts, so count that as loading too.
const pending = computed(() => status.value === 'pending' || status.value === 'idle')
useLoadingBar(pending, () => status.value === 'error')
watch(acceptLanguage, () => refresh())

// A missing game has to answer 404, not a 200 page that says "not found".
// Watched rather than checked once: moving between two game pages reuses this
// component, so setup doesn't re-run but `error` does change.
function raiseFetchError(err: typeof error.value) {
  if (!err) return
  const notFound = (err as { statusCode?: number }).statusCode === 404
  showError(createError({
    statusCode: notFound ? 404 : 502,
    statusMessage: notFound ? 'Game not found' : 'Game service unavailable',
    fatal: true,
  }))
}
raiseFetchError(error.value)
watch(error, raiseFetchError)

const originalName = computed(() => data.value && data.value.localized_name !== data.value.name ? data.value.name : '')

const summary = computed(() => data.value?.localized_summary ?? '')
// The localized summary only differs from the base one when a translation supplied it.
const summaryLang = computed(() =>
  data.value?.display_language && data.value.localized_summary !== data.value.summary ? data.value.display_language : undefined)
// Decided by length rather than measured, so server and client render the same.
const summaryLong = computed(() => summary.value.length > 320)
const summaryExpanded = ref(false)
watch(id, () => { summaryExpanded.value = false })

const SOURCES: Record<string, string> = { igdb: 'IGDB' }
const sourceLabel = (source: string) => SOURCES[source] ?? source

useSeo({
  title: () => (data.value ? t('seo.game.title', { name: data.value.localized_name }) : t('seo.game.titleFallback')),
  description: () => {
    const game = data.value
    if (!game) return ''
    const text = game.localized_summary?.replace(/\s+/g, ' ').trim()
    if (text) return text.length > 160 ? `${text.slice(0, 157)}…` : text
    return t('seo.game.description', {
      name: game.localized_name,
      platforms: game.platforms.map(gamePlatformLabel).join(' / ') || '—',
    })
  },
})
</script>
