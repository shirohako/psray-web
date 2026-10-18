<script setup lang="ts">
/**
 * Top-of-page loading bar, in place of `<NuxtLoadingIndicator>`'s stock
 * styling. It drives the same shared `useLoadingIndicator()` state, so the
 * page:loading hooks and `useLoadingBar` keep working unchanged.
 *
 * The fill grows in width (rather than being scaled like Nuxt's), so the
 * whole gradient spans what has loaded and the glow at its leading edge keeps
 * its shape. Mount it before the layout so its hooks register ahead of any
 * page's.
 */
const { progress, isLoading, error } = useLoadingIndicator()

// Snapping back to 0 for the next run shouldn't sweep backwards.
const fillStyle = computed(() => ({
  width: `${progress.value}%`,
  transition: progress.value > 0 ? 'width 200ms ease-out' : 'none',
}))
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-0 z-[999999] h-[3px] transition-opacity duration-400"
    :class="isLoading ? 'opacity-100' : 'opacity-0'"
    aria-hidden="true"
  >
    <div
      class="loading-bar-fill absolute inset-y-0 left-0"
      :class="{ 'is-error': error }"
      :style="fillStyle"
    />
  </div>
</template>
