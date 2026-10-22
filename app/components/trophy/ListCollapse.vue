<script setup lang="ts">
import { ChevronDown } from 'lucide'

/**
 * Phone-only fold around the trophy list. A long list shows its first rows
 * under a fade with an "expand" button; expanded, it shows in full with a
 * "collapse" button below. From `sm` up the list always shows in full.
 */
defineProps<{
  /** The list is long enough to fold; a shorter one gets no button. */
  collapsible: boolean
}>()

const expanded = defineModel<boolean>('expanded', { required: true })

// Revealing a row unfolds without the height animation: mid-animation the list,
// and with it the page, is still short, so the scroll would stop above the row
// (and scroll the clipped list itself instead).
const instant = ref(false)

/** Unfold at once and scroll the row with this element id into view. */
async function reveal(id: string) {
  instant.value = true
  expanded.value = true
  await nextTick()
  document.getElementById(id)?.scrollIntoView({ block: 'start' })
  instant.value = false
}

defineExpose({ reveal })
</script>

<template>
  <div class="relative">
    <div
      class="divide-y divide-slate-200 max-sm:overflow-hidden"
      :class="[
        expanded ? 'max-sm:max-h-[9999px]' : 'max-sm:max-h-136',
        { 'transition-[max-height] duration-500 ease-out': !instant },
      ]"
    >
      <slot />
    </div>

    <div
      v-if="collapsible"
      class="sm:hidden"
      :class="expanded ? 'border-t border-slate-200 bg-white px-4 py-3' : 'pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-white via-white/95 to-white/0 px-4 pb-4 pt-18'"
    >
      <button
        type="button"
        class="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition active:scale-[0.99]"
        @click="expanded = !expanded"
      >
        {{ expanded ? $t('trophy.list.collapse') : $t('trophy.list.expand') }}
        <LucideIcon
          :icon="ChevronDown"
          class="size-4 transition-transform duration-300"
          :class="expanded ? 'rotate-180' : ''"
        />
      </button>
    </div>
  </div>
</template>
