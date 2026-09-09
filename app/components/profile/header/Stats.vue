<script setup lang="ts">
import { CircleHelp, Medal, MapPin, Sparkles } from 'lucide'
import type { Profile } from '~/services/profile'

/** Compact inline row: global rank · region rank · trophy points. */
defineProps<{ profile: Profile }>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
    <span class="inline-flex items-center gap-1.5">
      <LucideIcon :icon="Medal" class="size-4 text-amber-500" />
      <span class="font-bold text-slate-900">{{ rankText(profile.rank) }}</span>
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
      <span class="font-bold text-slate-900">{{ rankText(profile.server_rank) }}</span>
      <span class="text-xs text-slate-400">{{ $t('profile.stats.regionRank') }}</span>
    </span>
    <div class="h-4 w-px bg-slate-200" />
    <span class="inline-flex items-center gap-1.5">
      <LucideIcon :icon="Sparkles" class="size-4 text-slate-700" />
      <span class="font-bold text-slate-900">{{ fmt(profile.points) }}</span>
      <span class="text-xs text-slate-400">{{ $t('profile.stats.points') }}</span>
    </span>
  </div>
</template>
