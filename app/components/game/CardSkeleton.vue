<script setup lang="ts">
/**
 * Loading placeholder for one {@link GameCard}, on the same frame (3:4 cover,
 * two text lines, badges) so the grid doesn't move when the games arrive.
 */
const props = defineProps<{ index: number }>()

// Vary the title bars so the grid reads like real names, not a stamp.
const TITLE_WIDTHS = ['82%', '64%', '90%', '58%', '74%', '68%']
const titleWidth = computed(() => TITLE_WIDTHS[props.index % TITLE_WIDTHS.length])
const delay = computed(() => ({ animationDelay: `${120 + (props.index % 12) * 30}ms` }))
</script>

<template>
  <div class="animate-skeleton-in min-w-0" :style="delay" aria-hidden="true">
    <div class="skeleton aspect-3/4 rounded-md" />
    <div class="skeleton mt-2.5 h-3 rounded" :style="{ width: titleWidth }" />
    <div class="mt-2 flex items-center justify-between gap-2">
      <div class="skeleton skeleton-soft h-2.5 w-20 rounded" />
      <div class="skeleton skeleton-soft h-2.5 w-5 rounded" />
    </div>
    <div class="mt-2 flex items-center gap-1">
      <div class="skeleton skeleton-soft h-4 w-8 rounded" />
      <div class="skeleton skeleton-soft h-4 w-8 rounded" />
    </div>
  </div>
</template>
