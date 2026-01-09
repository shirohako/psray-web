<template>
  <div
    class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 shadow-sm"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="relative overflow-hidden rounded-full px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
      :class="
        option.value === modelValue
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
      "
      @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
interface LanguageOption {
  label: string;
  value: string;
}

interface Props {
  modelValue: string;
  options: LanguageOption[];
}

defineProps<Props>();

defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();
</script>
