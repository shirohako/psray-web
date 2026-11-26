/**
 * Reorder one list by dragging its items, with mouse, pen or touch alike (the
 * native HTML5 drag and drop does nothing on phones).
 *
 * Items are elements carrying `data-sort-index="<index>"` inside `container`.
 * While dragging, the item under the pointer trades places live, so the list
 * itself is the preview (wrap it in a `<TransitionGroup>` for the slide).
 *
 * - Mouse and pen start after the pointer moves a few pixels, so a plain click
 *   on the same element still clicks.
 * - Touch starts on a long press, so a swipe over the list still scrolls the
 *   page; once a drag is on, `touchmove` is cancelled to keep the page still.
 *   A dedicated handle (`longPress: false`, with `touch-action: none` on it)
 *   starts at once instead: it has nothing else to do with a touch.
 * - Arrow keys on the handle move the item one step (`onKeydown`).
 *
 * `axis: 'y'` is for a vertical list of rows that may differ in height: an
 * item only trades places once the pointer is past the middle of its
 * neighbour, so a tall row doesn't flip back and forth. `'grid'` is for tiles
 * of one size, which can trade places as soon as the pointer reaches them.
 */
const LONG_PRESS_MS = 260
const TOUCH_SLOP = 10
const MOUSE_SLOP = 4

export function useSortDrag(options: {
  container: Ref<HTMLElement | null>
  /** Move the item at `from` to `to`; the caller owns the list. */
  move: (from: number, to: number) => void
  axis?: 'y' | 'grid'
  /** Wait for a long press before a touch drags. Turn off for dedicated handles. */
  longPress?: boolean
}) {
  const axis = options.axis ?? 'y'
  const longPress = options.longPress ?? true
  /** Index of the item being dragged, or `null`. */
  const dragging = ref<number | null>(null)

  let pointerId: number | null = null
  let startX = 0
  let startY = 0
  let current = -1
  let pressTimer: ReturnType<typeof setTimeout> | null = null
  /** Set when a drag ended over the item, so the click that follows is ignored. */
  let suppressClick = false

  function itemAt(x: number, y: number): HTMLElement | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-sort-index]') ?? null
    return el && options.container.value?.contains(el) ? el : null
  }

  function begin() {
    dragging.value = current
    document.documentElement.classList.add('cursor-grabbing', 'select-none')
  }

  function onMove(event: PointerEvent) {
    if (event.pointerId !== pointerId) return
    if (dragging.value === null) {
      const distance = Math.hypot(event.clientX - startX, event.clientY - startY)
      if (event.pointerType === 'touch' && longPress) {
        // Moved before the long press: it's a scroll, not a drag.
        if (distance > TOUCH_SLOP) end()
        return
      }
      if (distance < MOUSE_SLOP) return
      begin()
    }

    const target = itemAt(event.clientX, event.clientY)
    if (!target) return
    const to = Number(target.dataset.sortIndex)
    if (!Number.isInteger(to) || to === current) return
    if (axis === 'y') {
      const rect = target.getBoundingClientRect()
      const middle = rect.top + rect.height / 2
      if ((to > current && event.clientY < middle) || (to < current && event.clientY > middle)) return
    }
    options.move(current, to)
    current = to
    dragging.value = to
  }

  function onTouchMove(event: TouchEvent) {
    if (dragging.value !== null) event.preventDefault()
  }

  function onUp(event: PointerEvent) {
    if (event.pointerId !== pointerId) return
    if (dragging.value !== null) suppressClick = true
    end()
  }

  function end() {
    if (pressTimer) clearTimeout(pressTimer)
    pressTimer = null
    pointerId = null
    dragging.value = null
    document.documentElement.classList.remove('cursor-grabbing', 'select-none')
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', end)
    window.removeEventListener('touchmove', onTouchMove)
  }

  /** Bind to `@pointerdown` on the drag handle (or the whole item). */
  function onPointerDown(event: PointerEvent, index: number) {
    if (event.button !== 0 || pointerId !== null) return
    pointerId = event.pointerId
    startX = event.clientX
    startY = event.clientY
    current = index
    suppressClick = false
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', end)
    if (event.pointerType === 'touch') window.addEventListener('touchmove', onTouchMove, { passive: false })
    if (event.pointerType === 'touch' && longPress) {
      pressTimer = setTimeout(() => {
        pressTimer = null
        begin()
        navigator.vibrate?.(10)
      }, LONG_PRESS_MS)
    }
  }

  /** Bind to `@keydown` on the handle: arrow keys move the item one step. */
  function onKeydown(event: KeyboardEvent, index: number, length: number) {
    const step = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
      ? -1
      : event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : 0
    if (!step) return
    event.preventDefault()
    const to = index + step
    if (to >= 0 && to < length) options.move(index, to)
  }

  /**
   * Bind to `@click.capture` on an item whose click does something else (open,
   * remove): swallows the click a mouse drag ends with.
   */
  function onClickCapture(event: MouseEvent) {
    if (!suppressClick) return
    suppressClick = false
    event.stopPropagation()
    event.preventDefault()
  }

  onBeforeUnmount(end)

  return { dragging, onPointerDown, onKeydown, onClickCapture }
}
