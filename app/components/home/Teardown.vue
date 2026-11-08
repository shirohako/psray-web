<script lang="ts">
import drawingUrl from '~/assets/teardown/handheld.svg?url'
import placeholder from '~/assets/teardown/handheld-placeholder.svg?raw'
import motion from '~/assets/teardown/handheld.json'
import { apartAt, teardownPose, type TeardownTimeline } from '~/utils/teardownMotion'

/*
 * The home page's handheld console teardown, on a loop. scripts/generate-teardown.mjs
 * draws it with the teardown skill's renderer: one layer per part, every
 * colour scheme, and where each part goes and when (handheld.json). This
 * component picks a scheme (useTeardownPalette, shared with the hero copy),
 * moves the layers and shows the callouts.
 *
 * Loading: SSR inlines a 2 KB silhouette of the assembled console. The
 * drawing (~24 KB brotli, hashed and cached) is fetched after hydration and
 * fades in over it at the same place, so nothing shifts.
 */

interface PartMotion {
  to: number[]
  slide?: number[]
  lift: number[]
  drop: number
}
interface Callout {
  id: string
  name: string
  dot: number[]
  elbow: number[]
  end: number[]
  /** 1 the tag reads rightward from `end`, -1 leftward, 0 it hangs centred below. */
  side: number
}
const timeline = motion.timeline as TeardownTimeline
const parts = motion.parts as Record<string, PartMotion>
const callouts = motion.labels as Callout[]
const [bx, by, bw, bh] = motion.viewBox as [number, number, number, number]
/** Hold on the assembled console this long the first time it comes into view. */
const FIRST_HOLD = 900
const SHADOW = 0.08

let pending: Promise<string | null> | undefined
/** Fetches the drawing once per page load; a failure is retried next time. */
function loadDrawing() {
  pending ??= fetch(drawingUrl)
    .then(r => (r.ok ? r.text() : null))
    .catch(() => null)
    .then((markup) => {
      if (!markup) pending = undefined
      return markup
    })
  return pending
}

const percent = (n: number) => `${(n * 100).toFixed(2)}%`
const ALIGN: Record<number, string> = { 1: 'translate(0,-50%)', [-1]: 'translate(-100%,-50%)', 0: 'translate(-50%,0)' }
const { font, padX, padY, width } = motion.tag
/**
 * Tags are sized with the drawing (the layout is drawn for `width` px),
 * but never below 6 px, which the layout leaves them room for, nor above 10 px.
 */
const tagStyle = {
  fontSize: `clamp(6px, ${((font / width) * 100).toFixed(3)}cqw, 10px)`,
  padding: `${(padY / font).toFixed(3)}em ${(padX / font).toFixed(3)}em`,
}
const tags = callouts.map(c => ({
  id: c.id,
  name: c.name,
  style: { left: percent((c.end[0]! - bx) / bw), top: percent((c.end[1]! - by) / bh), transform: ALIGN[c.side] },
}))
const leaders = callouts.map(c => ({ id: c.id, d: `M${c.dot.join(' ')}L${c.elbow.join(' ')}L${c.end.join(' ')}`, dot: c.dot }))
const dotRadius = ((1.7 * bw) / width).toFixed(2)

/** The camera's transform: `zoom` about the console while assembled, easing to none over the spread. */
function cameraTransform(v: number) {
  const { zoom, focus } = motion.camera
  const s = zoom + (1 - zoom) * v
  const cx = bx + bw / 2, cy = by + bh / 2
  const fx = focus[0]! + (cx - focus[0]!) * v, fy = focus[1]! + (cy - focus[1]!) * v
  return `translate(${cx} ${cy}) scale(${s.toFixed(4)}) translate(${(-fx).toFixed(2)} ${(-fy).toFixed(2)})`
}
</script>

<script setup lang="ts">
const host = ref<HTMLElement>()
const ready = ref(false)
const shown = ref<Record<string, boolean>>({})
const { colours, pick } = useTeardownPalette()
const tagColours = computed(() => {
  const { bg, fg, ring, line } = colours.value
  return { '--tag-bg': bg, '--tag-fg': fg, '--tag-ring': ring, '--tag-line': line }
})
let stop = () => {}

onMounted(async () => {
  const palette = pick()
  const markup = await loadDrawing()
  const root = host.value
  if (!markup || !root) return
  root.innerHTML = markup
  const svg = root.querySelector('svg')!
  svg.dataset.palette = palette
  const camera = svg.querySelector<SVGGElement>('.camera')!
  const layer = svg.querySelector<SVGGElement>('.parts')!
  const groups = new Map([...layer.querySelectorAll<SVGGElement>('[data-part]')].map(g => [g.dataset.part!, g]))
  const shadows = new Map([...svg.querySelectorAll<SVGPathElement>('.shadows [data-part]')].map(p => [p.dataset.part!, p]))
  const written = new Map<Element, string>()
  const write = (el: Element, name: string, value: string) => {
    const key = written.get(el) ?? ''
    if (key === name + value) return
    written.set(el, name + value)
    el.setAttribute(name, value)
  }
  let order = ''

  function render(t: number) {
    const pose = teardownPose(timeline, t)
    for (const [id, g] of groups) {
      const m = parts[id]!, p = pose.parts[id]!, slide = m.slide ?? [0, 0]
      const x = slide[0]! * p.slide + (m.to[0]! - slide[0]!) * p.travel
      const y = slide[1]! * p.slide + (m.to[1]! - slide[1]!) * p.travel
      write(g, 'transform', `translate(${(x + m.lift[0]! * p.lift).toFixed(2)} ${(y + m.lift[1]! * p.lift).toFixed(2)})`)
      const shadow = shadows.get(id)
      if (shadow) {
        // On the table under the part: its height above the table, drawn straight down the page.
        write(shadow, 'transform', `translate(${x.toFixed(2)} ${(y + m.drop * (1 - p.travel)).toFixed(2)})`)
        write(shadow, 'opacity', (SHADOW * p.lift).toFixed(3))
      }
    }
    for (const c of callouts) {
      const labelled = pose.parts[c.id]!.labelled
      if (shown.value[c.id] !== labelled) shown.value[c.id] = labelled
    }
    const sorted = [...groups.keys()].sort((a, b) => pose.parts[a]!.order - pose.parts[b]!.order)
    if (sorted.join() !== order) {
      order = sorted.join()
      for (const id of sorted) layer.append(groups.get(id)!)
    }
    write(camera, 'transform', cameraTransform(pose.camera))
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // No motion: the parts laid out with their callouts.
    render(apartAt(timeline) + 1)
    ready.value = true
    return
  }

  render(0)
  ready.value = true
  // Time runs only while the drawing is on screen, so the loop never jumps.
  let elapsed = -FIRST_HOLD, last = 0, frame = 0, visible = false
  const tick = (now: number) => {
    elapsed += Math.min(now - last, 64)
    last = now
    render(elapsed < 0 ? 0 : elapsed % timeline.cycle)
    frame = requestAnimationFrame(tick)
  }
  const update = () => {
    cancelAnimationFrame(frame)
    if (!visible || document.hidden) return
    last = performance.now()
    frame = requestAnimationFrame(tick)
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting)
    update()
  }, { threshold: 0.25 })
  observer.observe(root)
  document.addEventListener('visibilitychange', update)
  stop = () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
    document.removeEventListener('visibilitychange', update)
  }
})

onBeforeUnmount(() => stop())
</script>

<template>
  <div
    class="@container relative select-none"
    :style="{ aspectRatio: `${bw} / ${bh}`, ...tagColours }"
    role="img"
    :aria-label="$t('home.teardown.label')"
  >
    <span
      class="absolute inset-0 text-slate-100 transition-opacity duration-500 [&>svg]:size-full"
      :class="ready ? 'opacity-0' : 'opacity-100'"
      aria-hidden="true"
      v-html="placeholder"
    />
    <div
      ref="host"
      class="absolute inset-0 transition-opacity duration-500 [&>svg]:size-full [&>svg]:overflow-visible"
      :class="ready ? 'opacity-100' : 'opacity-0'"
      aria-hidden="true"
    />
    <!-- Callouts: leaders drawn in the drawing's units, tags in page pixels. Names stay in English in every locale. -->
    <svg
      class="pointer-events-none absolute inset-0 size-full overflow-visible"
      :viewBox="`${bx} ${by} ${bw} ${bh}`"
      aria-hidden="true"
    >
      <g
        v-for="l in leaders"
        :key="l.id"
        class="transition-opacity duration-300 ease-out"
        :class="shown[l.id] ? 'opacity-100' : 'opacity-0'"
      >
        <path :d="l.d" fill="none" stroke="var(--tag-line)" stroke-width="0.75" vector-effect="non-scaling-stroke" />
        <circle :cx="l.dot[0]" :cy="l.dot[1]" :r="dotRadius" fill="var(--tag-fg)" stroke="#fff" stroke-width="0.8" vector-effect="non-scaling-stroke" />
      </g>
    </svg>
    <span
      v-for="tag in tags"
      :key="tag.id"
      class="pointer-events-none absolute whitespace-nowrap rounded-[0.47em] bg-(--tag-bg) font-mono font-bold leading-none tracking-[0.04em] text-(--tag-fg) ring-1 ring-(--tag-ring) ring-inset transition-opacity duration-300 ease-out"
      :class="shown[tag.id] ? 'opacity-100' : 'opacity-0'"
      :style="{ ...tag.style, ...tagStyle }"
      aria-hidden="true"
    >{{ tag.name }}</span>
  </div>
</template>
