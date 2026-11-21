<script setup lang="ts">
import { Search } from 'lucide'

/** A PSN ID box that asks the series page to show that player's progress. */
const emit = defineEmits<{ view: [psnid: string] }>()

const id = useId()
const input = ref('')

function submit() {
  const value = input.value.trim()
  if (value) emit('view', value)
  input.value = ''
}
</script>

<template>
  <form class="relative w-full max-w-56 sm:w-56" role="search" @submit.prevent="submit">
    <label :for="id" class="sr-only">{{ $t('series.viewer.label') }}</label>
    <input
      :id="id"
      v-model="input"
      type="text"
      maxlength="32"
      autocomplete="off"
      spellcheck="false"
      :placeholder="$t('series.viewer.placeholder')"
      class="h-8 w-full rounded-md border border-slate-200 bg-white pl-2.5 pr-9 text-xs outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
    />
    <button type="submit" class="absolute right-1 top-1 grid size-6 place-items-center rounded bg-slate-900 text-white transition hover:bg-slate-700" :aria-label="$t('series.viewer.submit')">
      <LucideIcon :icon="Search" class="size-3.5" />
    </button>
  </form>
</template>
