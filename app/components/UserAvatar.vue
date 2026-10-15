<script setup lang="ts">
/**
 * A user's round avatar, or their initial when they have none. Size it with a
 * class (`size-8`, `size-10` …); text size for the initial comes along too.
 */
defineProps<{ psnid: string; src?: string | null }>()
</script>

<template>
  <img v-if="src" :src="src" :alt="psnid" class="shrink-0 rounded-full bg-slate-100 object-cover" />
  <span v-else class="grid shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
    {{ psnid.slice(0, 1).toUpperCase() }}
  </span>
</template>
