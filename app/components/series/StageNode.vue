<script setup lang="ts">
import type { StageState } from '~/services/series'

/**
 * The timeline marker of a stage. Guests see its number; a player sees how far
 * they got: a filled disc with a check at 100%, a full cyan ring for platinum
 * without 100%, a partial ring for a stage in progress, a faded number when
 * unplayed. Side stages show a dot instead of a number.
 */
const props = defineProps<{
  label: string | number | null
  state: StageState | 'guest'
  best?: number
}>()

const RADIUS = 15
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const shown = ref(false)
onMounted(() => requestAnimationFrame(() => { shown.value = true }))

const arc = computed(() => {
  if (props.state === 'platinum') return 100
  if (props.state === 'started') return Math.max(6, props.best ?? 0)
  return 0
})
const dashOffset = computed(() => CIRCUMFERENCE * (1 - (shown.value ? arc.value : 0) / 100))
const ringColor = computed(() => props.state === 'platinum' ? 'stroke-cyan-400' : 'stroke-slate-800')
const disc = computed(() => ({
  complete: 'fill-cyan-500',
  platinum: 'fill-white',
  started: 'fill-white',
  none: 'fill-slate-50',
  guest: 'fill-white',
})[props.state])
const text = computed(() => ({
  complete: 'text-white',
  platinum: 'text-cyan-700',
  started: 'text-slate-900',
  none: 'text-slate-400',
  guest: 'text-slate-700',
})[props.state])
</script>

<template>
  <span class="relative grid size-9 shrink-0 place-items-center" aria-hidden="true">
    <svg viewBox="0 0 36 36" class="absolute inset-0 size-full -rotate-90">
      <circle cx="18" cy="18" :r="RADIUS" :class="disc" class="stroke-slate-200 transition-colors" stroke-width="2" />
      <circle
        v-if="arc"
        cx="18"
        cy="18"
        :r="RADIUS"
        fill="none"
        :class="ringColor"
        stroke-width="2.5"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashOffset"
        class="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
      />
    </svg>
    <svg v-if="state === 'complete'" viewBox="0 0 24 24" class="relative size-4 text-white" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
    <span v-else-if="label === null" class="relative size-1.5 rounded-full bg-current" :class="text" />
    <span v-else class="relative text-[13px] font-semibold tabular-nums" :class="text">{{ label }}</span>
  </span>
</template>
