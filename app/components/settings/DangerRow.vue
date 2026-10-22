<script setup lang="ts">
import type { IconNode } from 'lucide'

/**
 * One action in a danger zone: what it does, and the button that starts it.
 * Anything more under the hint (a status line, say) goes in the default slot.
 */
const props = defineProps<{
  icon: IconNode
  tone: 'amber' | 'rose'
  label: string
  hint: string
  actionIcon: IconNode
  actionLabel: string
  disabled?: boolean
}>()

defineEmits<{ action: [] }>()

const TONES = {
  amber: {
    tile: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
    button: 'border-amber-300 text-amber-700 hover:border-amber-400 hover:bg-amber-50',
  },
  rose: {
    tile: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
    button: 'border-rose-300 text-rose-700 hover:border-rose-400 hover:bg-rose-50',
  },
}
const colors = computed(() => TONES[props.tone])
</script>

<template>
  <div class="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
    <span class="flex min-w-0 items-start gap-3">
      <span class="grid size-10 shrink-0 place-items-center rounded-lg" :class="colors.tile">
        <LucideIcon :icon="icon" class="size-5" />
      </span>
      <span class="min-w-0">
        <span class="block text-sm font-semibold text-slate-900">{{ label }}</span>
        <span class="mt-1 block text-sm text-slate-500">{{ hint }}</span>
        <slot />
      </span>
    </span>
    <button
      type="button"
      :disabled="disabled"
      class="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border bg-white px-3 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
      :class="colors.button"
      @click="$emit('action')"
    >
      <LucideIcon :icon="actionIcon" class="size-4" />
      {{ actionLabel }}
    </button>
  </div>
</template>
