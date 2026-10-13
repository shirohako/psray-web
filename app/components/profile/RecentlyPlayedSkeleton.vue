<script setup lang="ts">
/**
 * Loading placeholder rows for the recently played tab, on the same density
 * classes as the real rows (see `recentlyPlayedDensity`), so the list lands
 * without shifting. Decorative only.
 */
withDefaults(defineProps<{ rows?: number }>(), { rows: 5 })

const { profileGameDensity } = usePreferences()
const density = computed(() => recentlyPlayedDensity[profileGameDensity.value])

// Vary each row so the list reads like real games rather than a stamp.
const TITLE_WIDTHS = ['58%', '42%', '66%', '50%', '36%', '62%', '46%']
const PROGRESS = [72, 38, 100, 54, 16, 88, 61]

const row = (i: number) => ({
  title: TITLE_WIDTHS[i % TITLE_WIDTHS.length],
  progress: PROGRESS[i % PROGRESS.length]!,
  // Roughly one in three sets is PS5, whose artwork is square.
  square: i % 3 === 1,
  delay: { animationDelay: `${120 + i * 45}ms` },
})
</script>

<template>
  <div class="divide-y divide-slate-100" aria-hidden="true">
    <div
      v-for="i in rows"
      :key="i"
      class="animate-skeleton-in flex items-start"
      :class="density.row"
      :style="row(i - 1).delay"
    >
      <div class="flex shrink-0 flex-col items-center" :class="density.artColumn">
        <div class="flex items-center justify-center" :class="density.art">
          <div class="skeleton rounded-lg" :class="row(i - 1).square ? 'aspect-square h-full' : 'aspect-320/176 w-full'" />
        </div>
        <div class="skeleton skeleton-soft h-4 w-9 rounded sm:hidden" />
      </div>

      <div class="flex min-w-0 flex-1 flex-col" :class="density.content">
        <div class="flex h-6 items-center">
          <div class="skeleton h-4 rounded" :style="{ width: row(i - 1).title }" />
        </div>
        <div class="flex items-center gap-2">
          <div class="skeleton h-4 w-9 rounded max-sm:hidden" />
          <div v-for="kind in trophyKinds" :key="kind.key" class="flex items-center gap-1">
            <span class="size-2 rounded-full opacity-40" :class="kind.dot" />
            <div class="skeleton skeleton-soft h-2.5 w-4 rounded" />
          </div>
        </div>
        <!-- The progress bar keeps its track, with a shimmering fill -->
        <div class="flex items-center" :class="density.progress">
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div class="skeleton h-full rounded-full" :style="{ width: `${row(i - 1).progress}%` }" />
          </div>
          <div class="skeleton skeleton-soft h-3 w-8 rounded" />
        </div>
        <div class="skeleton skeleton-soft h-3 w-32 rounded" />
      </div>

      <span class="shrink-0" :class="density.chevron" />
    </div>
  </div>
</template>
