import type { Ref } from 'vue'

function isMobileViewport() {
  return import.meta.client && window.matchMedia('(max-width: 639.98px)').matches
}

function prefersReducedMotion() {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Phone-only fold for a long list. Until `expanded`, the list element is cut
 * to `foldedHeight` px; expanding or folding animates its height through the
 * Web Animations API. A list that isn't `collapsible`, wider screens and
 * reduced motion get the natural height, or the new one at once.
 *
 * Nothing can be measured before mount, so until `ready` the caller holds the
 * fold with a CSS max-height. Call `sync()` once the DOM has updated whenever
 * the list's rows or `foldedHeight` change, so the cut follows them.
 *
 * ```ts
 * const listEl = ref<HTMLElement | null>(null)
 * const { expanded, ready, sync } = useListFold(listEl, collapsible, foldedHeight)
 * ```
 */
export function useListFold(
  list: Readonly<Ref<HTMLElement | null>>,
  collapsible: Readonly<Ref<boolean>>,
  foldedHeight: Readonly<Ref<number>>,
) {
  const expanded = ref(false)
  const ready = ref(false)
  const animation = shallowRef<Animation | null>(null)

  function targetHeight() {
    const el = list.value
    if (!el) return foldedHeight.value
    return expanded.value || !collapsible.value
      ? el.scrollHeight
      : Math.min(foldedHeight.value, el.scrollHeight)
  }

  /** Put the list straight at the height it should have now, without animating. */
  function sync() {
    const el = list.value
    if (!el) return

    animation.value?.cancel()
    animation.value = null

    if (!collapsible.value || !isMobileViewport()) {
      el.style.height = ''
      el.style.overflow = ''
      el.style.opacity = ''
      return
    }

    el.style.overflow = 'hidden'
    el.style.height = expanded.value ? 'auto' : `${targetHeight()}px`
    el.style.opacity = ''
  }

  async function animate(isExpanded: boolean) {
    await nextTick()

    const el = list.value
    if (!el) return

    if (!ready.value || !collapsible.value || !isMobileViewport() || prefersReducedMotion()) {
      sync()
      return
    }

    // Toggled mid-animation: keep the height it has reached (cancel() alone would
    // snap back to the inline height) and carry on from there.
    const running = animation.value
    if (running) {
      running.commitStyles()
      running.cancel()
      animation.value = null
    }

    const fromHeight = el.getBoundingClientRect().height
    el.style.height = `${fromHeight}px`
    el.style.overflow = 'hidden'

    await nextTick()

    const toHeight = isExpanded ? el.scrollHeight : Math.min(foldedHeight.value, el.scrollHeight)

    // Land on the final height underneath the animation, so nothing jumps when
    // it ends and its effect is removed.
    el.style.height = `${toHeight}px`
    const current = el.animate(
      [{ height: `${fromHeight}px` }, { height: `${toHeight}px` }],
      {
        duration: isExpanded ? 1100 : 820,
        // easeOutQuart / easeInOutCubic
        easing: isExpanded ? 'cubic-bezier(0.25, 1, 0.5, 1)' : 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    )
    animation.value = current
    current.onfinish = () => {
      el.style.height = isExpanded ? 'auto' : `${toHeight}px`
      el.style.opacity = ''
      animation.value = null
    }
  }

  watch(expanded, animate)

  onMounted(async () => {
    await nextTick()
    ready.value = true
    sync()
  })

  onBeforeUnmount(() => {
    animation.value?.cancel()
  })

  return { expanded, ready, sync }
}
