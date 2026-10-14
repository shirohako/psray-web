<script setup lang="ts">
import { Gamepad2 } from 'lucide'

/**
 * A game's portrait (3:4) cover. The slot keeps its shape while the image
 * loads (skeleton) and when there is none or it fails, in which case a neutral
 * placeholder shows a controller icon. The name is always printed next to the
 * cover, so the placeholder doesn't repeat it.
 *
 * Size it from the parent with a width class; the height follows the ratio.
 */
const props = defineProps<{
  src: string | null
  alt: string
  /** Small thumbnails: a smaller icon. */
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
      class="absolute inset-0 size-full object-cover transition-opacity duration-200"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      @load="loaded = true"
      @error="failed = true"
    >
    <div v-else class="absolute inset-0 grid place-items-center text-slate-300" role="img" :aria-label="alt">
      <LucideIcon :icon="Gamepad2" :class="compact ? 'size-4' : 'size-7'" stroke-width="1.5" />
    </div>
  </div>
</template>
