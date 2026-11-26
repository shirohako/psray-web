<script setup lang="ts">
import type { CropBounds, CropState } from '~/utils/media'
import { cropRect, panCrop, zoomCrop } from '~/utils/media'

/**
 * The interactive part of the crop dialog: a fixed frame in the middle, the
 * picture moving underneath. Drag (mouse, pen or one finger) to move it;
 * wheel or pinch to zoom around the pointer; arrow keys and + / − work when
 * the stage has focus. The state is in source pixels (see utils/media.ts),
 * so it survives the stage being resized.
 */
const props = defineProps<{
  src: string
  bounds: CropBounds
  /** `rounded` draws the frame with the profile avatar's rounded corners. */
  shape?: 'rect' | 'rounded'
  label: string
  disabled?: boolean
}>()

const state = defineModel<CropState>({ required: true })

const stage = ref<HTMLElement | null>(null)
const size = reactive({ width: 0, height: 0 })
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!stage.value) return
  observer = new ResizeObserver(([entry]) => {
    if (!entry) return
    size.width = entry.contentRect.width
    size.height = entry.contentRect.height
  })
  observer.observe(stage.value)
})
onBeforeUnmount(() => observer?.disconnect())

/** The crop frame on screen, inset from the stage edges. */
const frame = computed(() => {
  const pad = size.width < 480 ? 16 : 28
  const maxWidth = Math.max(0, size.width - pad * 2)
  const maxHeight = Math.max(0, size.height - pad * 2)
  const width = Math.min(maxWidth, maxHeight * props.bounds.ratio)
  const height = width / props.bounds.ratio
  return { left: (size.width - width) / 2, top: (size.height - height) / 2, width, height }
})

const rect = computed(() => cropRect(state.value, props.bounds))
/** Screen pixels per source pixel. */
const scale = computed(() => (rect.value.width > 0 ? frame.value.width / rect.value.width : 0))

// Sized in screen pixels rather than scaled with a transform, so the browser
// draws it sharp at every zoom.
const imageStyle = computed(() => ({
  width: `${props.bounds.imageWidth * scale.value}px`,
  height: `${props.bounds.imageHeight * scale.value}px`,
  transform: `translate(${frame.value.left - rect.value.x * scale.value}px, ${frame.value.top - rect.value.y * scale.value}px)`,
}))

const frameStyle = computed(() => ({
  left: `${frame.value.left}px`,
  top: `${frame.value.top}px`,
  width: `${frame.value.width}px`,
  height: `${frame.value.height}px`,
  // Same corner as the 112 px profile avatar (rounded-xl inside a 4 px border).
  borderRadius: props.shape === 'rounded' ? `${frame.value.width * 0.11}px` : '2px',
}))

/** A point on the stage (CSS px from its top-left) in source pixels. */
function toSource(px: number, py: number) {
  return {
    x: rect.value.x + (px - frame.value.left) / scale.value,
    y: rect.value.y + (py - frame.value.top) / scale.value,
  }
}

function pointOf(event: { clientX: number, clientY: number }) {
  const box = stage.value!.getBoundingClientRect()
  return { x: event.clientX - box.left, y: event.clientY - box.top }
}

// ── Pointer: drag to move, two fingers to pinch ─────────────────────────────
const pointers = new Map<number, { x: number, y: number }>()
const dragging = ref(false)

function onPointerDown(event: PointerEvent) {
  if (props.disabled || (event.pointerType === 'mouse' && event.button !== 0)) return
  stage.value?.setPointerCapture(event.pointerId)
  pointers.set(event.pointerId, pointOf(event))
  dragging.value = true
}

function onPointerMove(event: PointerEvent) {
  const previous = pointers.get(event.pointerId)
  if (!previous || props.disabled) return
  const before = [...pointers.values()]
  const point = pointOf(event)
  pointers.set(event.pointerId, point)

  if (pointers.size === 1) {
    state.value = panCrop(state.value, props.bounds, -(point.x - previous.x) / scale.value, -(point.y - previous.y) / scale.value)
    return
  }
  if (before.length < 2) return
  const after = [...pointers.values()]
  const [a0, b0] = before as [typeof point, typeof point]
  const [a1, b1] = after as [typeof point, typeof point]
  const distance0 = Math.hypot(a0.x - b0.x, a0.y - b0.y)
  const distance1 = Math.hypot(a1.x - b1.x, a1.y - b1.y)
  if (distance0 < 1) return
  const mid0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 }
  const mid1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 }
  // Zoom around where the fingers were, then follow them as they move.
  const zoomed = zoomCrop(state.value, props.bounds, state.value.zoom * (distance1 / distance0), toSource(mid0.x, mid0.y))
  const nextScale = frame.value.width / cropRect(zoomed, props.bounds).width
  state.value = panCrop(zoomed, props.bounds, -(mid1.x - mid0.x) / nextScale, -(mid1.y - mid0.y) / nextScale)
}

function onPointerUp(event: PointerEvent) {
  pointers.delete(event.pointerId)
  if (pointers.size === 0) dragging.value = false
}

// ── Wheel and keyboard ─────────────────────────────────────────────────────
function onWheel(event: WheelEvent) {
  if (props.disabled) return
  event.preventDefault()
  const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
  const point = pointOf(event)
  state.value = zoomCrop(state.value, props.bounds, state.value.zoom * Math.exp(-delta * 0.0015), toSource(point.x, point.y))
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return
  const step = (event.shiftKey ? 60 : 12) / scale.value
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  }
  const move = moves[event.key]
  if (move) {
    // Arrow keys move the picture, so the crop goes the other way.
    state.value = panCrop(state.value, props.bounds, -move[0], -move[1])
  }
  else if (event.key === '+' || event.key === '=') {
    state.value = zoomCrop(state.value, props.bounds, state.value.zoom * 1.1)
  }
  else if (event.key === '-' || event.key === '_') {
    state.value = zoomCrop(state.value, props.bounds, state.value.zoom / 1.1)
  }
  else {
    return
  }
  event.preventDefault()
}
</script>

<template>
  <div
    ref="stage"
    role="group"
    tabindex="0"
    :aria-label="label"
    class="relative touch-none select-none overflow-hidden rounded-lg bg-slate-900 outline-none ring-sky-400/70 ring-offset-2 focus-visible:ring-2"
    :class="disabled ? 'cursor-default' : dragging ? 'cursor-grabbing' : 'cursor-grab'"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @lostpointercapture="onPointerUp"
    @wheel="onWheel"
    @keydown="onKeydown"
  >
    <img
      v-if="scale > 0"
      :src="src"
      alt=""
      draggable="false"
      class="pointer-events-none absolute left-0 top-0 max-w-none"
      :style="imageStyle"
    />

    <!-- The frame. Its huge shadow dims everything outside the crop. -->
    <div
      v-if="frame.width > 0"
      aria-hidden="true"
      class="pointer-events-none absolute shadow-[0_0_0_9999px_rgb(15_23_42/0.62)] ring-1 ring-white/90"
      :style="frameStyle"
    >
      <!-- Thirds, only while moving -->
      <div
        class="absolute inset-0 transition-opacity duration-200 motion-reduce:transition-none"
        :class="dragging ? 'opacity-100' : 'opacity-0'"
      >
        <span class="absolute inset-y-0 left-1/3 w-px bg-white/35" />
        <span class="absolute inset-y-0 left-2/3 w-px bg-white/35" />
        <span class="absolute inset-x-0 top-1/3 h-px bg-white/35" />
        <span class="absolute inset-x-0 top-2/3 h-px bg-white/35" />
      </div>
      <!-- Corner marks -->
      <template v-if="shape !== 'rounded'">
        <span class="absolute -left-0.5 -top-0.5 size-3.5 border-l-[3px] border-t-[3px] border-white" />
        <span class="absolute -right-0.5 -top-0.5 size-3.5 border-r-[3px] border-t-[3px] border-white" />
        <span class="absolute -bottom-0.5 -left-0.5 size-3.5 border-b-[3px] border-l-[3px] border-white" />
        <span class="absolute -bottom-0.5 -right-0.5 size-3.5 border-b-[3px] border-r-[3px] border-white" />
      </template>
    </div>
  </div>
</template>
