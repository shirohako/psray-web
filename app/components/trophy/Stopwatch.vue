<script setup lang="ts">
/**
 * A duration as a stopwatch reading, e.g. `1日 05:10:10`. The digits carry the
 * weight; separators and the day unit step back.「—」when unknown.
 */
const props = defineProps<{ seconds: number | null | undefined }>()

const parts = computed(() => props.seconds == null ? null : stopwatch(props.seconds))
const groups = computed(() => parts.value?.time.split(':') ?? [])
</script>

<template>
  <span v-if="!parts" class="text-slate-300">—</span>
  <span v-else class="inline-flex items-baseline whitespace-nowrap tabular-nums">
    <template v-if="parts.days">
      <span class="font-semibold text-slate-800">{{ parts.days }}</span>
      <span class="ml-0.5 mr-1.5 text-[0.8em] font-medium text-slate-400">{{ $t('trophy.players.dayUnit') }}</span>
    </template>
    <template v-for="(group, i) in groups" :key="i">
      <span v-if="i" class="mx-px text-slate-300">:</span>
      <span class="font-semibold text-slate-800">{{ group }}</span>
    </template>
  </span>
</template>
