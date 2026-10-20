<script setup lang="ts">
import { Trophy } from 'lucide'
import type { Profile } from '~/services/profile'

/**
 * Account level (tier-coloured progress ring) + trophy total + per-tier breakdown. One
 * row when the card is wide enough; otherwise level/total on top and the tiers
 * in a grid below, so nothing wraps on its own (a lone divider, a lone tier).
 */
const props = defineProps<{ profile: Profile }>()

const total = computed(() => sumTrophies(props.profile))
</script>

<template>
  <div class="@container rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3">
    <div class="flex flex-col gap-3 @4xl:flex-row @4xl:items-center @4xl:gap-6">
      <!-- Stacked: two equal halves around a centred divider, each with its icon
           and number on one line and the label centred below (beside the number
           there's too little room on phones). The icon row keeps the icon's height
           even when the total's icon is hidden, so both labels line up. One row:
           label beside the icon. -->
      <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 @2xs:gap-4 @sm:gap-6 @4xl:flex">
        <!-- Account level -->
        <div class="grid min-w-0 grid-cols-[auto_auto] grid-rows-[--spacing(11)_auto] items-center justify-center gap-y-2 leading-tight @4xl:grid-rows-none @4xl:gap-y-0">
          <ProfileHeaderLevelRing :level="profile.trophy_level" :progress="profile.progress" class="col-start-1 row-start-1 me-2.5 @4xl:row-span-2" />
          <div class="col-start-2 row-start-1 text-xl font-bold tabular-nums text-slate-900"><AnimatedNumber :value="profile.trophy_level" :duration="1200" /></div>
          <div class="col-span-2 col-start-1 row-start-2 text-center text-xs break-keep wrap-anywhere text-slate-500 @4xl:col-span-1 @4xl:col-start-2 @4xl:text-left">{{ $t('profile.summary.level') }}</div>
        </div>
        <div class="h-8 w-px shrink-0 bg-slate-200" />
        <!-- Trophy total -->
        <div class="grid min-w-0 grid-cols-[auto_auto] grid-rows-[--spacing(11)_auto] items-center justify-center gap-y-2 leading-tight @4xl:grid-rows-none @4xl:gap-y-0">
          <!-- Decorative; dropped on very narrow cards so the number fits. -->
          <span class="col-start-1 row-start-1 me-2.5 hidden size-11 shrink-0 place-items-center rounded-full bg-white text-slate-900 shadow-sm @2xs:grid @4xl:row-span-2">
            <LucideIcon :icon="Trophy" class="size-5" />
          </span>
          <div class="col-start-2 row-start-1 text-xl font-bold tabular-nums text-slate-900"><AnimatedNumber :value="total" :duration="1200" /></div>
          <div class="col-span-2 col-start-1 row-start-2 text-center text-xs break-keep wrap-anywhere text-slate-400 @4xl:col-span-1 @4xl:col-start-2 @4xl:text-left">{{ $t('profile.stats.trophies') }}</div>
        </div>
      </div>
      <div class="hidden h-8 w-px shrink-0 bg-slate-200 @4xl:block" />
      <!-- Per-tier breakdown -->
      <div class="grid grid-cols-2 gap-x-5 gap-y-2 border-t border-slate-200/70 pt-3 @md:grid-cols-4 @4xl:flex @4xl:items-center @4xl:border-0 @4xl:pt-0">
        <span v-for="t in trophyKinds" :key="t.key" class="inline-flex items-baseline gap-1.5">
          <span class="size-3 shrink-0 translate-y-0.5 rounded-full" :class="t.dot" />
          <span class="text-sm font-bold tabular-nums text-slate-900"><AnimatedNumber :value="profile[t.key]" :duration="1200" reserve-width /></span>
          <span class="text-xs" :class="t.text">{{ $t(t.labelKey) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
