import type { MaybeRefOrGetter } from 'vue'

interface AnimatedNumberOptions {
  /** Tween length in ms; `0` jumps straight to the target. */
  duration?: MaybeRefOrGetter<number>
  /** Where the first tween starts when `animateInitial` is on. */
  from?: number
  /** Count up from `from` on mount instead of starting at the target. */
  animateInitial?: boolean
}

function normalized(value: number | null | undefined) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/**
 * A number that eases (ease-out cubic) toward `source` whenever it changes.
 * The value is unrounded so it can drive geometry as well as text; format or
 * round it at the call site.
 *
 * With `animateInitial`, SSR renders `from` and the client counts up after
 * hydration, so server and client markup agree. Reduced-motion users get the
 * target immediately.
 */
export function useAnimatedNumber(
  source: MaybeRefOrGetter<number | null | undefined>,
  options: AnimatedNumberOptions = {},
) {
  const { duration = 700, from = 0, animateInitial = true } = options
  const target = computed(() => normalized(toValue(source)))
  const current = ref(animateInitial ? normalized(from) : target.value)
  let frame: number | null = null

  function cancel() {
    if (frame == null) return
    cancelAnimationFrame(frame)
    frame = null
  }

  function animateTo(to: number) {
    cancel()
    if (!import.meta.client) return

    const start = current.value
    const length = Math.max(0, toValue(duration))
    if (length === 0 || start === to || prefersReducedMotion()) {
      current.value = to
      return
    }

    const startedAt = performance.now()
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - startedAt) / length)
      current.value = ratio < 1 ? start + (to - start) * easeOutCubic(ratio) : to
      frame = ratio < 1 ? requestAnimationFrame(tick) : null
    }
    frame = requestAnimationFrame(tick)
  }

  watch(target, animateTo, { immediate: true })
  onBeforeUnmount(cancel)

  return readonly(current)
}
