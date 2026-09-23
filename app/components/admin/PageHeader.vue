<script setup lang="ts">
import type { IconNode } from 'lucide'
defineProps<{ title: string; description?: string; icon?: IconNode }>()
</script>
<template>
  <header class="flex flex-wrap items-center gap-x-4 gap-y-3">
    <span
      v-if="icon"
      class="hidden size-10 shrink-0 sm:grid place-items-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-900/20"
    >
      <LucideIcon :icon="icon" class="size-5" />
    </span>
    <div class="min-w-0 flex-1">
      <h1 class="text-lg font-semibold tracking-tight text-slate-950">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-0.5 text-[13px] text-slate-500">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.default" class="flex flex-wrap items-center gap-2">
      <slot />
    </div>
  </header>
</template>
