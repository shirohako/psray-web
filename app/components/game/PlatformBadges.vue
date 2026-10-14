<script setup lang="ts">
import type { GamePlatform } from '~/services/games'

/**
 * A game's platforms as badges, in the order the API gives (PlayStation
 * first). PlayStation platforms use the site's filled colours; the rest are
 * outlined so they read as secondary. With `max`, the overflow collapses into
 * a "+N" badge whose title lists the hidden platforms.
 */
const props = defineProps<{ platforms: GamePlatform[], max?: number }>()

const shown = computed(() => props.max ? props.platforms.slice(0, props.max) : props.platforms)
const hidden = computed(() => props.platforms.slice(shown.value.length))

function badgeClass(code: string) {
  return isPlayStationPlatform(code)
    ? platformBadgeClass(code)
    : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-300'
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <span
      v-for="platform in shown"
      :key="platform.code"
      :title="platform.name"
      class="inline-flex h-4 shrink-0 items-center rounded px-1.5 text-[10px] font-bold leading-none"
      :class="badgeClass(platform.code)"
    >
      {{ gamePlatformLabel(platform) }}
    </span>
    <span
      v-if="hidden.length"
      :title="hidden.map(platform => platform.name).join(', ')"
      :aria-label="$t('games.morePlatforms', hidden.length)"
      class="inline-flex h-4 shrink-0 items-center rounded px-1 text-[10px] font-semibold leading-none text-slate-500"
    >
      +{{ hidden.length }}
    </span>
  </div>
</template>
