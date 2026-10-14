<script setup lang="ts">
import type { ArtPalette } from '~/utils/color'

/**
 * The landscape banner at the top of the game page. Shows `src` when the API
 * has banner art; otherwise (or if it fails to load) draws one
 * (`GameBannerArt`) in colours that go with the cover:
 *
 * - drawn cover: the same colour family as the cover;
 * - real cover: a pastel in the cover's own hue — from `coverColor` when the
 *   API sends it (right from the server render), else read from the image in
 *   the browser. Until then, and when it can't be read, a warm sand palette.
 *
 * Whenever the palette changes (sand → the cover's hue, or on to another
 * game) the colours ease across instead of switching.
 *
 * Height comes from the parent.
 */
const props = defineProps<{
  src: string | null
  /** The game id: picks the arrangement, and the colours of a drawn cover. */
  seed: number
  cover: string | null
  /** The cover's dominant colour (`#rrggbb`) if the API provides it. */
  coverColor?: string | null
}>()

const failed = ref(false)
watch(() => props.src, () => { failed.value = false })

/** Warm sand (the palette Elden Ring's cover gives): shown until a cover's own colour is known. */
const SAND: ArtPalette = { bg: '#f6ebdd', shape: '#e1c6a2', accent: '#caa778', band: '#d3b58d', text: '#4e3818' }

// Only read the image when there is a cover and the API didn't give its colour.
const readColor = useCoverColor(() => (props.cover && !props.coverColor ? props.cover : null))

const palette = computed<ArtPalette>(() => {
  if (!props.cover) {
    const { bg, shape, accent, band, text } = coverArt(props.seed)
    return { bg, shape, accent, band, text }
  }
  const color = props.coverColor ?? readColor.value
  return (color && paletteFromColor(color)) || SAND
})
</script>

<template>
  <div class="relative overflow-hidden transition-colors duration-700 ease-out" :style="{ backgroundColor: palette.bg }" aria-hidden="true">
    <img
      v-if="src && !failed"
      :src="src"
      alt=""
      class="absolute inset-0 size-full object-cover"
      @error="failed = true"
    >
    <GameBannerArt v-else :palette="palette" :seed="seed" class="absolute inset-0 size-full" />
  </div>
</template>
