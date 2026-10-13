<script setup lang="ts">
/**
 * Loading placeholder for a whole profile page: header card, trophy calendar,
 * the tabbed main card and the side cards, each on the real component's frame
 * so the page lands without shifting. Decorative only.
 */

// Calendar: a year of weeks, with a faint scatter of activity so it reads as a
// heatmap rather than a blank grid. Fixed, so server and client agree.
const WEEKS = 53
const ACTIVITY = new Set([9, 23, 30, 47, 61, 88, 102, 117, 150, 163, 171, 198, 214, 236, 249, 260, 288, 301, 315, 330, 344, 352, 360, 366])

// Account card rows, split into its three groups.
const ACCOUNT_GROUPS = [['w-20', 'w-24', 'w-28'], ['w-28', 'w-28'], ['w-12', 'w-28', 'w-24']]
</script>

<template>
  <div class="animate-skeleton-in space-y-6" aria-hidden="true">
    <!-- Header: banner, overlapping avatar, identity, stats, trophy summary -->
    <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="skeleton h-48 rounded-none sm:h-64" />
      <div class="px-4 pb-5 sm:px-6">
        <div class="relative z-10 -mt-18 size-24 rounded-xl border-4 border-white bg-white shadow-md sm:-mt-22 sm:size-28">
          <div class="skeleton size-full rounded-lg" />
        </div>
        <div class="mt-3">
          <div class="skeleton h-5 w-40 rounded" />
          <div class="skeleton skeleton-soft mt-2.5 h-3 w-64 max-w-full rounded" />
          <div class="mt-2.5 flex items-center gap-4">
            <div class="skeleton skeleton-soft h-3 w-20 rounded" />
            <div class="skeleton skeleton-soft h-3 w-36 rounded" />
          </div>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <template v-for="(width, i) in ['w-28', 'w-24', 'w-28']" :key="i">
            <div v-if="i" class="h-4 w-px bg-slate-200" />
            <div class="flex items-center gap-1.5">
              <div class="skeleton skeleton-soft size-4 rounded-full" />
              <div class="skeleton h-3.5 rounded" :class="width" />
            </div>
          </template>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3">
          <div class="flex items-center gap-2.5">
            <!-- Level ring, drawn as a track -->
            <div class="grid size-9 place-items-center rounded-full border-3 border-slate-200" />
            <div class="flex h-11 flex-col justify-center gap-2">
              <div class="skeleton h-4 w-10 rounded" />
              <div class="skeleton skeleton-soft h-2.5 w-16 rounded" />
            </div>
          </div>
          <div class="h-8 w-px bg-slate-200" />
          <div class="flex items-center gap-2.5">
            <div class="size-9 rounded-full bg-white shadow-sm" />
            <div class="flex h-11 flex-col justify-center gap-2">
              <div class="skeleton h-4 w-14 rounded" />
              <div class="skeleton skeleton-soft h-2.5 w-10 rounded" />
            </div>
          </div>
          <div class="h-8 w-px bg-slate-200" />
          <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div v-for="kind in trophyKinds" :key="kind.key" class="flex items-center gap-1.5">
              <span class="size-3 rounded-full opacity-40" :class="kind.dot" />
              <div class="skeleton h-3.5 w-8 rounded" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Trophy calendar -->
    <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div class="flex items-center gap-2">
          <div class="skeleton size-8 rounded-lg" />
          <div class="space-y-1.5">
            <div class="skeleton h-3.5 w-24 rounded" />
            <div class="skeleton skeleton-soft h-2.5 w-40 rounded" />
          </div>
        </div>
        <div class="flex items-center gap-5">
          <div v-for="i in 3" :key="i" class="flex h-10 flex-col items-end justify-center gap-2" :class="{ 'max-sm:hidden': i === 3 }">
            <div class="skeleton h-4 w-10 rounded" />
            <div class="skeleton skeleton-soft h-2.5 w-14 rounded" />
          </div>
        </div>
      </div>
      <div class="overflow-hidden px-4 py-3 sm:px-5">
        <div class="ml-8 h-4" />
        <div class="ml-8 flex gap-0.75">
          <div v-for="week in WEEKS" :key="week" class="flex flex-col gap-0.75">
            <span
              v-for="day in 7"
              :key="day"
              class="size-2.75 rounded-[3px]"
              :class="ACTIVITY.has((week - 1) * 7 + day) ? 'bg-slate-200' : 'bg-slate-100'"
            />
          </div>
        </div>
      </div>
      <div class="flex justify-end border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 sm:px-5">
        <div class="skeleton skeleton-soft h-3 w-32 rounded" />
      </div>
    </section>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Tabbed main card, on its first tab -->
      <div class="rounded-lg border border-slate-200 bg-white shadow-sm lg:col-span-2">
        <div class="border-b border-slate-200 px-3 py-2.5 sm:hidden">
          <div class="skeleton skeleton-soft h-10 rounded-lg" />
        </div>
        <div class="hidden gap-1 border-b border-slate-200 px-5 py-2.5 sm:flex">
          <div class="h-8 w-28 rounded-md bg-slate-900/85" />
          <div class="skeleton skeleton-soft h-8 w-24 rounded-md" />
          <div class="skeleton skeleton-soft h-8 w-24 rounded-md" />
        </div>
        <div class="border-b border-slate-100 px-4 py-3 sm:px-5">
          <div class="h-9 rounded-md border border-slate-200 bg-slate-50/60" />
        </div>
        <ProfileRecentlyPlayedSkeleton />
      </div>

      <aside class="space-y-6">
        <!-- Stats -->
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div class="skeleton mb-5 h-3.5 w-20 rounded" />
          <div class="grid grid-cols-2 gap-y-5">
            <div v-for="i in 4" :key="i" class="space-y-2">
              <div class="skeleton skeleton-soft h-2.5 w-16 rounded" />
              <div class="skeleton h-5 w-12 rounded" />
            </div>
          </div>
          <div class="mt-4 divide-y divide-slate-100 border-t border-slate-100">
            <div v-for="i in 2" :key="i" class="flex items-center justify-between px-1 py-2.5">
              <div class="flex items-center gap-2.5">
                <div class="skeleton skeleton-soft size-7 rounded-md" />
                <div class="skeleton skeleton-soft h-3 w-20 rounded" />
              </div>
              <div class="skeleton h-4 w-10 rounded" />
            </div>
          </div>
        </div>

        <!-- Social -->
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div class="skeleton mb-5 h-3.5 w-16 rounded" />
          <div class="grid grid-cols-2 gap-3">
            <div v-for="i in 2" :key="i" class="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-3">
              <div class="skeleton skeleton-soft size-4 rounded-full" />
              <div class="skeleton h-4 w-8 rounded" />
              <div class="skeleton skeleton-soft h-2.5 w-10 rounded" />
            </div>
          </div>
        </div>

        <!-- Account -->
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div class="skeleton mb-5 h-3.5 w-24 rounded" />
          <div class="divide-y divide-slate-100">
            <div v-for="(group, g) in ACCOUNT_GROUPS" :key="g" class="space-y-3.5 py-3 first:pt-0 last:pb-0">
              <div v-for="(width, i) in group" :key="i" class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <div class="skeleton skeleton-soft size-4 rounded" />
                  <div class="skeleton skeleton-soft h-3 w-16 rounded" />
                </div>
                <div class="skeleton h-3 rounded" :class="width" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
