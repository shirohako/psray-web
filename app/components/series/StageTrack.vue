<script setup lang="ts">
import type { StageState } from '~/services/series'

/**
 * A player's progress through a series as one bar per main stage: full cyan
 * for 100%, pale cyan for platinum without 100%, a dark partial fill for a
 * stage in progress, empty for unplayed. The fills grow in once on mount.
 */
const props = withDefaults(defineProps<{
  stages: { state: StageState; best?: number; name?: string }[]
  size?: 'sm' | 'md'
  /** Accessible summary, e.g. "4 of 7 stages cleared". */
  label?: string
}>(), { size: 'md', label: undefined })

const { t } = useI18n()

// Start empty and fill on the next frame so the bars animate in.
const shown = ref(false)
onMounted(() => requestAnimationFrame(() => { shown.value = true }))

const FILL: Record<StageState, string> = {
  complete: 'bg-cyan-500',
  platinum: 'bg-cyan-200',
  started: 'bg-slate-700',
  none: 'bg-transparent',
}

const segments = computed(() => props.stages.map((stage, index) => ({
  key: index,
  fill: FILL[stage.state],
  width: stage.state === 'complete' || stage.state === 'platinum' ? 100 : stage.state === 'started' ? Math.max(8, stage.best ?? 0) : 0,
  // Name and state on separate lines of the tooltip.
  title: [stage.name, t(`series.state.${stage.state}`)].filter(Boolean).join('\n'),
})))
</script>

<template>
  <div role="img" :aria-label="label" class="flex w-full items-center" :class="size === 'sm' ? 'gap-0.5' : 'gap-1'">
    <span
      v-for="(segment, index) in segments"
      :key="segment.key"
      :title="segment.title"
      class="relative min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200/80"
      :class="size === 'sm' ? 'h-1.5' : 'h-2'"
    >
      <span
        class="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
        :class="segment.fill"
        :style="{ width: `${shown ? segment.width : 0}%`, transitionDelay: `${Math.min(index, 20) * 25}ms` }"
      />
    </span>
  </div>
</template>
