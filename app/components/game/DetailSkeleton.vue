<script setup lang="ts">
/**
 * Loading placeholder for the game page: the header card, the trophy set list
 * and the two side cards, each on the real component's frame so the page lands
 * without shifting. Decorative only.
 */
const RELEASE_ROWS = ['w-20', 'w-24', 'w-16', 'w-24', 'w-20']
</script>

<template>
  <div class="animate-skeleton-in space-y-6" aria-hidden="true">
    <div class="skeleton skeleton-soft h-3 w-40 rounded" />

    <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
        <div class="skeleton aspect-3/4 w-32 shrink-0 self-center rounded-md sm:w-40 sm:self-start" />
        <div class="min-w-0 flex-1">
          <div class="skeleton h-6 w-3/5 rounded sm:h-7" />
          <div class="skeleton skeleton-soft mt-2.5 h-3.5 w-2/5 rounded" />
          <div class="mt-4 flex items-center gap-4">
            <div class="skeleton skeleton-soft h-3 w-28 rounded" />
            <div class="skeleton skeleton-soft h-3 w-20 rounded" />
          </div>
          <div class="mt-3 flex items-center gap-1">
            <div class="skeleton h-4 w-8 rounded" />
            <div class="skeleton h-4 w-8 rounded" />
            <div class="skeleton skeleton-soft h-4 w-10 rounded" />
          </div>
          <div class="mt-5 space-y-2">
            <div class="skeleton skeleton-soft h-3 w-full rounded" />
            <div class="skeleton skeleton-soft h-3 w-11/12 rounded" />
            <div class="skeleton skeleton-soft h-3 w-4/5 rounded" />
          </div>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center gap-2 border-b border-slate-200 px-4 py-3.5 sm:px-5">
        <div class="skeleton h-4 w-20 rounded" />
        <div class="skeleton skeleton-soft h-3 w-6 rounded" />
      </div>
      <div class="divide-y divide-slate-100">
        <TrophyLibraryEntrySkeleton v-for="index in 2" :key="index" :index="index - 1" view="list" :show-reference-times="true" />
      </div>
    </section>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section class="rounded-lg border border-slate-200 bg-white shadow-sm lg:col-span-2">
        <div class="border-b border-slate-100 px-4 py-3"><div class="skeleton h-3.5 w-20 rounded" /></div>
        <div class="divide-y divide-slate-100">
          <div v-for="(width, index) in RELEASE_ROWS" :key="index" class="flex items-center justify-between gap-4 px-4 py-2.5">
            <div class="skeleton h-4 w-9 rounded" />
            <div class="skeleton skeleton-soft h-3 w-14 rounded" />
            <div class="skeleton skeleton-soft h-3 rounded" :class="width" />
          </div>
        </div>
      </section>
      <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-4 py-3"><div class="skeleton h-3.5 w-14 rounded" /></div>
        <div class="space-y-4 p-4">
          <div v-for="index in 3" :key="index">
            <div class="skeleton skeleton-soft h-2.5 w-16 rounded" />
            <div class="skeleton mt-1.5 h-3.5 w-36 rounded" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
