<script setup lang="ts">
import { Copy, Download, Loader2, TriangleAlert } from 'lucide'
import { tierListFileName } from '~/utils/tierList'
import {
  parseTierExportOptions,
  renderTierListImage,
  TIER_EXPORT_OPTIONS_KEY,
  type TierExportInput,
  type TierExportTheme,
} from '~/utils/tierListExport'

/**
 * Previews the open list as a PNG and saves or copies it. The image is drawn
 * in the browser (`tierListExport.ts`); the options are remembered.
 */
const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const toast = useToast()
const editor = useTierEditor()
const config = useRuntimeConfig()

const options = reactive(parseTierExportOptions(localStorage.getItem(TIER_EXPORT_OPTIONS_KEY)))
watch(options, () => {
  try {
    localStorage.setItem(TIER_EXPORT_OPTIONS_KEY, JSON.stringify(options))
  }
  catch {}
}, { deep: true })

const previewUrl = ref<string | null>(null)
const blob = ref<Blob | null>(null)
const rendering = ref(false)
const failed = ref(false)
const missing = ref(0)
let seq = 0

const site = computed(() => {
  try {
    return `${new URL(config.public.siteUrl).host}/tools/tierlist`
  }
  catch {
    return 'psray.net/tools/tierlist'
  }
})

function today() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function exportInput(): TierExportInput | null {
  const list = editor.list
  if (!list) return null
  return {
    title: list.title.trim(),
    date: today(),
    site: site.value,
    rows: list.rows.map(row => ({
      label: row.label,
      color: row.color,
      items: row.items.flatMap((id) => {
        const item = list.items[id]
        return item ? [{ name: item.name, src: editor.itemSrc(item), color: item.color }] : []
      }),
    })),
  }
}

async function render() {
  const input = exportInput()
  if (!input) return
  const id = ++seq
  rendering.value = true
  failed.value = false
  try {
    const result = await renderTierListImage(
      input,
      // An empty title would leave a gap at the top.
      { ...options, showTitle: options.showTitle && Boolean(input.title) },
      { fontFamily: getComputedStyle(document.body).fontFamily, logo: '/logo.svg' },
    )
    if (id !== seq) return
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(result.blob)
    blob.value = result.blob
    missing.value = result.missing
  }
  catch {
    if (id === seq) failed.value = true
  }
  finally {
    if (id === seq) rendering.value = false
  }
}

// Redraw when opened and whenever an option changes while open.
watch([open, () => ({ ...options })], ([isOpen]) => {
  if (isOpen) render()
}, { immediate: true })

onBeforeUnmount(() => {
  seq++
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function download() {
  if (!previewUrl.value) return
  const link = document.createElement('a')
  link.href = previewUrl.value
  link.download = tierListFileName(editor.list?.title ?? '')
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function copy() {
  if (!blob.value) return
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob.value })])
    toast.success({ id: 'tierlist-copy', title: t('tierlist.export.copied') })
  }
  catch {
    toast.error({ id: 'tierlist-copy', title: t('tierlist.export.copyFailed') })
  }
}

const themes: { value: TierExportTheme, label: string }[] = [
  { value: 'light', label: 'tierlist.export.light' },
  { value: 'dark', label: 'tierlist.export.dark' },
]
const toggles = [
  { key: 'showTitle', label: 'tierlist.export.showTitle' },
  { key: 'showNames', label: 'tierlist.export.showNames' },
  { key: 'watermark', label: 'tierlist.export.watermark' },
] as const
</script>

<template>
  <Dialog v-model:open="open" :title="$t('tierlist.export.title')" size="4xl">
    <div class="grid gap-0 md:grid-cols-[minmax(0,1fr)_15rem]">
      <div class="relative grid min-h-64 place-items-center bg-slate-100/80 p-4 sm:p-5">
        <img
          v-if="previewUrl"
          :src="previewUrl"
          :alt="$t('tierlist.export.preview')"
          class="max-h-[60vh] w-auto max-w-full rounded-md object-contain shadow-md ring-1 ring-black/5 transition-opacity"
          :class="rendering ? 'opacity-60' : ''"
        >
        <div v-if="rendering" class="absolute inset-0 grid place-items-center">
          <span class="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-black/5">
            <LucideIcon :icon="Loader2" class="size-3.5 animate-spin" />{{ $t('tierlist.export.rendering') }}
          </span>
        </div>
        <p v-else-if="failed" class="text-sm text-rose-600">{{ $t('tierlist.export.failed') }}</p>
      </div>

      <div class="flex flex-col gap-1 border-t border-slate-100 p-4 md:border-l md:border-t-0">
        <div class="flex h-10 items-center justify-between gap-3">
          <span class="text-sm text-slate-700">{{ $t('tierlist.export.background') }}</span>
          <div class="flex gap-0.5 rounded-lg bg-slate-100 p-0.5" role="radiogroup" :aria-label="$t('tierlist.export.background')">
            <button
              v-for="theme in themes"
              :key="theme.value"
              type="button"
              role="radio"
              :aria-checked="options.theme === theme.value"
              class="h-7 cursor-pointer rounded-md px-2.5 text-xs font-semibold transition"
              :class="options.theme === theme.value ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/10' : 'text-slate-500 hover:text-slate-800'"
              @click="options.theme = theme.value"
            >
              {{ $t(theme.label) }}
            </button>
          </div>
        </div>
        <label v-for="toggle in toggles" :key="toggle.key" class="flex h-10 items-center justify-between gap-3">
          <span class="text-sm text-slate-700">{{ $t(toggle.label) }}</span>
          <SettingsSwitch v-model="options[toggle.key]" :label="$t(toggle.label)" />
        </label>

        <p v-if="missing" class="mt-2 flex gap-1.5 rounded-md bg-amber-50 px-2.5 py-2 text-[11px] leading-4 text-amber-800">
          <LucideIcon :icon="TriangleAlert" class="mt-px size-3.5 shrink-0" />{{ $t('tierlist.export.missing', missing) }}
        </p>
        <div class="flex-1" />
        <p class="mt-4 text-[11px] leading-4 text-slate-400">{{ $t('tierlist.export.local') }}</p>
        <div class="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            class="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!blob || rendering"
            @click="copy"
          >
            <LucideIcon :icon="Copy" class="size-3.5" />{{ $t('tierlist.export.copy') }}
          </button>
          <button
            type="button"
            class="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-slate-900 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!previewUrl || rendering"
            @click="download"
          >
            <LucideIcon :icon="Download" class="size-3.5" />{{ $t('tierlist.export.download') }}
          </button>
        </div>
      </div>
    </div>
  </Dialog>
</template>
