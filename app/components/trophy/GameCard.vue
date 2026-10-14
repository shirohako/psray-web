<script setup lang="ts">
import { ChevronRight } from 'lucide'
import type { GameBrowseItem } from '~/services/games'

/** Side card on a trophy set page linking to the game the set belongs to. */
defineProps<{ game: GameBrowseItem }>()
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-labelledby="trophy-game-heading">
    <h2 id="trophy-game-heading" class="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">
      {{ $t('trophy.game.title') }}
    </h2>
    <NuxtLink :to="`/games/${game.id}`" class="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50">
      <GameCover :src="game.cover_url" :alt="game.localized_name" compact class="w-12 shrink-0" />
      <div class="min-w-0 flex-1">
        <p class="line-clamp-2 text-sm font-semibold leading-5 text-slate-900 group-hover:text-sky-700" :lang="game.display_language ?? undefined">
          {{ game.localized_name }}
        </p>
        <p class="mt-0.5 truncate text-xs text-slate-400 tabular-nums">
          {{ formatReleaseDate(game.first_release_date, game.first_release_precision) }}
          · {{ $t('games.trophySetCount', game.trophy_set_count) }}
        </p>
        <GamePlatformBadges v-if="game.platforms.length" :platforms="game.platforms" :max="4" class="mt-1.5" />
      </div>
      <LucideIcon :icon="ChevronRight" class="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
    </NuxtLink>
  </section>
</template>
