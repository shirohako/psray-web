<script setup lang="ts">
/**
 * Trophy-level badge: a ring filling to the progress toward the next level,
 * coloured by the level tier (bronze → silver → gold → platinum, see `levelTier`).
 */
const props = defineProps<{ level: number, progress: number }>()

// Tailwind palette hex: an SVG stroke can't take a utility class.
const STYLES: Record<TrophyKey, { arc: string, track: string, disc: string, text: string, glow?: string }> = {
  bronze: { arc: '#ea580c' /* orange-600 */, track: '#ffedd5' /* orange-100 */, disc: 'from-orange-50 to-white', text: 'text-orange-700' },
  silver: { arc: '#64748b' /* slate-500 */, track: '#e2e8f0' /* slate-200 */, disc: 'from-sky-50 to-white', text: 'text-slate-600' },
  gold: { arc: '#f59e0b' /* amber-500 */, track: '#fef3c7' /* amber-100 */, disc: 'from-amber-50 to-white', text: 'text-amber-600' },
  platinum: {
    arc: '#06b6d4' /* cyan-500 */, track: '#cffafe' /* cyan-100 */, disc: 'from-cyan-50 to-white', text: 'text-cyan-700',
    glow: 'drop-shadow-[0_0_5px_rgb(34_211_238/0.45)]',
  },
}

const style = computed(() => STYLES[levelTier(props.level)])
// The ring fills alongside the numbers counting up.
const ring = useAnimatedNumber(() => props.progress, { duration: 1200 })
</script>

<template>
  <div class="relative grid size-11 shrink-0 place-items-center">
    <span class="absolute inset-1.5 rounded-full bg-linear-to-b shadow-inner shadow-slate-900/5" :class="style.disc" />
    <svg class="absolute size-11 -rotate-90" :class="style.glow" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="none" :stroke="style.track" stroke-width="3" />
      <circle
        cx="18" cy="18" r="16" fill="none" :stroke="style.arc" stroke-width="3"
        stroke-linecap="round"
        :stroke-dasharray="`${(ring / 100) * 100.5} 100.5`"
      />
    </svg>
    <span class="relative text-[11px] font-bold tabular-nums tracking-tight" :class="style.text"><AnimatedNumber :value="progress" :duration="1200" suffix="%" /></span>
  </div>
</template>
