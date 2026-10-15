<script setup lang="ts">
/**
 * On/off switch for settings rows. A real `role="switch"` button, so it is
 * focusable and announces its state; `label` names it for screen readers.
 */
defineProps<{ label: string; disabled?: boolean }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-label="label"
    :disabled="disabled"
    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    :class="model ? 'bg-slate-900' : 'bg-slate-200'"
    @click="model = !model"
  >
    <span
      class="inline-block size-5 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform"
      :class="model ? 'translate-x-5.5' : 'translate-x-0.5'"
    />
  </button>
</template>
