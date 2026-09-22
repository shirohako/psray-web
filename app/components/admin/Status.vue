<script setup lang="ts">
import { adminValue } from '~/utils/admin'
const props = defineProps<{ value: unknown }>()
const color = computed(() =>
  ['success', 'healthy', 'online', 'completed'].includes(String(props.value))
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : ['failed', 'offline', 'stale', 'termination'].includes(
          String(props.value),
        )
      ? 'bg-red-50 text-red-700 ring-red-200'
      : [
            'partial',
            'running',
            'queued',
            'ranking_ban',
            'suspected_interrupted',
          ].includes(String(props.value))
        ? 'bg-amber-50 text-amber-800 ring-amber-200'
        : 'bg-slate-100 text-slate-600 ring-slate-200',
)
</script>
<template>
  <span
    class="inline-flex whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
    :class="color"
    >{{ adminValue(value) }}</span
  >
</template>
