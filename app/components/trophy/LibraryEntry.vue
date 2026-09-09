<script setup lang="ts">
import { Award, CheckCircle2, ChevronRight, Clock3, Gauge, History, Languages, Timer, Trophy, Users, Zap } from 'lucide'
import type { TrophyBrowseItem } from '~/services/trophies'

const props = defineProps<{ game: TrophyBrowseItem; view: 'list' | 'grid'; showReferenceTimes: boolean }>()
const { t } = useI18n()

const languageNames = computed(() => formatList(
  props.game.available_languages.map(language => langLabel(language.language_code)),
))

const showPlatinumComparison = computed(() =>
  props.game.platinum_rate !== null
  && props.game.platinum_achievers !== props.game.completed_players,
)

function rate(value: number | null) {
  return value === null ? '—' : `${value.toFixed(1)}%`
}

function isoDate(value: string) {
  return value.slice(0, 10)
}
</script>

<template>
  <NuxtLink
    :to="`/trophies/${game.id}`"
    class="library-entry group"
    :class="{ 'is-card': view === 'grid', 'no-reference-times': !showReferenceTimes }"
    :aria-label="$t('library.preview', { name: game.localized_name })"
  >
    <TrophyLibraryArtwork :game="game" class="entry-art" />

    <div class="entry-name min-w-0">
      <h3
        class="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-800 transition group-hover:text-sky-700"
        :title="game.localized_name === game.name ? undefined : game.name"
      >
        {{ game.localized_name }}
      </h3>
      <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          v-for="platform in game.platform"
          :key="platform"
          class="rounded px-1.5 py-0.5 text-[9px] font-bold leading-3"
          :class="platformBadgeClass(platform)"
        >
          {{ platformLabel(platform) }}
        </span>
        <span class="text-[10px] text-slate-400">#{{ game.id }}</span>
        <span class="text-[10px] text-slate-400">{{ game.np_communication_id }}</span>
      </div>
      <div class="entry-meta mt-1 flex flex-wrap gap-x-2 text-[9px] leading-4 text-slate-400">
        <time :datetime="game.created_at" class="inline-flex items-center gap-1">
          <LucideIcon :icon="Clock3" class="size-3" />{{ isoDate(game.created_at) }}
        </time>
        <span v-if="game.translation_count > 0" class="inline-flex items-center gap-1" :title="languageNames">
          <LucideIcon :icon="Languages" class="size-3" />{{ game.translation_count }}
        </span>
      </div>
    </div>

    <div class="entry-measures">
      <div class="entry-trophies">
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span
            v-for="kind in trophyKinds"
            :key="kind.key"
            class="inline-flex items-center gap-1 text-[11px] tabular-nums"
            :aria-label="`${t(kind.labelKey)} ${game.defined_trophies[kind.key]}`"
            :title="t(kind.labelKey)"
          >
            <LucideIcon :icon="Trophy" class="size-3" :class="kind.text" stroke-width="1.75" />
            <span class="text-slate-600">{{ game.defined_trophies[kind.key] }}</span>
          </span>
        </div>
        <div class="mt-1.5 flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400">
          <span>{{ $t('library.trophyCount', { count: totalDefined(game.defined_trophies) }) }}</span>
          <Tooltip :content="$t('library.difficultHint')" placement="top">
            <span class="inline-flex items-center gap-1">
              {{ $t('library.difficultCount', { count: game.difficult_trophy_count }) }}
              <span class="sr-only">— {{ $t('library.difficultHint') }}</span>
            </span>
          </Tooltip>
        </div>
      </div>

      <div class="entry-players tabular-nums">
        <span class="flex items-center gap-1 text-[10px] text-slate-400">
          <LucideIcon :icon="Users" class="size-2.5 shrink-0 text-sky-500" /><span class="shrink-0">{{ $t('library.playedLabel') }}</span><span class="entry-players-value">{{ fmt(game.owners) }}</span>
        </span>
        <span class="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
          <LucideIcon :icon="History" class="size-2.5 shrink-0 text-amber-500" /><span class="shrink-0">{{ $t('library.recentLabel') }}</span><span class="entry-players-value">{{ fmt(game.recent_players) }}</span>
        </span>
        <span class="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
          <LucideIcon :icon="CheckCircle2" class="size-2.5 shrink-0 text-blue-500" /><span class="shrink-0">{{ $t('library.completedLabel') }}</span><span class="entry-players-value">{{ fmt(game.completed_players) }}</span>
        </span>
        <span v-if="showPlatinumComparison" class="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
          <LucideIcon :icon="Award" class="size-2.5 shrink-0 text-violet-500" /><span class="shrink-0">{{ $t('library.platinumLabel') }}</span><span class="entry-players-value">{{ fmt(game.platinum_achievers) }}</span>
        </span>
      </div>

      <div class="entry-rates tabular-nums">
        <div v-if="showPlatinumComparison" class="flex items-center justify-center gap-1.5">
          <LucideIcon :icon="Award" class="size-3 text-cyan-500" />
          <span class="text-[10px] text-slate-400">{{ $t('library.platinumRate') }}</span>
          <span class="text-xs" :class="game.platinum_rate === null ? 'text-slate-400' : 'font-semibold text-cyan-700'">
            {{ rate(game.platinum_rate) }}
          </span>
        </div>
        <div class="flex items-center justify-center gap-1.5 text-[10px] text-slate-400" :class="{ 'mt-1': showPlatinumComparison }">
          <LucideIcon :icon="CheckCircle2" class="size-3 text-emerald-500" />
          <span>{{ $t('library.completionRate') }}</span><span>{{ rate(game.completion_rate) }}</span>
        </div>
      </div>

      <div v-if="showReferenceTimes" class="entry-times tabular-nums">
        <div class="flex items-center gap-1 text-[10px] font-medium text-slate-600">
          <LucideIcon :icon="Clock3" class="size-3 text-slate-400" />
          {{ $t('library.medianShort') }} {{ formatDuration(game.median_completion_time) }}
        </div>
        <div class="time-details mt-1 gap-0.5 text-[9px] leading-4 text-slate-400">
          <span class="flex min-w-0 items-center gap-1"><LucideIcon :icon="Timer" class="size-2.5 shrink-0 text-sky-500" /><span class="shrink-0">{{ $t('library.averageTimeShort') }}</span><span class="ml-auto truncate">{{ formatDuration(game.average_completion_time) }}</span></span>
          <span class="flex min-w-0 items-center gap-1"><LucideIcon :icon="Gauge" class="size-2.5 shrink-0 text-violet-500" /><span class="shrink-0">{{ $t('library.p10Short') }}</span><span class="ml-auto truncate">{{ formatDuration(game.p10_completion_time) }}</span></span>
          <span class="flex min-w-0 items-center gap-1"><LucideIcon :icon="Zap" class="size-2.5 shrink-0 text-amber-500" /><span class="shrink-0">{{ $t('library.fastestShort') }}</span><span class="ml-auto truncate">{{ formatDuration(game.fastest_completion_time) }}</span></span>
        </div>
      </div>
    </div>

    <LucideIcon :icon="ChevronRight" class="entry-arrow size-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
  </NuxtLink>
</template>

<style scoped>
.library-entry {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 9px 12px;
  padding: 13px 14px;
  align-items: start;
  transition: background-color 150ms;
}
.library-entry:hover { background: var(--color-slate-50); }
.library-entry:focus-visible { outline: 2px solid var(--color-sky-600); outline-offset: -2px; }
.entry-art { width: 80px; height: 64px; grid-column: 1; }
.entry-name { grid-column: 2; }
.entry-measures { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; }
.entry-trophies, .entry-times { grid-column: 1 / -1; }
.entry-arrow { display: none; }
.time-details { display: flex; flex-direction: column; }
.entry-players-value { margin-left: auto; }

@media (min-width: 768px) {
  .library-entry:not(.is-card) {
    grid-template-columns: 96px minmax(160px, 1fr) 148px 100px 120px 166px 12px;
    column-gap: 12px;
    padding: 11px 16px;
    min-height: 102px;
    align-items: center;
  }
  .library-entry:not(.is-card).no-reference-times {
    grid-template-columns: 96px minmax(160px, 1fr) 148px 100px 120px 12px;
  }
  .library-entry:not(.is-card) .entry-art { width: 96px; height: 64px; grid-column: auto; }
  .library-entry:not(.is-card) .entry-name { grid-column: auto; }
  .library-entry:not(.is-card) .entry-measures { display: contents; }
  .library-entry:not(.is-card) .entry-trophies,
  .library-entry:not(.is-card) .entry-times { grid-column: auto; }
  .library-entry:not(.is-card) .entry-arrow { display: block; }
}

.is-card {
  background: white;
  border: 1px solid var(--color-slate-200);
  border-radius: 8px;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 10px 12px;
  padding: 13px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.025);
}
.is-card:hover {
  background: white;
  border-color: var(--color-slate-300);
  box-shadow: 0 5px 16px rgb(15 23 42 / 0.06);
}
.is-card .entry-art { width: 76px; height: 64px; }
.is-card .entry-measures {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid var(--color-slate-100);
  padding-top: 9px;
}
.is-card .entry-trophies,
.is-card .entry-times { grid-column: auto; }
.is-card .entry-trophies {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 12px;
}
.is-card .entry-trophies > div:last-child { margin-top: 0; }
.is-card .entry-players,
.is-card .entry-rates {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px 12px;
}
.is-card .entry-players { padding-top: 8px; }
.is-card .entry-rates { padding-top: 6px; }
.is-card .entry-players > span,
.is-card .entry-rates > div { margin-top: 0; }
.is-card .entry-rates > div { justify-content: flex-start; }
.is-card .entry-times {
  margin-top: 9px;
  border-top: 1px dashed var(--color-slate-200);
  padding-top: 8px;
}

@media (max-width: 767px) {
  .library-entry:not(.is-card) {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 8px 11px;
    padding: 12px;
  }
  .library-entry:not(.is-card) .entry-art { width: 72px; height: 56px; }
  .library-entry:not(.is-card) .entry-measures {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .library-entry:not(.is-card) .entry-trophies {
    grid-column: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 4px 12px;
    margin-top: 1px;
    border-top: 1px solid var(--color-slate-100);
    padding-top: 8px;
  }
  .library-entry:not(.is-card) .entry-trophies > div:last-child { margin-top: 0; }
  .library-entry:not(.is-card) .entry-players,
  .library-entry:not(.is-card) .entry-rates {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px 12px;
  }
  .library-entry:not(.is-card) .entry-players { padding-top: 7px; }
  .library-entry:not(.is-card) .entry-rates { padding-top: 5px; }
  .library-entry:not(.is-card) .entry-players > span,
  .library-entry:not(.is-card) .entry-rates > div { margin-top: 0; }
  .library-entry:not(.is-card) .entry-rates > div { justify-content: flex-start; }
  .library-entry:not(.is-card) .entry-times {
    grid-column: auto;
    margin-top: 8px;
    border-top: 1px dashed var(--color-slate-200);
    padding-top: 7px;
  }
}

@media (min-width: 1024px) {
  .is-card .entry-measures {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(166px, 0.9fr);
    grid-template-areas:
      'trophies trophies'
      'players times'
      'rates times';
    column-gap: 18px;
  }
  .is-card .entry-trophies { grid-area: trophies; }
  .is-card .entry-players { grid-area: players; align-self: end; }
  .is-card .entry-rates { grid-area: rates; align-self: start; }
  .is-card .entry-times {
    grid-area: times;
    align-self: stretch;
    margin-top: 7px;
    border-top: 0;
    border-left: 1px dashed var(--color-slate-200);
    padding-top: 0;
    padding-left: 16px;
  }
  .is-card.no-reference-times .entry-measures {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'trophies'
      'players'
      'rates';
  }
}

@media (prefers-reduced-motion: reduce) {
  .library-entry, .entry-arrow { transition: none; transform: none; }
}
</style>
