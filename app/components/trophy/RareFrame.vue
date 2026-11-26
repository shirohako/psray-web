<script setup lang="ts">
/**
 * Animated purple frame over the icon of a trophy that fewer than 5% of PSN
 * players have earned (see `isRareTrophy`).
 *
 * Put it inside the icon's `relative` wrapper, after the <img> and before any
 * badges, so the badges stay on top. The asset's glowing line sits 1/12 in
 * from its edge, so overhanging the icon by 10% on each side lays the line
 * along the icon's border. Visitors who prefer reduced motion get a still frame.
 */
</script>

<template>
  <picture class="pointer-events-none absolute -inset-[10%] select-none" aria-hidden="true">
    <source media="(prefers-reduced-motion: reduce)" srcset="/animations/rare-trophy-frame-still.webp" />
    <img src="/animations/rare-trophy-frame.webp" alt="" class="size-full" decoding="async" draggable="false" />
  </picture>
</template>
