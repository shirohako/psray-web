<script setup lang="ts">
/**
 * A few stage icons fanned out from the newest, as a series' visual. Trophy
 * art comes square (PS5) and landscape (older), so each sits in a fixed
 * landscape frame, cropped. Hovering a parent `group` spreads them a little.
 */
const props = withDefaults(defineProps<{ covers: string[]; size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' })

const shown = computed(() => [...props.covers].reverse().slice(0, 3))
const frame = computed(() => ({
  sm: 'h-9 w-16',
  md: 'h-14 w-24',
  lg: 'h-20 w-36',
})[props.size])
const overlap = computed(() => ({ sm: '-ml-10', md: '-ml-16', lg: '-ml-24' })[props.size])
</script>

<template>
  <div class="flex shrink-0 items-center" aria-hidden="true">
    <span v-if="!shown.length" class="rounded-md bg-slate-100 ring-1 ring-slate-200" :class="frame" />
    <span
      v-for="(src, index) in shown"
      :key="src"
      class="relative overflow-hidden rounded-md bg-slate-100 shadow-sm ring-2 ring-white transition-transform duration-300 ease-out motion-reduce:transition-none"
      :class="[frame, index > 0 ? overlap : '', index === 1 ? 'group-hover:translate-x-2' : '', index === 2 ? 'group-hover:translate-x-4' : '']"
      :style="{ zIndex: shown.length - index, transform: index ? `translateY(${index * 3}px) scale(${1 - index * 0.06})` : undefined }"
    >
      <img :src="src" alt="" loading="lazy" class="size-full object-cover" />
    </span>
  </div>
</template>
