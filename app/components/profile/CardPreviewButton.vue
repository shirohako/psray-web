<script setup lang="ts">
import { Image, ExternalLink, RefreshCw, Copy, Link } from 'lucide'

const props = defineProps<{ psnid: string }>()
const config = useRuntimeConfig()
const { t } = useI18n()
const toast = useToast()
const open = ref(false)
const loaded = ref(false)
const failed = ref(false)
const attempt = ref(0)
const cardUrl = computed(() => `${config.public.cardBase.replace(/\/+$/, '')}/card/profile/${encodeURIComponent(props.psnid.toLowerCase())}.png?v=3`)
const imageUrl = computed(() => `${cardUrl.value}${attempt.value ? `&preview=${attempt.value}` : ''}`)

async function copyLink() {
  try {
    await navigator.clipboard.writeText(cardUrl.value)
    toast.success({ title: t('qr.linkCopied') })
  }
  catch {
    toast.error({ title: t('toast.copyFailed.title'), description: t('toast.copyFailed.description') })
  }
}

function show() {
  loaded.value = false
  failed.value = false
  open.value = true
}

function retry() {
  loaded.value = false
  failed.value = false
  attempt.value = Date.now()
}

watch(() => props.psnid, () => {
  open.value = false
  loaded.value = false
  failed.value = false
  attempt.value = 0
})
</script>

<template>
  <button
    type="button"
    :title="$t('profile.cardPreview.title')"
    :aria-label="$t('profile.cardPreview.title')"
    class="inline-flex size-8 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/25"
    @click="show"
  >
    <LucideIcon :icon="Image" class="size-4" />
  </button>

  <Dialog v-model:open="open" :title="$t('profile.cardPreview.title')" size="2xl">
    <div class="bg-linear-to-br from-slate-50 via-indigo-50/40 to-violet-50/50 p-4 sm:p-6">
      <div class="mb-4 flex items-center gap-3">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100/80 text-indigo-500">
          <LucideIcon :icon="Image" class="size-5" />
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-900">{{ psnid }}</p>
          <p class="mt-0.5 text-xs leading-relaxed text-slate-500">{{ $t('profile.cardPreview.description') }}</p>
        </div>
      </div>

      <div class="card-preview-image relative mx-auto aspect-1200/630 overflow-hidden rounded-xl bg-white shadow-lg shadow-indigo-950/10 ring-1 ring-slate-900/5" :aria-busy="!loaded && !failed">
        <div v-if="!loaded && !failed" class="absolute inset-0 flex items-center justify-center bg-slate-100/80" role="status">
          <div class="flex items-center gap-2 text-sm text-slate-500">
            <LucideIcon :icon="RefreshCw" class="size-4 animate-spin motion-reduce:animate-none" />
            {{ $t('profile.cardPreview.loading') }}
          </div>
        </div>
        <div v-if="failed" class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center" role="alert">
          <p class="text-sm text-slate-500">{{ $t('profile.cardPreview.error') }}</p>
          <button type="button" class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700" @click="retry">
            <LucideIcon :icon="RefreshCw" class="size-3.5" />
            {{ $t('profile.cardPreview.retry') }}
          </button>
        </div>
        <img
          v-if="open && !failed"
          :key="imageUrl"
          :src="imageUrl"
          :alt="$t('profile.cardPreview.alt', { psnid })"
          width="1200"
          height="630"
          class="h-full w-full object-contain transition-opacity duration-200 motion-reduce:transition-none"
          :class="loaded ? 'opacity-100' : 'opacity-0'"
          @load="loaded = true"
          @error="failed = true"
        />
      </div>
      <div class="mt-5 flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/90 p-2 pl-3">
        <LucideIcon :icon="Link" class="size-4 shrink-0 text-slate-400" />
        <a :href="cardUrl" :title="cardUrl" target="_blank" rel="noopener noreferrer" class="min-w-0 flex-1 truncate text-xs leading-relaxed text-slate-600 hover:text-indigo-600 sm:text-sm">{{ cardUrl }}</a>
        <button type="button" :title="$t('qr.copyLink')" :aria-label="$t('qr.copyLink')" class="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100" @click="copyLink">
          <LucideIcon :icon="Copy" class="size-4" />
          <span class="hidden sm:inline">{{ $t('qr.copyLink') }}</span>
        </button>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end">
        <a :href="cardUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
          <LucideIcon :icon="ExternalLink" class="size-4" />
          {{ $t('profile.cardPreview.openImage') }}
        </a>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.card-preview-image {
  /* Reserve space for the dialog header, identity, link, footer and padding.
     Limit width as well as height so the entire card keeps its aspect ratio. */
  width: min(100%, max(120px, calc((85vh - 300px) * 1200 / 630)));
  width: min(100%, max(120px, calc((85dvh - 300px) * 1200 / 630)));
}
</style>
