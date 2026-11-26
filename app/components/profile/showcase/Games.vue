<script setup lang="ts">
import { Heart } from 'lucide'
import type { ShowcaseGame } from '~/services/profile'

/**
 * Showcase: up to six played games the owner picked, as one row of art tiles
 * (three per row on phones). PS5 art is square and older art 320×176, so each
 * sits at its own aspect in a square slot. A tile opens the set with the
 * owner's progress.
 */
defineProps<{ psnid: string; games: ShowcaseGame[] }>()
const { href } = useLangLink()
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <header class="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <h2 class="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
        <LucideIcon :icon="Heart" class="size-4 shrink-0 text-slate-500" />
        {{ $t('profile.showcase.games.title') }}
      </h2>
    </header>

    <ul class="grid grid-cols-3 gap-3 p-3 sm:grid-cols-6 sm:p-4">
      <li v-for="game in games" :key="game.id" class="min-w-0">
        <a
          :href="href(`/trophies/${game.id}`)"
          :title="game.name"
          class="group block"
          @click="openTrophyWithProgress($event, game.id, psnid)"
        >
          <div class="relative flex aspect-square items-center justify-center rounded-lg bg-slate-100 p-1.5 transition group-hover:bg-slate-200/70">
            <div class="relative flex size-full items-center justify-center transition duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
              <TrophySetImage :src="game.icon_url" :alt="game.name" :platform="game.platform" />
            </div>
          </div>
          <p
            class="mt-2 truncate text-xs font-semibold text-slate-900 transition group-hover:text-slate-600"
            :lang="contentLang(game.display_language, game.name)"
          >{{ game.name }}</p>
        </a>
      </li>
    </ul>
  </section>
</template>
