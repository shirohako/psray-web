<script setup lang="ts">
import { ImagePlus, X } from 'lucide'

/**
 * Up to {@link FEEDBACK_MAX_IMAGES} links to screenshots on an outside image
 * host. Edits a plain string list; empty rows are the caller's to drop.
 * `errors` is keyed by row index.
 */
const urls = defineModel<string[]>({ required: true })
defineProps<{
  disabled?: boolean
  errors?: Record<number, string>
}>()

function add() {
  if (urls.value.length < FEEDBACK_MAX_IMAGES) urls.value = [...urls.value, '']
}

function remove(index: number) {
  urls.value = urls.value.filter((_, i) => i !== index)
}

function update(index: number, value: string) {
  urls.value = urls.value.map((url, i) => i === index ? value : url)
}
</script>

<template>
  <div>
    <div class="mb-1.5 flex items-center justify-between gap-3">
      <span class="text-xs font-semibold text-slate-600">{{ $t('feedback.form.images') }}</span>
      <button
        v-if="urls.length < FEEDBACK_MAX_IMAGES"
        type="button"
        :disabled="disabled"
        class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
        @click="add"
      >
        <LucideIcon :icon="ImagePlus" class="size-3.5" />
        {{ $t('feedback.form.addImage') }}
      </button>
    </div>
    <p class="text-[11px] leading-5 text-slate-400">{{ $t('feedback.form.imagesHint', { count: FEEDBACK_MAX_IMAGES }) }}</p>

    <ul v-if="urls.length" class="mt-2 space-y-2">
      <li v-for="(url, index) in urls" :key="index">
        <div class="flex items-center gap-2">
          <img
            v-if="isHttpsUrl(url.trim())"
            :src="url.trim()"
            alt=""
            referrerpolicy="no-referrer"
            class="size-9 shrink-0 rounded border border-slate-200 bg-slate-50 object-cover"
          />
          <span v-else class="size-9 shrink-0 rounded border border-dashed border-slate-200 bg-slate-50" />
          <input
            :value="url"
            type="url"
            inputmode="url"
            maxlength="2048"
            :disabled="disabled"
            :placeholder="$t('feedback.form.imagePlaceholder')"
            :aria-label="$t('feedback.form.images')"
            class="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4"
            :class="errors?.[index] ? 'border-rose-300 focus:ring-rose-500/10' : 'border-slate-200 focus:border-slate-900 focus:ring-slate-900/10'"
            @input="update(index, ($event.target as HTMLInputElement).value)"
          />
          <button
            type="button"
            :disabled="disabled"
            class="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            :aria-label="$t('feedback.form.removeImage')"
            @click="remove(index)"
          >
            <LucideIcon :icon="X" class="size-4" />
          </button>
        </div>
        <span v-if="errors?.[index]" class="mt-1 block text-xs font-medium text-rose-600">{{ errors[index] }}</span>
      </li>
    </ul>
  </div>
</template>
