/**
 * Choreography for the home page teardown drawing (HomeTeardown.vue), shared
 * with scripts/generate-teardown.mjs, which proofs the same poses against
 * the hidden-line renderer.
 *
 * A cycle takes the console apart from the top of the stack down, holds the
 * parts laid out on the table, puts them back from the bottom up and holds
 * the assembled console. Each moving part lifts off, glides to its place
 * and sets down; the game card first slides out of its slot.
 *
 * A pose gives every part three scalars, not positions, so one timeline can
 * place the parts in page units (the component) or in model millimetres
 * (the generator's proofs):
 *
 *   position = slideVector · slide + (spreadVector − slideVector) · travel + liftVector · lift
 *
 * `order` is the paint order, lowest first. Resting, assembled or laid
 * out, parts paint in stack order: the layout keeps every part above the
 * ones it overlaps. A part lifted into the air paints over everything,
 * since its flight clears whatever lies under it. A part that glides
 * instead (a layer of the stack fanning out) keeps its stack order, since
 * it never rises past the layer above it.
 */

export interface TeardownPart {
  id: string
  /** Position in the assembled stack, bottom first. */
  stack: number
  /** Ms into the cycle at which the part starts leaving; null for the part that stays put. */
  out: number | null
  /** Ms into the cycle at which it starts back. */
  in: number | null
  /** Whether it slides straight out before lifting (the game card leaving its slot). */
  slides?: boolean
  /** Whether it glides, staying in its stack order, rather than lifting over everything. */
  glides?: boolean
  /** This part's flight duration, ms, when not the timeline's. */
  flight?: number
}

export interface TeardownTimeline {
  parts: TeardownPart[]
  /** Duration of one lift, glide and set-down, ms. */
  flight: number
  /** Duration of the game card's slide, ms. */
  slide: number
  /** The view pulls back while the parts spread, and closes in as they return: [start, duration] in ms. */
  cameraOut: [number, number]
  cameraIn: [number, number]
  /** Ms at which putting back begins. */
  together: number
  /** Length of a whole cycle, ms. */
  cycle: number
}

export interface PartPose {
  slide: number
  travel: number
  lift: number
  order: number
  /** Whether the part rests in the spread, with the view on the whole spread, long enough to show its label. */
  labelled: boolean
}

export interface TeardownPose {
  parts: Record<string, PartPose>
  /** 0 framed on the assembled console, 1 framed on the whole spread. */
  camera: number
}

/** Labels leave this long before their part does. */
const LABEL_LEAD = 260
/** Parts in the air paint over every resting part. */
const IN_AIR = 1e3

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

/** Horizontal progress through a flight: the glide starts once the part is clear and ends before it sets down. */
export const travelAt = (t: number) => easeInOut(clamp01((t - 0.14) / 0.72))
/** Height through a flight, 0 → 1 → 0. */
export const liftAt = (t: number) => smooth(0, 0.32, t) * (1 - smooth(0.68, 1, t))

/** When a part leaves its place for its flight out (after any slide). */
export const flightOut = (timeline: TeardownTimeline, part: TeardownPart) =>
  (part.out ?? 0) + (part.slides ? timeline.slide : 0)

const flightOf = (timeline: TeardownTimeline, part: TeardownPart) => part.flight ?? timeline.flight

/** When the spread is complete: the last part out has landed. */
export const apartAt = (timeline: TeardownTimeline) =>
  Math.max(...timeline.parts.filter(p => p.out !== null).map(p => flightOut(timeline, p) + flightOf(timeline, p)))

/** The pose `t` ms into a cycle. */
export function teardownPose(timeline: TeardownTimeline, t: number): TeardownPose {
  const { together } = timeline
  const apart = apartAt(timeline)
  const parts: Record<string, PartPose> = {}
  for (const p of timeline.parts) {
    if (p.out === null || p.in === null) {
      parts[p.id] = { slide: 0, travel: 0, lift: 0, order: p.stack, labelled: t >= apart && t < together - LABEL_LEAD }
      continue
    }
    const leaves = flightOut(timeline, p), flight = flightOf(timeline, p)
    const pose: PartPose = { slide: 0, travel: 0, lift: 0, order: p.stack, labelled: false }
    let u: number
    if (t < together) {
      u = (t - leaves) / flight
      if (p.slides) pose.slide = easeInOut(clamp01((t - p.out) / timeline.slide))
      pose.travel = travelAt(clamp01(u))
      pose.labelled = u >= 1
    } else {
      u = (t - p.in) / flight
      pose.travel = 1 - travelAt(clamp01(u))
      if (p.slides) pose.slide = 1 - easeInOut(clamp01((t - p.in - flight) / timeline.slide))
      pose.labelled = t < p.in - LABEL_LEAD
    }
    if (u > 0 && u < 1) {
      pose.lift = liftAt(u)
      if (!p.glides) pose.order = IN_AIR + p.stack
    }
    parts[p.id] = pose
  }
  const [outStart, outLength] = timeline.cameraOut
  const [inStart, inLength] = timeline.cameraIn
  const camera = t < together
    ? easeInOut(clamp01((t - outStart) / outLength))
    : 1 - easeInOut(clamp01((t - inStart) / inLength))
  // Callouts are drawn for the whole spread: they show only while the view holds still on it.
  if (camera < 1) for (const pose of Object.values(parts)) pose.labelled = false
  return { parts, camera }
}
