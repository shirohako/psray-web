<script setup lang="ts">
import { RefreshCw } from 'lucide'

/**
 * An image URL input with an "Update preview" button beside it. The preview
 * only takes the URL on that click, so typing doesn't make it flicker.
 */
defineProps<{
  label: string
  placeholder: string
  error?: string
}>()

const model = defineModel<string>({ required: true })
defineEmits<{ preview: [] }>()

const inputId = useId()
</script>

<template>
  <div>
    <label :for="inputId" class="mb-1.5 block text-sm font-medium text-slate-700">{{ label }}</label>
    <div class="flex items-center gap-2">
      <input
        :id="inputId"
        v-model="model"
        type="url"
        :placeholder="placeholder"
        class="w-full flex-1 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-900 transition placeholder:text-slate-400 hover:bg-white focus:bg-white focus:outline-none focus:ring-4"
        :class="error
          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
          : 'border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-slate-900/10'"
      />
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        @click="$emit('preview')"
      >
        <LucideIcon :icon="RefreshCw" class="size-4" />
        {{ $t('settings.profile.updatePreview') }}
      </button>
    </div>
    <p v-if="error" class="mt-1.5 text-xs font-medium text-rose-600">{{ error }}</p>
  </div>
</template>
