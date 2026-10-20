<script setup lang="ts">
import { Trophy } from 'lucide'
import type { Profile } from '~/services/profile'

/**
 * Account level (with progress ring) + trophy total + per-tier breakdown. One
 * row when the card is wide enough; otherwise level/total on top and the tiers
 * in a grid below, so nothing wraps on its own (a lone divider, a lone tier).
 */
const props = defineProps<{ profile: Profile }>()

const total = computed(() => sumTrophies(props.profile))
// The level ring fills alongside the numbers counting up.
const ring = useAnimatedNumber(() => props.profile.progress, { duration: 1200 })
</script>

<template>
  <div class="@container rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3">
    <div class="flex flex-col gap-3 @4xl:flex-row @4xl:items-center @4xl:gap-6">
      <div class="flex items-center gap-3 @2xs:gap-4 @sm:gap-6">
        <!-- Account level (with progress ring) -->
        <div class="flex min-w-0 items-center gap-2.5">
          <div class="relative grid size-9 shrink-0 place-items-center">
            <svg class="size-9 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" stroke-width="3" />
              <circle
                cx="18" cy="18" r="16" fill="none" stroke="#0f172a" stroke-width="3"
                stroke-linecap="round"
                :stroke-dasharray="`${(ring / 100) * 100.5} 100.5`"
              />
            </svg>
            <LucideIcon :icon="Trophy" class="absolute size-4 text-slate-900" />
          </div>
          <div class="leading-tight">
            <div class="text-xl font-bold tabular-nums text-slate-900"><AnimatedNumber :value="profile.trophy_level" :duration="1200" /></div>
            <div class="text-xs text-slate-500">{{ $t('profile.summary.level', { progress: profile.progress }) }}</div>
          </div>
        </div>
        <div class="h-8 w-px shrink-0 bg-slate-200" />
        <!-- Trophy total -->
        <div class="flex min-w-0 items-center gap-2.5">
          <!-- Decorative; dropped on very narrow cards so the number fits. -->
          <span class="hidden size-9 shrink-0 place-items-center rounded-full bg-white text-slate-900 shadow-sm @2xs:grid">
            <LucideIcon :icon="Trophy" class="size-4.5" />
          </span>
          <div class="leading-tight">
            <div class="text-xl font-bold tabular-nums text-slate-900"><AnimatedNumber :value="total" :duration="1200" /></div>
            <div class="text-xs text-slate-400">{{ $t('profile.stats.trophies') }}</div>
          </div>
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
