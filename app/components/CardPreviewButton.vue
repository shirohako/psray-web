<script setup lang="ts">
import { Image } from 'lucide'
import type { ShareCardKind } from '~/utils/shareCard'

/**
 * The banner's share-card button: opens the card in `CardPreviewDialog`.
 */
defineProps<{
  /** Card route under `/card/`. */
  kind: ShareCardKind
  /** Card identifier: a lowercased PSN ID, or a trophy set id. */
  slug: string | number
  /** Name shown in the dialog header and the image's alt text. */
  caption: string
}>()
const open = ref(false)
</script>

<template>
  <button
    type="button"
    :title="$t('card.title')"
    :aria-label="$t('card.title')"
    class="inline-flex size-8 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-white/25"
    @click="open = true"
  >
    <LucideIcon :icon="Image" class="size-4" />
  </button>

  <CardPreviewDialog v-model:open="open" :kind="kind" :slug="slug" :caption="caption" />
</template>
