<script setup lang="ts">
import type { FieldState } from '~/utils/adminTrophySet'

/**
 * One editable trophy-set text with its PSN state: the field turns amber when
 * it holds (or will hold) a manual value, and shows PSN's current value when
 * that differs, so the admin can see what a restore would bring back.
 */
// Bound to a lookup into the draft texts, so typed as possibly missing; treated as ''.
const model = defineModel<string | undefined>()
const props = withDefaults(defineProps<{
  id: string
  label: string
  state: FieldState
  /** PSN's value for this field (its latest upstream value when overridden). */
  psn: string
  multiline?: boolean
  placeholder?: string
  maxlength?: number
  invalid?: boolean
}>(), { multiline: false, maxlength: 255, invalid: false })
defineEmits<{ restore: [], cancel: [] }>()

const showPsn = computed(() => (props.state === 'locked' || props.state === 'lock') && props.psn.trim() !== (model.value ?? '').trim())
const tone = computed(() => props.invalid
  ? 'border-red-300'
  : props.state === 'locked' || props.state === 'lock' ? 'border-amber-200 bg-amber-50/40' : '')
</script>

<template>
  <div>
    <div class="mb-1.5 flex min-h-5 items-center justify-between gap-3">
      <label :for="id" class="text-xs font-medium text-slate-700">{{ label }}</label>
      <AdminLockState :state="state" source="PSN" @restore="$emit('restore')" @cancel="$emit('cancel')" />
    </div>
    <textarea v-if="multiline" :id="id" v-model="model" :maxlength="maxlength" class="admin-input min-h-16" :class="tone" :placeholder="placeholder" />
    <input v-else :id="id" v-model="model" :maxlength="maxlength" class="admin-input" :class="tone" :placeholder="placeholder" />
    <p v-if="showPsn" class="mt-1.5 line-clamp-2 text-xs text-slate-500"><span class="text-slate-400">PSN 当前：</span>{{ psn || '（空）' }}</p>
  </div>
</template>
