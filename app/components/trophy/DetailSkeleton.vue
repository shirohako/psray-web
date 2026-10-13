<script setup lang="ts">
/**
 * Loading placeholder for a trophy set page: the dark banner, the trophy list
 * card (rows on the same density classes as `trophy/Item.vue`) and the side
 * cards, each on the real component's frame so the page lands without
 * shifting. Decorative only.
 */
const { trophyDensity } = usePreferences()
const density = computed(() => trophyItemDensity[trophyDensity.value])

// Vary each row so the list reads like real trophies rather than a stamp.
const ROWS = [
  { name: '38%', detail: ['76%'] },
  { name: '30%', detail: ['58%'] },
  { name: '46%', detail: ['64%'] },
  { name: '26%', detail: ['48%'] },
  { name: '42%', detail: ['90%', '40%'] },
  { name: '34%', detail: ['54%'] },
  { name: '50%', detail: ['70%'] },
]
const PLAYER_WIDTHS = ['w-24', 'w-20', 'w-28', 'w-16', 'w-24']
</script>

<template>
  <div class="animate-skeleton-in space-y-6" aria-hidden="true">
    <!-- Banner: dark like the real one, so the swap doesn't flash -->
    <section class="overflow-hidden rounded-lg border border-slate-200 bg-slate-800 shadow-sm">
      <div class="flex flex-col items-center gap-5 p-5 sm:flex-row sm:p-6">
        <div class="skeleton skeleton-dark size-24 shrink-0 rounded-lg sm:size-28 sm:rounded-xl" />
        <div class="flex w-full min-w-0 flex-1 flex-col items-center sm:items-start">
          <div class="flex items-center gap-2">
            <div class="skeleton skeleton-dark h-5 w-48 rounded sm:h-7 sm:w-72" />
            <div class="skeleton skeleton-dark h-4 w-9 rounded" />
          </div>
          <div class="mt-3 flex items-center gap-4">
            <div v-for="kind in trophyKinds" :key="kind.key" class="flex items-center gap-1.5">
              <span class="size-2.5 rounded-full opacity-60" :class="kind.dot" />
              <div class="skeleton skeleton-dark h-3.5 w-6 rounded" />
            </div>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <div class="skeleton skeleton-dark h-7 w-24 rounded-lg" />
            <div class="skeleton skeleton-dark h-7 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Trophy list -->
      <div class="lg:col-span-2">
        <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5">
            <div class="flex items-center gap-2">
              <div class="skeleton h-4 w-24 rounded" />
              <div class="skeleton skeleton-soft h-3 w-10 rounded" />
            </div>
            <div class="skeleton skeleton-soft h-7 w-28 rounded-lg" />
          </div>

          <div class="flex flex-col gap-2.5 border-b border-slate-200 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
            <div class="grid grid-cols-3 gap-0.5 rounded-lg bg-slate-100 p-0.5 sm:inline-flex">
              <div class="h-7 rounded-md bg-white shadow-sm sm:w-16" />
              <div class="h-7 sm:w-16" />
              <div class="h-7 sm:w-16" />
            </div>
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <div class="skeleton skeleton-soft h-3 w-20 rounded" />
                <div class="h-5 w-9 rounded-full bg-slate-200" />
              </div>
              <div class="h-8 w-32 rounded-lg border border-slate-200" />
            </div>
          </div>

          <!-- First group header, then its rows -->
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5">
            <div class="skeleton h-3.5 w-32 rounded" />
            <div class="flex items-center gap-3">
              <div v-for="kind in trophyKinds" :key="kind.key" class="flex items-center gap-1">
                <span class="size-2 rounded-full opacity-40" :class="kind.dot" />
                <div class="skeleton skeleton-soft h-3 w-4 rounded" />
              </div>
            </div>
          </div>
          <div class="divide-y divide-slate-200">
            <div
              v-for="(row, i) in ROWS"
              :key="i"
              class="animate-skeleton-in flex items-center"
              :class="density.row"
              :style="{ animationDelay: `${120 + i * 45}ms` }"
            >
              <div class="flex shrink-0 items-center gap-2 sm:gap-3">
                <div class="flex justify-end" :class="density.number">
                  <div class="skeleton skeleton-soft h-3 w-full rounded" />
                </div>
                <div class="relative">
                  <div class="skeleton rounded-lg" :class="density.icon" />
                  <span class="absolute grid place-items-center rounded-full border-white bg-white shadow-sm" :class="density.tierBadge">
                    <span class="skeleton skeleton-soft size-1/2 rounded-full" />
                  </span>
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex h-6 items-center"><div class="skeleton h-4 rounded" :style="{ width: row.name }" /></div>
                <div v-for="(width, d) in row.detail" :key="d" class="flex h-5 items-center"><div class="skeleton skeleton-soft h-3 w-full rounded" :style="{ width }" /></div>
              </div>
              <div class="flex shrink-0 items-center" :class="density.actions">
                <div class="flex flex-col items-end gap-1.5">
                  <div class="skeleton skeleton-soft h-2.5 w-7 rounded max-sm:hidden" />
                  <div class="skeleton h-3.5 w-10 rounded" />
                </div>
                <div class="rounded-full border border-slate-200 bg-white" :class="density.commentButton" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="space-y-6">
        <!-- Statistics -->
        <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-4 py-3">
            <div class="skeleton h-3.5 w-20 rounded" />
          </div>
          <div class="grid grid-cols-2 border-b border-slate-100">
            <div
              v-for="i in 4"
              :key="i"
              class="flex items-center gap-2.5 px-4 py-3.5 odd:border-r odd:border-slate-100 nth-[n+3]:border-t nth-[n+3]:border-slate-100"
            >
              <div class="skeleton skeleton-soft size-8 shrink-0 rounded-full" />
              <div class="space-y-1.5">
                <div class="skeleton h-4 w-12 rounded" />
                <div class="skeleton skeleton-soft h-2.5 w-14 rounded" />
              </div>
            </div>
          </div>
          <div class="space-y-3 p-4">
            <div class="space-y-1.5">
              <div class="skeleton h-3 w-24 rounded" />
              <div class="skeleton skeleton-soft h-2.5 w-40 rounded" />
            </div>
            <div class="space-y-2 rounded-lg bg-slate-50 px-3.5 py-3">
              <div class="skeleton skeleton-soft h-2.5 w-28 rounded" />
              <div class="skeleton h-3.5 w-20 rounded" />
            </div>
            <div class="divide-y divide-slate-100">
              <div v-for="i in 3" :key="i" class="flex items-center gap-2 py-2.5">
                <div class="skeleton skeleton-soft size-4 rounded-full" />
                <div class="skeleton skeleton-soft h-3 w-24 rounded" />
                <div class="skeleton ml-auto h-3 w-14 rounded" />
              </div>
            </div>
            <div class="h-16 rounded-lg bg-slate-50 ring-1 ring-inset ring-slate-100" />
          </div>
        </section>

        <!-- Recent players -->
        <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-4 py-3">
            <div class="skeleton h-3.5 w-24 rounded" />
          </div>
          <div class="divide-y divide-slate-100">
            <div v-for="(width, i) in PLAYER_WIDTHS" :key="i" class="flex items-center gap-2.5 px-4 py-2.5">
              <div class="skeleton size-8 shrink-0 rounded-full" />
              <div class="min-w-0 flex-1 space-y-2">
                <div class="skeleton h-3.5 rounded" :class="width" />
                <div class="skeleton skeleton-soft h-2.5 w-24 rounded" />
              </div>
              <div class="h-1 w-10 rounded-full bg-slate-100" />
              <div class="skeleton skeleton-soft h-3 w-8 rounded" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
