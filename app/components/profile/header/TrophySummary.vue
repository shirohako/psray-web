<script setup lang="ts">
import { EyeOff, Trophy } from 'lucide'
import type { Profile } from '~/services/profile'

/**
 * Account level (tier-coloured progress ring) + trophy total + per-tier breakdown. One
 * row when the card is wide enough; otherwise level/total on top and the tiers
 * in a grid below, so nothing wraps on its own (a lone divider, a lone tier).
 */
const props = defineProps<{ profile: Profile }>()

const total = computed(() => sumTrophies(props.profile))
// Trophies in games hidden on PSN: a fifth item after the tiers, per tier on hover/focus.
const hiddenTotal = computed(() => hiddenTrophyTotal(props.profile))
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
      <template v-if="hiddenTotal > 0">
        <div class="hidden h-8 w-px shrink-0 bg-slate-200 @4xl:block" />
        <Tooltip placement="bottom" class="self-start @4xl:self-auto">
          <button
            type="button"
            class="inline-flex items-baseline gap-1.5 rounded-sm text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            :aria-label="$t('profile.summary.hiddenTitle', { count: hiddenTotal })"
          >
            <LucideIcon :icon="EyeOff" class="size-3.5 shrink-0 translate-y-0.5 text-slate-400" />
            <span class="text-sm font-bold tabular-nums">{{ hiddenTotal.toLocaleString() }}</span>
            <span class="text-xs text-slate-400">{{ $t('profile.summary.hidden') }}</span>
          </button>
          <template #content>
            <div class="w-56 p-1">
              <div class="flex items-center gap-1.5 text-sm font-semibold text-white">
                <LucideIcon :icon="EyeOff" class="size-3.5 text-slate-400" />
                {{ $t('profile.summary.hiddenTitle', { count: hiddenTotal }) }}
              </div>
              <dl class="mt-2 space-y-1">
                <div v-for="t in trophyKinds" :key="t.key" class="flex items-center justify-between gap-3 text-xs">
                  <dt class="inline-flex items-center gap-1.5 text-slate-300">
                    <span class="size-2.5 rounded-full" :class="t.dot" />{{ $t(t.labelKey) }}
                  </dt>
                  <dd class="font-semibold tabular-nums text-white">{{ profile.hidden_trophies?.[t.key] ?? 0 }}</dd>
                </div>
              </dl>
              <p class="mt-2 text-[11px] leading-snug text-slate-400">{{ $t('profile.summary.hiddenNote') }}</p>
            </div>
          </template>
        </Tooltip>
      </template>
    </div>
  </div>
</template>
