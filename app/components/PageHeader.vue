<script setup lang="ts">
import type { IconNode } from 'lucide'

/**
 * A page's title row: icon tile, heading and a short description. The default
 * slot (a primary action, a few stats) sits on the right, and drops below the
 * title on phones.
 */
defineProps<{
  icon: IconNode
  title: string
  description?: string
}>()
</script>

<template>
  <header class="flex flex-col gap-4 pb-1 pt-1 sm:flex-row sm:items-start sm:justify-between">
    <div class="flex items-start gap-3">
      <span class="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
        <LucideIcon :icon="icon" class="size-5" stroke-width="1.5" />
      </span>
      <div>
        <h1 class="text-xl font-bold tracking-tight text-slate-900">{{ title }}</h1>
        <p v-if="description" class="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500">{{ description }}</p>
      </div>
    </div>
    <slot />
  </header>
</template>
