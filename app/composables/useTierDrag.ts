import type { TierItem } from '~/utils/tierList'

/**
 * Pointer-driven drag and drop for the tier list maker. One implementation for
 * mouse, pen and touch (native HTML5 drag and drop does nothing on phones).
 *
 * - Mouse and pen start dragging after the pointer moves a few pixels, so a
 *   plain click still opens the item's menu.
 * - Touch starts on a long press, so a swipe over the board still scrolls the
 *   page. Once a drag is on, `touchmove` is cancelled to keep the page still.
 *
 * Drop zones are elements with `data-tier-zone="<row id | pool>"`; their tiles
 * carry `data-tier-item="<item id>"`. Rows being reordered are
 * `data-tier-row="<row id>"` inside `data-tier-rows`. The drop index never
 * counts the dragged tile itself, which is what `moveItem` expects.
 */

export type TierDragPayload =
  | { kind: 'item', itemId: string }
  /** From the search results or the image library: may or may not be in the list yet. */
  | { kind: 'new', item: TierItem }
  | { kind: 'row', rowId: string }

export interface TierDragPreview {
  src: string | null
  color: string | null
  /** Rows: the label drawn in the row's colour. */
  label?: string
}

export interface TierZoneTarget {
  zone: string
  index: number
}

const LONG_PRESS_MS = 260
const TOUCH_SLOP = 10
const MOUSE_SLOP = 5
const EDGE = 72
const TOP_BAR = 64
const MAX_SCROLL_STEP = 18

export function useTierDrag(onDrop: (payload: TierDragPayload, target: { zone: TierZoneTarget | null, row: number | null }) => void) {
  const state = reactive({
    active: false,
    payload: null as TierDragPayload | null,
    preview: null as TierDragPreview | null,
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
    width: 0,
    height: 0,
    zone: null as TierZoneTarget | null,
    row: null as number | null,
  })

  /** The list item that is being moved, so zones can leave it out. */
  const draggedItemId = computed(() => {
    const payload = state.payload
    if (!state.active || !payload) return null
    return payload.kind === 'item' ? payload.itemId : payload.kind === 'new' ? payload.item.id : null
  })
  const draggedRowId = computed(() => (state.active && state.payload?.kind === 'row' ? state.payload.rowId : null))

  let pending: {
    payload: TierDragPayload
    preview: TierDragPreview
    pointerId: number
    startX: number
    startY: number
    rect: DOMRect
    touch: boolean
    timer: number
  } | null = null
  let frame = 0

  /**
   * Call from `pointerdown`. `immediate` is for drag handles (`touch-action:
   * none`): touch then starts on movement like a mouse, without the long press.
   */
  function start(event: PointerEvent, payload: TierDragPayload, element: HTMLElement, preview: TierDragPreview, immediate = false) {
    if (state.active || pending || (event.pointerType === 'mouse' && event.button !== 0)) return
    const touch = event.pointerType === 'touch' && !immediate
    pending = {
      payload,
      preview,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      rect: element.getBoundingClientRect(),
      touch,
      timer: touch ? window.setTimeout(() => activate(state.x, state.y), LONG_PRESS_MS) : 0,
    }
    state.x = event.clientX
    state.y = event.clientY
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('contextmenu', onContextMenu)
  }

  function activate(x: number, y: number) {
    if (!pending) return
    const { rect, payload, preview } = pending
    state.payload = payload
    state.preview = preview
    state.offsetX = Math.min(Math.max(pending.startX - rect.left, 0), rect.width)
    state.offsetY = Math.min(Math.max(pending.startY - rect.top, 0), rect.height)
    state.width = rect.width
    state.height = rect.height
    if (payload.kind === 'row') {
      // A whole row would cover the board; carry a label-sized chip instead.
      state.width = Math.min(rect.width, 200)
      state.height = 44
      state.offsetX = 20
      state.offsetY = 22
    }
    state.x = x
    state.y = y
    state.active = true
    if (pending.touch) navigator.vibrate?.(8)
    // The tile under the pointer must not keep focus (and its menu) once it is being dragged.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    document.documentElement.classList.add('tier-dragging')
    nextTick(retarget)
    frame = requestAnimationFrame(autoScroll)
  }

  function onMove(event: PointerEvent) {
    if (!pending || event.pointerId !== pending.pointerId) return
    state.x = event.clientX
    state.y = event.clientY
    if (!state.active) {
      const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY)
      if (pending.touch) {
        // Moved before the long press fired: it's a scroll, not a drag.
        if (distance > TOUCH_SLOP) finish()
      }
      else if (distance > MOUSE_SLOP) {
        activate(event.clientX, event.clientY)
      }
      return
    }
    retarget()
  }

  function onUp(event: PointerEvent) {
    if (!pending || event.pointerId !== pending.pointerId) return
    if (state.active) {
      const payload = state.payload!
      const target = { zone: state.zone, row: state.row }
      suppressNextClick()
      finish()
      onDrop(payload, target)
      return
    }
    finish()
  }

  function onCancel(event: PointerEvent) {
    if (pending && event.pointerId === pending.pointerId) finish()
  }

  function onTouchMove(event: TouchEvent) {
    if (state.active && event.cancelable) event.preventDefault()
  }

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') finish()
  }

  function onContextMenu(event: Event) {
    if (state.active || pending?.touch) event.preventDefault()
  }

  /** The click that ends a drag must not open the menu of the tile under it. */
  function suppressNextClick() {
    const stop = (event: Event) => {
      event.stopPropagation()
      event.preventDefault()
    }
    window.addEventListener('click', stop, { capture: true, once: true })
    window.setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0)
  }

  function retarget() {
    if (!state.active || !state.payload) return
    if (state.payload.kind === 'row') {
      state.row = rowIndexAt(state.y)
      return
    }
    state.zone = zoneAt(state.x, state.y)
  }

  function zoneAt(x: number, y: number): TierZoneTarget | null {
    const zoneEl = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-tier-zone]')
    const zone = zoneEl?.dataset.tierZone
    if (!zoneEl || !zone) return null
    let index = 0
    for (const tile of zoneEl.querySelectorAll<HTMLElement>('[data-tier-item]')) {
      if (tile.dataset.tierItem === draggedItemId.value) continue
      const rect = tile.getBoundingClientRect()
      // Reading order: lines above the pointer, then tiles left of it on its line.
      if (y > rect.bottom || (y >= rect.top && x > rect.left + rect.width / 2)) index++
    }
    return { zone, index }
  }

  function rowIndexAt(y: number): number | null {
    const container = document.querySelector<HTMLElement>('[data-tier-rows]')
    if (!container) return null
    let index = 0
    for (const row of container.querySelectorAll<HTMLElement>('[data-tier-row]')) {
      if (row.dataset.tierRow === draggedRowId.value) continue
      const rect = row.getBoundingClientRect()
      if (y > rect.top + rect.height / 2) index++
    }
    return index
  }

  /** Scrolls the page while the pointer rests near the top or bottom edge. */
  function autoScroll() {
    if (!state.active) return
    const top = TOP_BAR + EDGE
    const bottom = window.innerHeight - EDGE
    let step = 0
    if (state.y < top) step = -MAX_SCROLL_STEP * Math.min(1, (top - state.y) / EDGE)
    else if (state.y > bottom) step = MAX_SCROLL_STEP * Math.min(1, (state.y - bottom) / EDGE)
    if (step) {
      window.scrollBy(0, step)
      retarget()
    }
    frame = requestAnimationFrame(autoScroll)
  }

  function finish() {
    if (pending?.timer) window.clearTimeout(pending.timer)
    pending = null
    cancelAnimationFrame(frame)
    state.active = false
    state.payload = null
    state.preview = null
    state.zone = null
    state.row = null
    document.documentElement.classList.remove('tier-dragging')
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('contextmenu', onContextMenu)
  }

  onBeforeUnmount(finish)

  return { state, draggedItemId, draggedRowId, start, cancel: finish }
}

export type TierDrag = ReturnType<typeof useTierDrag>
