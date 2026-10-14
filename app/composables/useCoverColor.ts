import type { MaybeRefOrGetter } from 'vue'

/**
 * Colours already read, by image URL, for the life of the tab: going back to a
 * game shows its colours at once. `null` marks an image whose pixels could not
 * be read (no cross-origin access).
 */
const cache = new Map<string, string | null>()

/** Downscaled sample: plenty to find a hue, cheap to scan. */
const SAMPLE = 32

function readColor(image: HTMLImageElement): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE
  canvas.height = SAMPLE
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(image, 0, 0, SAMPLE, SAMPLE)
  // Throws when the host doesn't allow cross-origin reads (a tainted canvas).
  return dominantColor(context.getImageData(0, 0, SAMPLE, SAMPLE).data)
}

/**
 * The colour a cover image reads as (see `dominantColor`), worked out in the
 * browser: `null` on the server, until the image has loaded, and when its host
 * doesn't allow cross-origin reads. The cover is usually on screen already, so
 * the request is normally answered from the browser cache.
 *
 * Starts after mount so the first client render matches the server's.
 */
export function useCoverColor(src: MaybeRefOrGetter<string | null | undefined>) {
  const color = ref<string | null>(null)

  function load(url: string | null | undefined) {
    color.value = null
    if (!url) return
    if (cache.has(url)) {
      color.value = cache.get(url)!
      return
    }
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => {
      let value: string | null = null
      try {
        value = readColor(image)
      }
      catch {
        value = null
      }
      cache.set(url, value)
      if (toValue(src) === url) color.value = value
    }
    // A failed load isn't cached: a network hiccup shouldn't grey the banner for the rest of the visit.
    image.src = url
  }

  onMounted(() => {
    load(toValue(src))
    watch(() => toValue(src), load)
  })

  return color
}
