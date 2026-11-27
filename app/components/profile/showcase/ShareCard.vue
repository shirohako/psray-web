<script setup lang="ts">
import { Check, Copy, Image, Maximize2 } from 'lucide'

/**
 * Showcase: the owner's share card, the same image `og:image` points at. The
 * header pill copies the card's link; the image opens the full preview.
 *
 * `version` comes from the API (when the card file was last written), so the
 * image URL changes whenever the card is redrawn — even for a style-only change
 * — and the browser's 6-hour cache never shows a stale one. The copied link has
 * no version: it is the address people share.
 */
const props = defineProps<{ psnid: string, version: string }>()

const config = useRuntimeConfig()
const { t } = useI18n()
const toast = useToast()

const slug = computed(() => props.psnid.toLowerCase())
const cardUrl = computed(() => shareCardUrl(config.public.cardBase, 'profile', slug.value))
const imageUrl = computed(() => `${cardUrl.value}?v=${props.version}`)

/*
 * Where the ticket sits inside the 1200×630 card image — `TICKET` in
 * psray-api `card-renderer/src/profileCard.ts`; keep the two in step. The image
 * keeps a grey ground around the ticket for social previews; here only the
 * ticket is shown, so the image is scaled up and offset until the ticket fills
 * the frame, and the frame takes the ticket's own corner radius.
 */
const CARD_WIDTH = 1200
const TICKET = { x: 28, y: 30, width: 1144, height: 570, radius: 24 }
const ticketFrame = {
  aspectRatio: `${TICKET.width} / ${TICKET.height}`,
  // Scales with the frame: `cqw` is relative to the padded button, whose
  // content box is exactly the frame's width.
  borderRadius: `calc(100cqw * ${TICKET.radius / TICKET.width})`,
}
const ticketCrop = {
  width: `${(CARD_WIDTH / TICKET.width) * 100}%`,
  left: `${(-TICKET.x / TICKET.width) * 100}%`,
  top: `${(-TICKET.y / TICKET.height) * 100}%`,
}

const previewOpen = ref(false)

// The pill confirms a copy in place for a moment instead of raising a toast.
const copied = ref(false)
let resetCopied: ReturnType<typeof setTimeout> | undefined
async function copyLink() {
  try {
    await navigator.clipboard.writeText(cardUrl.value)
    copied.value = true
    clearTimeout(resetCopied)
    resetCopied = setTimeout(() => { copied.value = false }, 2000)
  }
  catch {
    toast.error({ title: t('toast.copyFailed.title'), description: t('toast.copyFailed.description') })
  }
}
onBeforeUnmount(() => clearTimeout(resetCopied))
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <header class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <h2 class="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
        <LucideIcon :icon="Image" class="size-4 shrink-0 text-slate-500" />
        {{ $t('profile.showcase.shareCard.title') }}
      </h2>
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition"
        :class="copied ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'"
        :title="cardUrl"
        @click="copyLink"
      >
        <LucideIcon :icon="copied ? Check : Copy" class="size-3" />
        <span aria-live="polite">{{ copied ? $t('qr.copied') : $t('qr.copyLink') }}</span>
      </button>
    </header>

    <button
      type="button"
      class="group block w-full bg-slate-50 p-3 @container"
      :aria-label="$t('profile.showcase.shareCard.enlarge')"
      @click="previewOpen = true"
    >
      <span
        class="relative block overflow-hidden bg-white ring-1 ring-slate-200 transition group-hover:ring-slate-300"
        :style="ticketFrame"
      >
        <img
          :src="imageUrl"
          :alt="$t('card.alt', { name: psnid })"
          width="1200"
          height="630"
          loading="lazy"
          class="absolute max-w-none"
          :style="ticketCrop"
        >
        <span class="absolute bottom-2 right-2 grid size-7 place-items-center rounded-full bg-slate-900/55 text-white transition group-hover:bg-slate-900/75">
          <LucideIcon :icon="Maximize2" class="size-3.5" />
        </span>
      </span>
    </button>

    <CardPreviewDialog v-model:open="previewOpen" kind="profile" :slug="slug" :caption="psnid" :version="version" />
  </section>
</template>
