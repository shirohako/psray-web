<script setup lang="ts">
import { CalendarDays, ExternalLink, Trophy } from 'lucide'
import type { GameDetail } from '~/services/games'

/**
 * Header card of the game page: banner and cover, the names, first release
 * and trophy-set count, platforms, the summary (clamped when long) and links
 * out to the game's sources.
 */
const props = defineProps<{ game: GameDetail }>()

const originalName = computed(() => props.game.localized_name !== props.game.name ? props.game.name : '')

const summary = computed(() => props.game.localized_summary ?? '')
// The localized summary only differs from the base one when a translation supplied it.
const summaryLang = computed(() =>
  props.game.display_language && props.game.localized_summary !== props.game.summary ? props.game.display_language : undefined)
// Decided by length rather than measured, so server and client render the same.
const summaryLong = computed(() => summary.value.length > 320)
const summaryExpanded = ref(false)
watch(() => props.game.id, () => { summaryExpanded.value = false })

const SOURCES: Record<string, string> = { igdb: 'IGDB' }
const sourceLabel = (source: string) => SOURCES[source] ?? source
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <!-- Banner art when the API has it, otherwise one drawn in the cover's colours -->
    <GameBanner
      :src="game.banner_url ?? null"
      :seed="game.id"
      :cover="game.cover_url"
      :cover-color="game.cover_color"
      class="h-24 sm:h-32"
    />

    <div class="flex flex-col gap-5 px-5 pb-5 sm:flex-row sm:px-6 sm:pb-6">
      <!-- relative: the banner above is positioned, so without its own stacking the overlapping cover would paint underneath it -->
      <div class="relative z-10 -mt-16 w-32 shrink-0 self-center rounded-lg bg-white p-1 shadow-lg shadow-slate-900/15 sm:-mt-20 sm:w-40 sm:self-start">
        <GameCover :src="game.cover_url" :alt="game.localized_name" :seed="game.id" :lang="game.display_language ?? undefined" />
      </div>

      <div class="min-w-0 flex-1 sm:pt-4">
        <h1 class="text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl" :lang="game.display_language ?? undefined">
          {{ game.localized_name }}
        </h1>
        <p v-if="originalName" class="mt-1 text-sm text-slate-500">{{ originalName }}</p>

        <dl class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
          <div class="inline-flex items-center gap-1.5">
            <dt>
              <LucideIcon :icon="CalendarDays" class="size-3.5 text-slate-400" />
              <span class="sr-only">{{ $t('games.detail.firstRelease') }}</span>
            </dt>
            <dd class="tabular-nums" :class="{ 'text-slate-400': !game.first_release_date }">
              <time :datetime="game.first_release_date ?? undefined">{{ formatReleaseDate(game.first_release_date, game.first_release_precision) }}</time>
            </dd>
          </div>
          <div class="inline-flex items-center gap-1.5">
            <dt>
              <LucideIcon :icon="Trophy" class="size-3.5 text-slate-400" />
              <span class="sr-only">{{ $t('games.detail.trophySets') }}</span>
            </dt>
            <dd>{{ $t('games.trophySetCount', game.trophy_set_count) }}</dd>
          </div>
        </dl>

        <GamePlatformBadges v-if="game.platforms.length" :platforms="game.platforms" class="mt-3" />

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

        <div v-if="game.links.length" class="mt-4 flex flex-wrap items-center gap-2">
          <a
            v-for="link in game.links"
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
</template>
