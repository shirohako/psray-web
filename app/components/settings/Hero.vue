<script setup lang="ts">
import type { IconNode } from 'lucide'

/**
 * The dark banner atop each settings page. Anything in the default slot sits
 * to the right of the text on wider screens.
 */
defineProps<{
  icon: IconNode
  /** Small all-caps line above the title. */
  eyebrow: string
  title: string
  description: string
}>()

const slots = useSlots()
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-stone-800 bg-stone-900 text-white shadow-sm">
    <div class="p-5" :class="slots.default ? 'grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center' : ''">
      <div class="flex min-w-0 items-start gap-3">
        <span class="grid size-11 shrink-0 place-items-center rounded-lg bg-white/10 text-sky-200 ring-1 ring-white/15">
          <LucideIcon :icon="icon" class="size-5.5" />
        </span>
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wide text-sky-200">{{ eyebrow }}</p>
          <h3 class="mt-1 text-xl font-bold tracking-tight text-white">{{ title }}</h3>
          <p class="mt-1 max-w-xl text-sm leading-relaxed text-stone-300">
            {{ description }}
          </p>
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>
