<script setup lang="ts">
import { LockKeyhole, Medal, Trophy } from 'lucide'

/**
 * The trophy summary row of a private profile. The API zeroes every trophy
 * stat, so rather than show zeros this keeps the row's shape with the figures
 * redacted (blurred stand-ins, not real data).
 */

// Decorative stand-ins under the blur; screen readers get the note instead.
const REDACTED = { level: '528', total: '11,181', rank: '#1,024' }
</script>

<template>
  <div class="relative overflow-hidden rounded-lg border border-slate-200/80 bg-linear-to-r from-slate-50 to-white">
    <!-- Faint diagonal hatching marks the row as withheld -->
    <div class="hatch pointer-events-none absolute inset-0" aria-hidden="true" />

    <div class="relative flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
      <span class="sr-only">{{ $t('profile.private.headerNote') }}</span>
      <div class="flex flex-wrap items-center gap-x-6 gap-y-3" aria-hidden="true">
        <!-- Level: the ring as an empty track, a lock where the trophy sits -->
        <div class="flex items-center gap-2.5">
          <div class="grid size-9 shrink-0 place-items-center rounded-full border-3 border-slate-200 text-slate-400">
            <LucideIcon :icon="LockKeyhole" class="size-3.5" />
          </div>
          <div class="leading-tight">
            <div class="redacted text-xl font-bold text-slate-900">{{ REDACTED.level }}</div>
            <div class="text-xs text-slate-400">{{ $t('leaderboard.column.level') }}</div>
          </div>
        </div>
        <div class="h-8 w-px bg-slate-200" />
        <div class="flex items-center gap-2.5">
          <span class="grid size-9 shrink-0 place-items-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/70">
            <LucideIcon :icon="Trophy" class="size-4.5" />
          </span>
          <div class="leading-tight">
            <div class="redacted text-xl font-bold text-slate-900">{{ REDACTED.total }}</div>
            <div class="text-xs text-slate-400">{{ $t('profile.stats.trophies') }}</div>
          </div>
        </div>
        <div class="h-8 w-px bg-slate-200 max-sm:hidden" />
        <div class="flex items-center gap-2.5 max-sm:hidden">
          <span class="grid size-9 shrink-0 place-items-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200/70">
            <LucideIcon :icon="Medal" class="size-4.5" />
          </span>
          <div class="leading-tight">
            <div class="redacted text-xl font-bold text-slate-900">{{ REDACTED.rank }}</div>
            <div class="text-xs text-slate-400">{{ $t('profile.stats.globalRank') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.redacted {
  filter: blur(6px);
  user-select: none;
  opacity: 0.55;
}
.hatch {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent 0 10px,
    rgb(148 163 184 / 0.07) 10px 11px
  );
}
</style>
