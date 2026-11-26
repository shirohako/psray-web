<script setup lang="ts">
import { Award, Trophy } from 'lucide'
import type { ShowcaseTrophy } from '~/services/profile'

/**
 * Showcase: trophies the owner picked (up to 12, in their order), each as a
 * small card with its icon, name and game. A card opens the trophy's set with
 * the owner's progress.
 */
defineProps<{ psnid: string; trophies: ShowcaseTrophy[] }>()
const { href } = useLangLink()
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <header class="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <h2 class="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
        <LucideIcon :icon="Award" class="size-4 shrink-0 text-slate-500" />
        {{ $t('profile.showcase.featured.title') }}
      </h2>
    </header>

    <ul class="grid grid-cols-3 gap-2.5 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4 lg:grid-cols-6">
      <li v-for="item in trophies" :key="item.trophy_id" class="min-w-0">
        <a
          :href="href(`/trophies/${item.trophy_set_id}`)"
          :title="`${item.trophy.name}\n${item.trophy_set.name}\nPSN ${formatPsnRate(item.trophy.psn_earned_rate)}`"
          class="group flex h-full flex-col items-center rounded-lg bg-slate-50 px-1.5 pb-2.5 pt-3.5 text-center transition hover:bg-slate-100 hover:shadow-sm"
          @click="openTrophyWithProgress($event, item.trophy_set_id, psnid)"
        >
          <div class="relative shrink-0 transition duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
            <img
              :src="item.trophy.icon_url"
              :alt="item.trophy.name"
              loading="lazy"
              class="size-14 rounded-lg object-cover shadow-sm sm:size-16"
            />
            <TrophyRareFrame v-if="isRareTrophy(item.trophy)" />
            <span
              class="absolute -bottom-1.5 -right-1.5 grid size-5.5 place-items-center rounded-full border-2 border-white bg-white shadow-sm"
              :class="trophyTierColor(item.trophy.type)"
            >
              <LucideIcon :icon="Trophy" class="size-3" />
            </span>
          </div>
          <h3
            class="mt-3 w-full truncate text-[11.5px] font-semibold text-slate-900"
            :lang="contentLang(item.trophy.display_language, item.trophy.name)"
          >
            {{ item.trophy.name }}
          </h3>
          <p
            class="mt-0.5 w-full truncate text-[10px] text-slate-400"
            :lang="contentLang(item.trophy_set.display_language, item.trophy_set.name)"
          >
            {{ item.trophy_set.name }}
          </p>
        </a>
      </li>
    </ul>
  </section>
</template>
