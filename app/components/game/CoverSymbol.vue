<script setup lang="ts">
import type { CoverShape } from '~/utils/game'

/**
 * One face-button symbol inside a drawn cover's `<svg>`, filled or outlined.
 * The cross has no area to fill, so a filled cross is drawn as a thick stroke
 * (`r × 0.38`) in the fill paint.
 */
const props = withDefaults(defineProps<{
  shape: CoverShape
  x: number
  y: number
  r: number
  fill?: string
  stroke?: string
  strokeWidth?: number
}>(), { fill: undefined, stroke: undefined, strokeWidth: 3 })

const d = computed(() => coverShapePath(props.shape, props.x, props.y, props.r))
const filledCross = computed(() => props.shape === 'cross' && Boolean(props.fill))
</script>

<template>
  <path
    v-if="filledCross"
    :d="d"
    fill="none"
    :stroke="fill"
    :stroke-width="r * 0.38"
    stroke-linecap="round"
  />
  <path
    v-else
    :d="d"
    :fill="fill ?? 'none'"
    :stroke="stroke ?? 'none'"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</template>
