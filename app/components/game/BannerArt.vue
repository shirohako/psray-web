<script setup lang="ts">
import type { ArtPalette } from '~/utils/color'

/**
 * The drawn banner (see `GameBanner`): a row of big face-button symbols rising
 * from the bottom edge, each drawn a different way, with small ones in the
 * gaps, painted with `palette`. The arrangement comes from `seed` (the game
 * id), so it stays put while the palette changes.
 *
 * Anchored bottom-right, so a narrow screen crops the left side, which the
 * cover overlaps anyway.
 */
const props = defineProps<{ palette: ArtPalette, seed: number }>()

const arrangement = computed(() => coverArt(props.seed))
// Pattern ids must be unique on the page, and the same on server and client.
const uid = useId()

const SHAPES = ['triangle', 'circle', 'cross', 'square'] as const
/** Where the big symbols stand on the 1200 × 128 canvas; most sink below the bottom edge. */
const SLOTS = [
  { x: 372, y: 104, r: 50 },
  { x: 500, y: 112, r: 34 },
  { x: 612, y: 96, r: 58 },
  { x: 742, y: 118, r: 44 },
  { x: 872, y: 86, r: 78 },
  { x: 1012, y: 116, r: 54 },
  { x: 1132, y: 72, r: 62 },
]
/** Small outlined symbols in the gaps above the row. */
const SPARKS = [
  { x: 300, y: 34, r: 8 },
  { x: 440, y: 22, r: 7 },
  { x: 556, y: 30, r: 8 },
  { x: 690, y: 24, r: 7 },
  { x: 806, y: 40, r: 9 },
  { x: 958, y: 22, r: 7 },
  { x: 1068, y: 30, r: 8 },
]

type Style = 'fill' | 'stripes' | 'outline' | 'accent'
const STYLES: Style[] = ['fill', 'stripes', 'outline', 'accent']

const symbols = computed(() => {
  // The shape sequence starts at the cover's main symbol; the style rotation
  // reuses another seeded pick so neighbouring games don't line up alike.
  const { big, pressed, tilt } = arrangement.value
  const first = SHAPES.indexOf(big as typeof SHAPES[number])
  return SLOTS.map((slot, index) => ({
    ...slot,
    shape: SHAPES[(first + index) % 4]!,
    style: STYLES[(pressed + index) % 4]!,
    rotate: index % 2 ? tilt : -tilt,
  }))
})
const sparks = computed(() => SPARKS.map((spark, index) => ({ ...spark, shape: SHAPES[(index + arrangement.value.pressed) % 4]! })))
</script>

<template>
  <!-- Every colour eases when the palette changes; shapes and positions stay put -->
  <svg
    viewBox="0 0 1200 128"
    preserveAspectRatio="xMaxYMax slice"
    class="[&_*]:transition-[fill,stroke] [&_*]:duration-700 [&_*]:ease-out"
    aria-hidden="true"
  >
    <defs>
      <pattern :id="`${uid}-grid`" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="8" r="1.4" :fill="palette.text" fill-opacity="0.16" />
      </pattern>
      <pattern :id="`${uid}-stripes`" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="12" height="12" :fill="palette.shape" />
        <rect width="4" height="12" :fill="palette.accent" />
      </pattern>
    </defs>

    <rect width="1200" height="128" :fill="palette.bg" />
    <rect width="1200" height="128" :fill="`url(#${uid}-grid)`" />

    <GameCoverSymbol
      v-for="(spark, index) in sparks"
      :key="`spark-${index}`"
      v-bind="spark"
      :stroke="palette.text"
      :stroke-width="2.5"
    />

    <g v-for="(symbol, index) in symbols" :key="`symbol-${index}`" :transform="`rotate(${symbol.rotate} ${symbol.x} ${symbol.y})`">
      <!-- The solid ones get an offset outline for a printed, slightly misregistered look -->
      <g v-if="symbol.style === 'fill' || symbol.style === 'accent'" transform="translate(7 7)">
        <GameCoverSymbol v-if="symbol.shape === 'cross'" shape="cross" :x="symbol.x" :y="symbol.y" :r="symbol.r" :fill="palette.text" />
        <GameCoverSymbol v-else :shape="symbol.shape" :x="symbol.x" :y="symbol.y" :r="symbol.r" :stroke="palette.text" :stroke-width="2.5" />
      </g>
      <GameCoverSymbol
        v-if="symbol.style === 'outline'"
        :shape="symbol.shape"
        :x="symbol.x"
        :y="symbol.y"
        :r="symbol.r"
        :stroke="palette.text"
        :stroke-width="5"
      />
      <GameCoverSymbol
        v-else
        :shape="symbol.shape"
        :x="symbol.x"
        :y="symbol.y"
        :r="symbol.r"
        :fill="symbol.style === 'fill' ? palette.shape : symbol.style === 'accent' ? palette.accent : `url(#${uid}-stripes)`"
      />
    </g>

    <rect y="122" width="1200" height="6" :fill="palette.band" />
  </svg>
</template>
