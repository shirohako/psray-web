<script setup lang="ts">
import { Plus, X } from 'lucide'

/** A list of short strings as removable chips, plus an input that adds one on Enter. */
const model = defineModel<string[]>({ required: true })
defineProps<{ placeholder?: string, id?: string }>()

const entry = ref('')
function add() {
  const value = entry.value.trim()
  if (value && !model.value.some(v => v.toLowerCase() === value.toLowerCase())) model.value = [...model.value, value]
  entry.value = ''
}
function remove(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <TransitionGroup
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="scale-95 opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="scale-95 opacity-0"
    >
      <span v-for="(value, index) in model" :key="value" class="inline-flex h-7 items-center gap-1.5 rounded-full border border-slate-200 bg-white pl-3 pr-1.5 text-xs text-slate-700">
        {{ value }}
        <button type="button" class="grid size-4 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" :aria-label="`删除 ${value}`" @click="remove(index)">
          <LucideIcon :icon="X" class="size-3" />
        </button>
      </span>
    </TransitionGroup>
    <label class="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-slate-300 pl-2.5 pr-1 text-xs text-slate-500 focus-within:border-slate-900">
      <LucideIcon :icon="Plus" class="size-3" />
      <input :id="id" v-model="entry" class="w-36 bg-transparent text-slate-900 outline-none placeholder:text-slate-400" :placeholder="placeholder ?? '添加后回车'" maxlength="255" @keydown.enter.prevent="add" @blur="add" />
    </label>
  </div>
</template>
