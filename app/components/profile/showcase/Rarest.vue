<script setup lang="ts">
import { Gem, Trophy } from 'lucide'
import type { ShowcaseTrophy } from '~/services/profile'

/**
 * Showcase: the owner's six lowest-PSN-rate trophies, ranked, as a compact
 * two-column list (one column on phones). Each row opens the trophy's set with
 * the owner's progress.
 */
defineProps<{ psnid: string; trophies: ShowcaseTrophy[] }>()
const { href } = useLangLink()
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <header class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <h2 class="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
        <LucideIcon :icon="Gem" class="size-4 shrink-0 text-slate-500" />
        {{ $t('profile.showcase.rarest.title') }}
      </h2>
      <span class="shrink-0 text-xs text-slate-400">{{ $t('profile.showcase.rarest.order') }}</span>
    </header>

    <ol class="grid gap-x-4 gap-y-1 p-3 sm:grid-cols-2 sm:px-4">
      <li v-for="(item, index) in trophies" :key="item.trophy_id">
        <a
          :href="href(`/trophies/${item.trophy_set_id}`)"
          class="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition hover:bg-slate-100/80"
          @click="openTrophyWithProgress($event, item.trophy_set_id, psnid)"
        >
          <span class="w-4 shrink-0 text-xs font-semibold tabular-nums text-slate-300 transition group-hover:text-slate-500">{{ index + 1 }}</span>

          <div class="relative shrink-0">
            <img
              :src="item.trophy.icon_url"
              :alt="item.trophy.name"
              loading="lazy"
              class="size-11 rounded-lg object-cover shadow-sm"
            />
            <TrophyRareFrame v-if="isRareTrophy(item.trophy)" />
            <span
              class="absolute -bottom-1.5 -right-1.5 grid size-5 place-items-center rounded-full border-2 border-white bg-white shadow-sm"
              :class="trophyTierColor(item.trophy.type)"
            >
              <LucideIcon :icon="Trophy" class="size-3" />
            </span>
          </div>

          <div class="min-w-0 flex-1">
            <h3 class="truncate text-[13px] font-semibold text-slate-900" :lang="contentLang(item.trophy.display_language, item.trophy.name)">
              {{ item.trophy.name }}
            </h3>
            <p class="mt-0.5 truncate text-[11px] text-slate-400" :lang="contentLang(item.trophy_set.display_language, item.trophy_set.name)">
              {{ item.trophy_set.name }}
            </p>
          </div>

          <div class="flex shrink-0 flex-col items-end leading-tight">
            <span class="text-[10px] font-medium text-slate-400">PSN</span>
            <span
              class="text-sm font-bold tabular-nums"
              :class="isRareTrophy(item.trophy) ? 'text-violet-700' : 'text-slate-600'"
            >{{ formatPsnRate(item.trophy.psn_earned_rate) }}</span>
          </div>
        </a>
      </li>
    </ol>
  </section>
</template>
