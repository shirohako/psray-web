<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number | null | undefined
  duration?: number
  from?: number
  animateInitial?: boolean
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  /**
   * Hold the width of the final value while counting, so text after the number
   * (e.g. "/ 22") doesn't shift as digits are added. Needs `tabular-nums`.
   */
  reserveWidth?: boolean
}>(), {
  duration: 700,
  from: 0,
  animateInitial: true,
  locale: 'en-US',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  reserveWidth: false,
})

const displayValue = useAnimatedNumber(() => props.value, {
  duration: () => props.duration,
  from: props.from,
  animateInitial: props.animateInitial,
})

const formatter = computed(() => new Intl.NumberFormat(props.locale, {
  minimumFractionDigits: props.minimumFractionDigits,
  maximumFractionDigits: props.maximumFractionDigits,
}))

const formatted = computed(() => formatter.value.format(displayValue.value))

const style = computed(() => {
  if (!props.reserveWidth) return undefined
  const final = formatter.value.format(Number(props.value) || 0)
  return { minWidth: `${final.length}ch` }
})
</script>

<template>
  <span :class="{ 'inline-block text-right': reserveWidth }" :style="style">{{ formatted }}</span>
</template>
