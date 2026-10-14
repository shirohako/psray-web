<script setup lang="ts">
import type { CoverArt } from '~/utils/game'

/**
 * The picture of a drawn cover (`GameCover` without cover art), on a 300 × 400
 * canvas: a dot grid, one of the {@link CoverLayout} compositions below the
 * title area (y ≳ 170), and a case-style band across the top. Flat colours
 * from the game's family only. `compact` thumbnails keep just the background
 * and the main symbol, since the detail would turn to noise at that size.
 */
const props = defineProps<{ art: CoverArt, compact?: boolean }>()

// Pattern and clip ids must be unique on the page, and the same on server and client.
const uid = useId()
const url = (name: string) => `url(#${uid}-${name})`
/** Fill of the main surface: flat, or striped / dotted with the accent. */
const paint = computed(() => props.art.texture === 'solid' ? props.art.shape : url(props.art.texture))

/** Face buttons in their places on the pad: △ top, ○ right, × bottom, □ left. */
const BUTTON_SHAPES = ['triangle', 'circle', 'cross', 'square'] as const
const PAD = { x: 165, y: 298 }
const buttons = BUTTON_SHAPES.map((shape, index) => ({
  shape,
  x: PAD.x + [0, 68, 0, -68][index]!,
  y: PAD.y + [-68, 0, 68, 0][index]!,
}))

const BAND_SYMBOLS = BUTTON_SHAPES.map((shape, index) => ({ shape, x: 230 + index * 16 }))

/** Sunburst: 18 rays of 10° fanning up from below the bottom edge; every other one is filled. */
const BURST = { x: 150, y: 420, r: 560 }
const rays = Array.from({ length: 9 }, (_, index) => {
  const point = (degrees: number) => {
    const radians = (degrees * Math.PI) / 180
    return `${BURST.x + BURST.r * Math.cos(radians)} ${BURST.y + BURST.r * Math.sin(radians)}`
  }
  const start = 180 + index * 20
  return `M${BURST.x} ${BURST.y}L${point(start)}A${BURST.r} ${BURST.r} 0 0 1 ${point(start + 10)}Z`
})

/** Planet: rings as two half-ellipses, the far half drawn behind the planet and the near half in front. */
const PLANET = { x: 175, y: 300, r: 78, rx: 142, ry: 30 }
const ringBack = `M${PLANET.x - PLANET.rx} ${PLANET.y}A${PLANET.rx} ${PLANET.ry} 0 0 1 ${PLANET.x + PLANET.rx} ${PLANET.y}`
const ringFront = `M${PLANET.x + PLANET.rx} ${PLANET.y}A${PLANET.rx} ${PLANET.ry} 0 0 1 ${PLANET.x - PLANET.rx} ${PLANET.y}`

/** Sunset: a sun half-sunk at the horizon, sliced by widening gaps, over a grid running to the viewer. */
const HORIZON = 318
const SUN = { x: 150, y: HORIZON, r: 118 }
const SUN_SLICES = [[250, 3], [269, 5], [287, 7], [304, 9]] as const
const GROUND_RAYS = [-210, -90, 30, 150, 270, 390, 510]
const GROUND_LINES = [330, 347, 372]

/** Wallpaper: a 5 × 4 grid of small symbols, odd rows shifted half a step. */
const tiles = Array.from({ length: 20 }, (_, index) => {
  const row = Math.floor(index / 5)
  const col = index % 5
  return { index, shape: BUTTON_SHAPES[(row + col) % 4]!, x: 30 + col * 60 + (row % 2) * 30, y: 200 + row * 52 }
})
</script>

<template>
  <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <pattern :id="`${uid}-grid`" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="8" r="1.4" :fill="art.text" fill-opacity="0.16" />
      </pattern>
      <pattern :id="`${uid}-stripes`" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="12" height="12" :fill="art.shape" />
        <rect width="4" height="12" :fill="art.accent" />
      </pattern>
      <pattern :id="`${uid}-dots`" width="11" height="11" patternUnits="userSpaceOnUse">
        <rect width="11" height="11" :fill="art.shape" />
        <circle cx="5.5" cy="5.5" r="2.4" :fill="art.accent" />
      </pattern>
      <clipPath :id="`${uid}-panel`">
        <rect y="172" width="300" height="228" />
      </clipPath>
      <clipPath :id="`${uid}-sun`">
        <circle :cx="SUN.x" :cy="SUN.y" :r="SUN.r" />
      </clipPath>
    </defs>

    <rect width="300" height="400" :fill="art.bg" />

    <!-- Thumbnails: the main symbol alone -->
    <g v-if="compact" :transform="`rotate(${art.tilt} 218 318)`">
      <GameCoverSymbol :shape="art.big" :x="218" :y="318" :r="138" :fill="art.shape" />
    </g>

    <template v-else>
      <rect width="300" height="400" :fill="url('grid')" />

      <!-- One big textured symbol with an offset outline -->
      <template v-if="art.layout === 'hero'">
        <g :transform="`rotate(${art.tilt} 218 318)`">
          <g transform="translate(14 14)">
            <template v-if="art.big === 'cross'">
              <GameCoverSymbol shape="cross" :x="218" :y="318" :r="138" :fill="art.text" />
              <GameCoverSymbol shape="cross" :x="218" :y="318" :r="128" :fill="art.bg" />
            </template>
            <GameCoverSymbol v-else :shape="art.big" :x="218" :y="318" :r="138" :stroke="art.text" />
          </g>
          <GameCoverSymbol :shape="art.big" :x="218" :y="318" :r="138" :fill="paint" />
        </g>
        <GameCoverSymbol v-for="(item, index) in art.sprinkles" :key="index" v-bind="item" :stroke="art.text" :stroke-width="3.5" />
      </template>

      <!-- A ringed planet on a dashed orbit, a symbol for its moon -->
      <template v-else-if="art.layout === 'planet'">
        <circle :cx="PLANET.x" :cy="PLANET.y" r="128" fill="none" :stroke="art.text" stroke-width="1.5" stroke-dasharray="3 7" />
        <g :transform="`rotate(${-18 + art.tilt / 2} ${PLANET.x} ${PLANET.y})`">
          <path :d="ringBack" fill="none" :stroke="art.band" stroke-width="10" />
          <path :d="ringBack" fill="none" :stroke="art.text" stroke-width="1.5" />
          <circle :cx="PLANET.x + 8" :cy="PLANET.y + 8" :r="PLANET.r" fill="none" :stroke="art.text" stroke-width="2.5" />
          <circle :cx="PLANET.x" :cy="PLANET.y" :r="PLANET.r" :fill="paint" />
          <path :d="ringFront" fill="none" :stroke="art.band" stroke-width="10" />
          <path :d="ringFront" fill="none" :stroke="art.text" stroke-width="1.5" />
        </g>
        <GameCoverSymbol :shape="art.sprinkles[0]!.shape" :x="64" :y="236" :r="17" :fill="art.accent" />
        <GameCoverSymbol :shape="art.sprinkles[0]!.shape" :x="64" :y="236" :r="17" :stroke="art.text" :stroke-width="2.5" />
        <GameCoverSymbol
          v-for="(item, index) in art.sprinkles.slice(1)"
          :key="index"
          shape="cross"
          :x="item.x"
          :y="item.y > 300 ? item.y : 186 + (item.y % 40)"
          :r="6"
          :stroke="art.text"
          :stroke-width="2.5"
        />
      </template>

      <!-- The four face buttons as raised discs on a round pad, one pressed -->
      <g v-else-if="art.layout === 'buttons'" :transform="`rotate(${art.tilt} ${PAD.x} ${PAD.y})`">
        <circle :cx="PAD.x" :cy="PAD.y" r="126" :fill="art.band" />
        <circle :cx="PAD.x" :cy="PAD.y" r="126" fill="none" :stroke="art.text" stroke-width="2" stroke-dasharray="2 6" />
        <g v-for="(button, index) in buttons" :key="button.shape">
          <circle :cx="button.x + 4" :cy="button.y + 6" r="36" :fill="art.text" />
          <g :transform="index === art.pressed ? 'translate(3 4)' : undefined">
            <circle
              :cx="button.x"
              :cy="button.y"
              r="36"
              :fill="index === art.pressed ? art.accent : art.bg"
              :stroke="art.text"
              stroke-width="2.5"
            />
            <GameCoverSymbol :shape="button.shape" :x="button.x" :y="button.y + (button.shape === 'triangle' ? 3 : 0)" :r="17" :stroke="art.text" :stroke-width="4.5" />
          </g>
        </g>
      </g>

      <!-- Rays fanning up from the bottom edge, a big symbol at their source -->
      <template v-else-if="art.layout === 'burst'">
        <g :clip-path="url('panel')">
          <path v-for="(d, index) in rays" :key="index" :d="d" :fill="art.shape" />
        </g>
        <line x1="0" y1="172" x2="300" y2="172" :stroke="art.text" stroke-width="2.5" />
        <g :transform="`rotate(${art.tilt} 150 338)`">
          <circle cx="150" cy="338" r="92" :fill="art.bg" :stroke="art.text" stroke-width="2.5" />
          <GameCoverSymbol :shape="art.big" :x="158" :y="346" :r="64" :stroke="art.text" :fill="art.big === 'cross' ? art.text : undefined" />
          <GameCoverSymbol :shape="art.big" :x="150" :y="338" :r="64" :fill="art.accent" />
        </g>
      </template>

      <!-- A sliced sun sinking at the horizon, a grid running to the viewer -->
      <template v-else-if="art.layout === 'sunset'">
        <GameCoverSymbol
          v-for="(item, index) in art.sprinkles"
          :key="index"
          :shape="item.shape"
          :x="item.x"
          :y="186 + (item.y % 50)"
          :r="item.r * 0.6"
          :stroke="art.text"
          :stroke-width="2.5"
        />
        <circle :cx="SUN.x" :cy="SUN.y" :r="SUN.r" :fill="paint" />
        <g :clip-path="url('sun')">
          <rect v-for="([y, height], index) in SUN_SLICES" :key="index" x="0" :y="y" width="300" :height="height" :fill="art.bg" />
        </g>
        <rect x="0" :y="HORIZON" width="300" :height="400 - HORIZON" :fill="art.band" />
        <line
          v-for="x in GROUND_RAYS"
          :key="`ray-${x}`"
          :x1="SUN.x"
          :y1="HORIZON"
          :x2="x"
          y2="400"
          :stroke="art.text"
          stroke-width="1.5"
        />
        <line
          v-for="y in GROUND_LINES"
          :key="`line-${y}`"
          x1="0"
          :y1="y"
          x2="300"
          :y2="y"
          :stroke="art.text"
          stroke-width="1.5"
        />
        <line x1="0" :y1="HORIZON" x2="300" :y2="HORIZON" :stroke="art.text" stroke-width="2.5" />
      </template>

      <!-- A wallpaper of small symbols over a big one, two of them lit -->
      <template v-else>
        <g :transform="`rotate(${art.tilt} 205 318)`">
          <GameCoverSymbol :shape="art.big" :x="205" :y="318" :r="125" :fill="paint" />
        </g>
        <template v-for="tile in tiles" :key="tile.index">
          <template v-if="art.highlights.includes(tile.index)">
            <circle :cx="tile.x" :cy="tile.y" r="21" :fill="art.accent" :stroke="art.text" stroke-width="2.5" />
            <GameCoverSymbol :shape="tile.shape" :x="tile.x" :y="tile.y" :r="10" :stroke="art.text" :stroke-width="3.5" />
          </template>
          <GameCoverSymbol v-else :shape="tile.shape" :x="tile.x" :y="tile.y" :r="11" :stroke="art.text" :stroke-width="3" />
        </template>
      </template>

      <!-- Case-style band across the top -->
      <rect width="300" height="30" :fill="art.band" />
      <GameCoverSymbol
        v-for="symbol in BAND_SYMBOLS"
        :key="symbol.shape"
        :shape="symbol.shape"
        :x="symbol.x"
        :y="15"
        :r="5.5"
        :stroke="art.text"
        :stroke-width="2"
      />
    </template>
  </svg>
</template>
