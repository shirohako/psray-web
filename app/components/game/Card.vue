<script setup lang="ts">
import { CalendarDays, Trophy } from 'lucide'
import type { GameBrowseItem } from '~/services/games'

/**
 * One game in the cover grid. Every text row is a single line (long names are
 * cut, with the full name on hover), so all cards in a row are the same height.
 */
defineProps<{ game: GameBrowseItem }>()
</script>

<template>
  <NuxtLink
    :to="`/games/${game.id}`"
    class="group flex min-w-0 flex-col rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
  >
    <GameCover
      :src="game.cover_url"
      :alt="game.localized_name"
      :seed="game.id"
      :lang="game.display_language ?? undefined"
      class="transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-slate-900/10"
    />

    <div class="mt-2 min-w-0">
      <h3
        class="truncate text-[13px] font-semibold leading-5 text-slate-800 transition-colors group-hover:text-sky-700"
        :lang="game.display_language ?? undefined"
        :title="game.localized_name"
      >
        {{ game.localized_name }}
      </h3>

      <div class="mt-1.5 flex items-center justify-between gap-2 text-[11px] leading-4 text-slate-500">
        <time
          :datetime="game.first_release_date ?? undefined"
          class="inline-flex min-w-0 items-center gap-1 tabular-nums"
          :class="{ 'text-slate-400': !game.first_release_date }"
        >
          <LucideIcon :icon="CalendarDays" class="size-3 shrink-0 text-slate-400" />
          <span class="truncate">{{ formatReleaseDate(game.first_release_date, game.first_release_precision) }}</span>
        </time>
        <span
          v-if="game.trophy_set_count"
          class="inline-flex shrink-0 items-center gap-0.5 text-slate-400 tabular-nums"
          :title="$t('games.trophySetCount', game.trophy_set_count)"
        >
          <LucideIcon :icon="Trophy" class="size-3" />
          <span aria-hidden="true">{{ game.trophy_set_count }}</span>
          <span class="sr-only">{{ $t('games.trophySetCount', game.trophy_set_count) }}</span>
        </span>
      </div>

      <!-- Held at one badge's height, even when empty or a long name would wrap -->
      <div class="mt-1.5 h-4 overflow-hidden">
        <GamePlatformBadges v-if="game.platforms.length" :platforms="game.platforms" :max="3" />
      </div>
    </div>
  </NuxtLink>
</template>
