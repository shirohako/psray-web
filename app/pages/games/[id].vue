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

    <GameHeader :game="data" />

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
import { ChevronRight, Trophy } from 'lucide'
import type { GameDetail } from '~/services/games'

definePageMeta({ path: '/games/:id(\\d+)' })

const route = useRoute()
const { t } = useI18n()
const id = computed(() => String(route.params.id))

// Names follow the reader's language preference (sent as Accept-Language by
// the API plugin, and fetched again when it changes), like every other page.
// `lazy` lets client-side navigation open the page at once and show
// placeholders; the server still waits, so a missing game still answers 404.
const { data, status, error } = await useApiFetch<GameDetail>(() => `/games/${id.value}`, { lazy: true })

const pending = useFetchPending(status)

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
