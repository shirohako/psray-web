<script setup lang="ts">
/**
 * A timestamp in the reader's own time zone and language (「—」when there's
 * none). Formatting it as plain text during SSR uses the server's time zone,
 * which then differs from the browser's on hydration; NuxtTime rewrites the
 * server HTML in the browser before hydrating, so both sides agree.
 *
 * ```vue
 * <LocalTime :value="tip.created_at" />              2026/10/16 14:30  (as fmtDateTime)
 * <LocalTime :value="joinedAt" format="date" />      2026年10月16日     (as fmtDate)
 * <LocalTime :value="at" format="day" />             2026/10/16
 * <LocalTime :value="at" format="time" />            14:30
 * ```
 */
const props = withDefaults(defineProps<{
  /** ISO string, or Unix seconds when numeric — like `fmtDateTime`. */
  value: string | number | null | undefined
  format?: keyof typeof FORMATS
}>(), { format: 'datetime' })

const FORMATS = {
  datetime: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false },
  date: { year: 'numeric', month: 'long', day: 'numeric' },
  day: { year: 'numeric', month: '2-digit', day: '2-digit' },
  time: { hour: '2-digit', minute: '2-digit', hour12: false },
} as const

const iso = computed(() => toIsoDate(props.value))
const locale = computed(() => currentLocale())
</script>

<template>
  <span v-if="!iso">—</span>
  <NuxtTime v-else :datetime="iso" :locale="locale" v-bind="FORMATS[format]" />
</template>
