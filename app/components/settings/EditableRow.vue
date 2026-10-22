<script setup lang="ts">
import { ChevronRight, Pencil, type IconNode } from 'lucide'

/**
 * A settings card showing one value with an Edit button. While `editing`, it
 * opens in place into the edit form, which goes in the default slot.
 */
const props = defineProps<{
  icon: IconNode
  tone: 'sky' | 'violet'
  label: string
  /** What's set now, under the label. */
  value: string
  editTitle: string
  editHint: string
  /** Keep the value and the hint to one line, for an address that shouldn't wrap. */
  truncate?: boolean
}>()

const editing = defineModel<boolean>('editing', { required: true })

const TONES = {
  sky: {
    tile: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100',
    button: 'group-hover:border-sky-200 group-hover:text-sky-700',
    editingTile: 'bg-sky-600 text-white shadow-sm shadow-sky-600/25',
  },
  violet: {
    tile: 'bg-violet-50 text-violet-600 ring-1 ring-violet-100',
    button: 'group-hover:border-violet-200 group-hover:text-violet-700',
    editingTile: 'bg-violet-600 text-white shadow-sm shadow-violet-600/25',
  },
}
const colors = computed(() => TONES[props.tone])
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-900/3">
    <button
      v-if="!editing"
      type="button"
      class="group flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50"
      @click="editing = true"
    >
      <span class="flex min-w-0 items-start gap-3">
        <span class="grid size-10 shrink-0 place-items-center rounded-lg" :class="colors.tile">
          <LucideIcon :icon="icon" class="size-5" />
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-semibold text-slate-900">{{ label }}</span>
          <span class="mt-1 block text-sm text-slate-500" :class="{ truncate }">{{ value }}</span>
        </span>
      </span>
      <span
        class="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition"
        :class="colors.button"
      >
        <LucideIcon :icon="Pencil" class="size-4" />
        {{ $t('common.edit') }}
        <LucideIcon :icon="ChevronRight" class="size-4 text-slate-400" />
      </span>
    </button>

    <div v-else class="px-4 py-4">
      <div class="mb-4 flex items-start gap-3">
        <span class="grid size-10 shrink-0 place-items-center rounded-lg" :class="colors.editingTile">
          <LucideIcon :icon="icon" class="size-5" />
        </span>
        <div class="min-w-0">
          <h4 class="text-sm font-semibold text-slate-900">{{ editTitle }}</h4>
          <p class="mt-1 text-sm text-slate-500" :class="{ truncate }">{{ editHint }}</p>
        </div>
      </div>

      <slot />
    </div>
  </section>
</template>
