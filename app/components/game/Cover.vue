<script setup lang="ts">
/**
 * A game's portrait (3:4) cover. The slot keeps its shape while the image
 * loads (skeleton). When there is none or it fails, a cover is drawn instead
 * (`GameCoverArt`, picked from `seed`) with the name set like box art, so a
 * grid of uncovered games still reads as a shelf of games.
 *
 * Size it from the parent with a width class; the height follows the ratio and
 * the drawn title scales with the width (container units).
 */
const props = defineProps<{
  src: string | null
  alt: string
  /** Picks the drawn cover; pass the game id so it is the same in every language. Defaults to `alt`. */
  seed?: number | string
  /** Language of `alt`, for the drawn title. */
  lang?: string
  /** Small thumbnails: the drawn cover without the name. */
  compact?: boolean
}>()

const loaded = ref(false)
const failed = ref(false)
const img = ref<HTMLImageElement | null>(null)

// An image served from cache can finish before hydration attaches `@load`.
function syncImageState() {
  const el = img.value
  if (!el || !el.complete) return
  if (el.naturalWidth > 0) loaded.value = true
  else failed.value = true
}

watch(() => props.src, async () => {
  loaded.value = false
  failed.value = false
  await nextTick()
  syncImageState()
})

onMounted(syncImageState)

const showImage = computed(() => Boolean(props.src) && !failed.value)
const art = computed(() => coverArt(props.seed ?? props.alt))
</script>

<template>
  <div class="relative aspect-3/4 overflow-hidden rounded-md bg-slate-100 ring-1 ring-black/5">
    <div v-if="showImage && !loaded" class="skeleton absolute inset-0" />
    <img
      v-if="showImage"
      ref="img"
      :src="src!"
      :alt="alt"
      loading="lazy"
      decoding="async"
      class="absolute inset-0 size-full object-cover transition duration-300 ease-out group-hover:scale-[1.04]"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      @load="loaded = true"
      @error="failed = true"
    >
    <div
      v-else
      class="@container absolute inset-0 overflow-hidden transition-transform duration-300 ease-out group-hover:scale-[1.04]"
      role="img"
      :aria-label="alt"
    >
      <GameCoverArt :art="art" :compact="compact" class="absolute inset-0 size-full" />
      <p
        v-if="!compact"
        class="absolute inset-x-0 top-0 line-clamp-4 px-[8cqw] pt-[17cqw] text-[11cqw] font-bold leading-[1.18] tracking-tight [overflow-wrap:anywhere]"
        :style="{ color: art.text }"
        :lang="lang"
        aria-hidden="true"
      >
        {{ alt }}
      </p>
    </div>
  </div>
</template>
