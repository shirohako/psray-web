<script setup lang="ts">
import { CircleHelp, Medal, MapPin, Sparkles } from 'lucide'
import type { Profile } from '~/services/profile'
import { leaderboardBoardPath } from '~/utils/leaderboardQuery'
import { REGIONS } from '~/utils/regions'

/**
 * Compact inline row: global rank · region rank · trophy points. Each rank
 * opens its leaderboard at the page this player is on now, their row marked.
 */
const props = defineProps<{ profile: Profile }>()

// The region board only knows the regions in its picker.
const regionBoard = computed(() => REGIONS.some(region => region.code === props.profile.country))
const RANK_LINK = 'rounded font-bold tabular-nums text-slate-900 underline-offset-4 transition hover:text-violet-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600'
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
    <span class="inline-flex items-center gap-1.5">
      <LucideIcon :icon="Medal" class="size-4 text-amber-500" />
      <span v-if="profile.rank == null" class="font-bold tabular-nums text-slate-900">{{ rankText(null) }}</span>
      <AppLink
        v-else
        :to="leaderboardBoardPath()"
        :state="navState('leaderboardPlayer', profile.psnid)"
        :class="RANK_LINK"
        :title="$t('profile.stats.viewOnLeaderboard')"
      >
        <AnimatedNumber :value="profile.rank" prefix="#" :duration="1200" reserve-width />
      </AppLink>
      <span class="text-xs text-slate-400">{{ $t('profile.stats.globalRank') }}</span>
      <Tooltip :content="$t('profile.stats.rankUpdateHint')" placement="bottom">
        <button
          type="button"
          class="inline-flex size-5 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          :aria-label="$t('profile.stats.rankUpdateHint')"
          @click="($event.currentTarget as HTMLButtonElement).focus()"
        >
          <LucideIcon :icon="CircleHelp" class="size-3.5" />
        </button>
      </Tooltip>
    </span>
    <div class="h-4 w-px bg-slate-200" />
    <span class="inline-flex items-center gap-1.5">
      <LucideIcon :icon="MapPin" class="size-4 text-sky-500" />
      <span v-if="profile.server_rank == null" class="font-bold tabular-nums text-slate-900">{{ rankText(null) }}</span>
      <AppLink
        v-else-if="regionBoard"
        :to="leaderboardBoardPath(profile.country)"
        :state="navState('leaderboardPlayer', profile.psnid)"
        :class="RANK_LINK"
        :title="$t('profile.stats.viewOnLeaderboard')"
      >
        <AnimatedNumber :value="profile.server_rank" prefix="#" :duration="1200" reserve-width />
      </AppLink>
      <span v-else class="font-bold tabular-nums text-slate-900">
        <AnimatedNumber :value="profile.server_rank" prefix="#" :duration="1200" reserve-width />
      </span>
      <span class="text-xs text-slate-400">{{ $t('profile.stats.regionRank') }}</span>
    </span>
    <div class="h-4 w-px bg-slate-200" />
    <span class="inline-flex items-center gap-1.5">
      <LucideIcon :icon="Sparkles" class="size-4 text-slate-700" />
      <span class="font-bold tabular-nums text-slate-900"><AnimatedNumber :value="profile.points" :duration="1200" reserve-width /></span>
      <span class="text-xs text-slate-400">{{ $t('profile.stats.points') }}</span>
    </span>
  </div>
</template>
