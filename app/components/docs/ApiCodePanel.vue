<script setup lang="ts">
/**
 * A dark panel in the /docs/api code column: a tab strip (or a single label),
 * optional header actions, a copy button and a scrolling body.
 */
import { Check, Copy } from 'lucide'

const props = defineProps<{
  tabs: { id: string, label: string }[]
  /** Text the copy button copies for the active tab; no button when omitted. */
  copyText?: string
  /** Toast label, e.g. "cURL". */
  copyLabel?: string
}>()

const active = defineModel<string>({ default: '' })
if (!active.value) active.value = props.tabs[0]?.id ?? ''

const { t } = useI18n()
const copyToClipboard = useCopyText()
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  if (!props.copyText) return
  if (!(await copyToClipboard(props.copyText, props.copyLabel ?? t('apiDocs.copy.code')))) return
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => { copied.value = false }, 1600)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-lg shadow-black/20">
    <div class="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 px-2.5 py-2">
      <div v-if="tabs.length > 1" role="tablist" class="flex gap-0.5 rounded-lg bg-slate-950/60 p-0.5">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="active === tab.id"
          class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          :class="active === tab.id ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
          @click="active = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
      <span v-else class="px-1.5 text-xs font-medium text-slate-400">{{ tabs[0]?.label }}</span>

      <div class="flex items-center gap-2">
        <slot name="actions" />
        <button
          v-if="copyText"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          @click="copy"
        >
          <LucideIcon :icon="copied ? Check : Copy" class="size-3.5" :class="copied ? 'text-emerald-300' : ''" />
          {{ $t('apiDocs.copy.button') }}
        </button>
      </div>
    </div>
    <div class="min-h-0 flex-1 overflow-auto px-4 py-3">
      <slot />
    </div>
  </div>
</template>
