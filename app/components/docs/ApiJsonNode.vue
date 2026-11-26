<script setup lang="ts">
/**
 * One node of the collapsible JSON viewer in Try it. Objects and arrays render
 * a caret that folds their children; the first two levels start open. Long
 * arrays show their first items and a button for the rest, so a trophy list
 * with hundreds of entries stays responsive.
 */
import { ChevronRight } from 'lucide'

const props = withDefaults(defineProps<{
  value: unknown
  /** Object key or array index; omitted for the root. */
  name?: string | number
  depth?: number
  /** Last child of its parent: no trailing comma. */
  last?: boolean
}>(), { depth: 0, last: true })

const ARRAY_PREVIEW = 20

const isArray = computed(() => Array.isArray(props.value))
const isContainer = computed(() => props.value !== null && typeof props.value === 'object')
const entries = computed<[string | number, unknown][]>(() => {
  if (Array.isArray(props.value)) return props.value.map((item, index) => [index, item])
  if (isContainer.value) return Object.entries(props.value as Record<string, unknown>)
  return []
})

const open = ref(props.depth < 2)
const shown = ref(ARRAY_PREVIEW)
const visible = computed(() => isArray.value ? entries.value.slice(0, shown.value) : entries.value)
const hidden = computed(() => entries.value.length - visible.value.length)

const brackets = computed(() => isArray.value ? ['[', ']'] : ['{', '}'])

const primitive = computed(() => {
  const value = props.value
  if (value === null) return { text: 'null', cls: 'text-violet-300' }
  if (typeof value === 'string') return { text: JSON.stringify(value), cls: 'text-emerald-300 break-all' }
  if (typeof value === 'number') return { text: String(value), cls: 'text-amber-300' }
  if (typeof value === 'boolean') return { text: String(value), cls: 'text-violet-300' }
  return { text: String(value), cls: 'text-slate-300' }
})
</script>

<template>
  <div class="font-mono text-[12.5px] leading-5">
    <div class="flex items-start">
      <button
        v-if="isContainer && entries.length"
        type="button"
        :aria-expanded="open"
        :aria-label="open ? $t('apiDocs.tryIt.collapse') : $t('apiDocs.tryIt.expand')"
        class="-ml-4 grid h-5 w-4 shrink-0 place-items-center text-slate-500 transition-colors hover:text-slate-200 focus:outline-none focus-visible:text-sky-300"
        @click="open = !open"
      >
        <LucideIcon :icon="ChevronRight" class="size-3 transition-transform duration-150 motion-reduce:transition-none" :class="open ? 'rotate-90' : ''" />
      </button>
      <span class="min-w-0">
        <template v-if="name !== undefined">
          <span v-if="typeof name === 'string'" class="text-sky-300">"{{ name }}"</span><span v-else class="text-slate-500">{{ name }}</span><span class="text-slate-500">: </span>
        </template>
        <template v-if="isContainer">
          <span class="text-slate-500">{{ brackets[0] }}</span>
          <template v-if="!entries.length"><span class="text-slate-500">{{ brackets[1] }}</span><span v-if="!last" class="text-slate-500">,</span></template>
          <button
            v-else-if="!open"
            type="button"
            class="mx-1 rounded bg-slate-800 px-1.5 text-[11px] text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-100"
            @click="open = true"
          >… {{ entries.length }}</button>
          <template v-if="entries.length && !open"><span class="text-slate-500">{{ brackets[1] }}</span><span v-if="!last" class="text-slate-500">,</span></template>
        </template>
        <template v-else>
          <span :class="primitive.cls">{{ primitive.text }}</span><span v-if="!last" class="text-slate-500">,</span>
        </template>
      </span>
    </div>

    <template v-if="isContainer && entries.length && open">
      <div class="ml-1.5 border-l border-slate-800 pl-[1.375rem]">
        <ApiJsonNode
          v-for="([key, child], index) in visible"
          :key="key"
          :name="key"
          :value="child"
          :depth="depth + 1"
          :last="index === entries.length - 1"
        />
        <button
          v-if="hidden > 0"
          type="button"
          class="my-0.5 rounded bg-slate-800 px-2 text-[11px] leading-5 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          @click="shown = entries.length"
        >
          {{ $t('apiDocs.tryIt.showMore', { count: hidden }) }}
        </button>
      </div>
      <div><span class="text-slate-500">{{ brackets[1] }}</span><span v-if="!last" class="text-slate-500">,</span></div>
    </template>
  </div>
</template>
