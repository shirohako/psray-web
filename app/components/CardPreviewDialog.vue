<script setup lang="ts">
import { Image, ExternalLink, RefreshCw, Copy, Link } from 'lucide'
import type { ShareCardKind } from '~/utils/shareCard'

/**
 * Previews a backend-rendered share card in a dialog. `kind` + `slug` mirror the
 * card routes used for `og:image`, so the dialog always shows the same image
 * crawlers and chat apps get. Opened by `CardPreviewButton` and by the profile's
 * share-card showcase.
 */
const props = defineProps<{
  /** Card route under `/card/`. */
  kind: ShareCardKind
  /** Card identifier: a lowercased PSN ID, or a trophy set id. */
  slug: string | number
  /** Name shown in the dialog header and the image's alt text. */
  caption: string
  /** Cache-busting version; defaults to the kind's `SHARE_CARD_VERSION`. */
  version?: string | number
}>()
const open = defineModel<boolean>('open', { default: false })

const config = useRuntimeConfig()
const { t } = useI18n()
const toast = useToast()
const loaded = ref(false)
const failed = ref(false)
const attempt = ref(0)
// `cardUrl` is what we show, copy and open: clean, no cache-busting noise.
// `imageUrl` is what the <img> actually requests — the `v=` bump matches the
// `og:image` URLs, and `preview=` forces a fresh fetch when a retry is asked for.
const cardUrl = computed(() => shareCardUrl(config.public.cardBase, props.kind, props.slug))
const imageUrl = computed(() => `${cardUrl.value}?v=${props.version ?? SHARE_CARD_VERSION[props.kind]}${attempt.value ? `&preview=${attempt.value}` : ''}`)

async function copyLink() {
  try {
    await navigator.clipboard.writeText(cardUrl.value)
    toast.success({ title: t('qr.linkCopied') })
  }
  catch {
    toast.error({ title: t('toast.copyFailed.title'), description: t('toast.copyFailed.description') })
  }
}

function retry() {
  loaded.value = false
  failed.value = false
  attempt.value = Date.now()
}

// Each opening starts from a clean load, as does a different card.
watch(open, (value) => {
  if (!value) return
  loaded.value = false
  failed.value = false
})
watch(() => cardUrl.value, () => {
  open.value = false
  loaded.value = false
  failed.value = false
  attempt.value = 0
})
</script>

<template>
  <Dialog v-model:open="open" :title="$t('card.title')" size="2xl">
    <div class="bg-linear-to-br from-slate-50 via-indigo-50/40 to-violet-50/50 p-4 sm:p-6">
      <div class="mb-4 flex items-center gap-3">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100/80 text-indigo-500">
          <LucideIcon :icon="Image" class="size-5" />
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-900">{{ caption }}</p>
          <p class="mt-0.5 text-xs leading-relaxed text-slate-500">{{ $t('card.description') }}</p>
        </div>
      </div>

      <div class="card-preview-image relative mx-auto aspect-1200/630 overflow-hidden rounded-xl bg-white shadow-lg shadow-indigo-950/10 ring-1 ring-slate-900/5" :aria-busy="!loaded && !failed">
        <div v-if="!loaded && !failed" class="absolute inset-0 flex items-center justify-center bg-slate-100/80" role="status">
          <div class="flex items-center gap-2 text-sm text-slate-500">
            <LucideIcon :icon="RefreshCw" class="size-4 animate-spin motion-reduce:animate-none" />
            {{ $t('card.loading') }}
          </div>
        </div>
        <div v-if="failed" class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center" role="alert">
          <p class="text-sm text-slate-500">{{ $t('card.error') }}</p>
          <button type="button" class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700" @click="retry">
            <LucideIcon :icon="RefreshCw" class="size-3.5" />
            {{ $t('card.retry') }}
          </button>
        </div>
        <img
          v-if="open && !failed"
          :key="imageUrl"
          :src="imageUrl"
          :alt="$t('card.alt', { name: caption })"
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
        <span :title="cardUrl" class="min-w-0 flex-1 truncate text-xs leading-relaxed text-slate-600 sm:text-sm">{{ cardUrl }}</span>
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
          {{ $t('card.openImage') }}
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
