<script setup lang="ts">
import { PENALTY_LEVELS } from '~/utils/admin'
import type { PenaltyLevel } from '~/types/admin'
/** The penalty levels to choose from, each with what it does. */
defineProps<{ modelValue: PenaltyLevel | null; disabled?: boolean }>()
defineEmits<{ 'update:modelValue': [value: PenaltyLevel] }>()
</script>
<template>
  <fieldset class="mb-4">
    <legend class="mb-1.5 text-xs font-medium text-slate-700">
      处罚等级
    </legend>
    <div class="grid gap-2 sm:grid-cols-2">
      <label
        v-for="l in PENALTY_LEVELS"
        :key="l.value"
        class="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-white p-3 text-[13px] transition has-disabled:cursor-not-allowed has-disabled:opacity-60"
        :class="
          modelValue === l.value
            ? l.value === 'termination'
              ? 'border-red-400 ring-2 ring-red-500/15'
              : 'border-slate-900 ring-2 ring-slate-900/10'
            : 'border-slate-200 hover:border-slate-300'
        "
      >
        <input
          type="radio"
          name="admin-ban-level"
          :value="l.value"
          :checked="modelValue === l.value"
          :disabled="disabled"
          class="mt-0.5 size-4"
          :class="
            l.value === 'termination'
              ? 'accent-red-600'
              : 'accent-slate-900'
          "
          @change="$emit('update:modelValue', l.value)"
        />
        <span class="min-w-0">
          <span class="block font-medium text-slate-950">{{
            l.label
          }}</span>
          <span class="mt-0.5 block text-xs text-slate-500">{{
            l.effect
          }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
