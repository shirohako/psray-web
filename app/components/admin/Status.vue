<script setup lang="ts">
import { adminValue } from '~/utils/admin'
const props = defineProps<{ value: unknown }>()
const GOOD = ['success', 'healthy', 'online', 'completed']
const BAD = ['failed', 'offline', 'stale', 'termination']
const WARN = ['partial', 'running', 'queued', 'pending', 'ranking_ban', 'suspected_interrupted']
const tone = computed(() => {
  const value = String(props.value)
  if (GOOD.includes(value)) return 'bg-emerald-500 ring-emerald-500/20'
  if (BAD.includes(value)) return 'bg-red-500 ring-red-500/20'
  if (WARN.includes(value)) return 'bg-amber-500 ring-amber-500/25'
  return 'bg-slate-400 ring-slate-400/20'
})
</script>
<template>
  <span
    class="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-700"
    ><span class="size-1.5 shrink-0 rounded-full ring-[3px]" :class="tone" />{{
      adminValue(value)
    }}</span
  >
</template>
