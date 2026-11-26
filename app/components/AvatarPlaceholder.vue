<script setup lang="ts">
/**
 * Stand-in for an avatar that isn't there, e.g. an account whose PSN avatar
 * hasn't been synced yet. A plain silhouette resting on the bottom edge, so
 * it reads the same at 28 px and at 112 px. Size, shape and border come from
 * the caller's class.
 */
</script>

<template>
  <span class="grid shrink-0 place-items-end overflow-hidden bg-slate-100 text-slate-300">
    <svg viewBox="0 0 64 64" aria-hidden="true" class="size-full" fill="currentColor">
      <circle cx="32" cy="25" r="11" />
      <path d="M10 64c0-14 9.5-22 22-22s22 8 22 22z" />
    </svg>
  </span>
</template>
