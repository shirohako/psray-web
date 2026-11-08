import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { brotliCompressSync, deflateSync } from 'node:zlib'
import { apartAt, teardownPose } from '../app/utils/teardownMotion.ts'

/**
 * Build the home page teardown drawing from the handheld console model in
 * `tools/teardown/handheld/`, using the teardown skill's own hidden-line
 * renderer (vendored in `tools/teardown/assets/`).
 *
 * Run with `pnpm generate:teardown` after the model or the layout changes.
 * Outputs, in app/assets/teardown/:
 *
 *   handheld.svg              the drawing, fetched after hydration
 *   handheld.json             where each part goes and when, imported by the component
 *   handheld-placeholder.svg  the assembled silhouette, inlined by SSR
 *
 * ## Why the drawing is layered
 *
 * The skill animates by re-rendering the whole drawing for every frame,
 * which is far too heavy for a home page. Every motion here is a
 * translation of a whole part, though, and the camera is parallel, so each
 * part is rendered once, alone, where it sits in the assembled console: its
 * own hidden lines are exact, and the renderer's fill gives its silhouette.
 * The page then paints the parts in a back-to-front order, each one's
 * paper-white fill hiding what lies beneath, and moves them with transforms.
 *
 * That is exact when every overlap on the page is between a part and
 * something wholly below it. The model keeps its stack in layers that do
 * not interleave, the parts on the table never overlap, and a part in
 * flight is higher than anything it passes over (see app/utils/teardownMotion.ts
 * for the paint order). `--proof <dir>` renders the true drawing, every part
 * together through the renderer, at moments through a cycle, beside the
 * layered drawing at the same moment, so the two can be compared.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tools = join(root, 'tools/teardown')
const outDir = join(root, 'app/assets/teardown')
const NAME = 'handheld'

// ---- Choreography -------------------------------------------------------------

/**
 * Where each part rests laid out: a world offset across the table from its
 * assembled place, mm. The back shell stays put; the board, the display and
 * the front shell fan out behind it like a spread deck, each overlapping the
 * one below, and the loose parts go to either side. Heights come from
 * stacking: each part rests just above whatever it overlaps.
 */
const SPREAD = {
  'back-shell': [0, 0],
  'battery': [-96, 64],
  'game-card': [125, 38.7],
  'mainboard': [16, 44],
  'fan': [92, 34],
  'display': [32, 86],
  'front-shell': [48, 124],
  'dpad': [-41, 14],
  'face-buttons': [51, -24],
  'menu-buttons': [118, -4],
  'stick-l': [-55, -45],
  'stick-r': [-167, -18],
}
/** The game card slides this far out of its slot before it lifts, mm. */
const CARD_SLIDE = 30
/** The assembled console fills this share of the drawing's width before the view pulls back. */
const CLOSE_UP = 0.68

const FLIGHT = 1100
const SLIDE = 520
/**
 * Each part's moves. `out` and `in` are ms from the start of taking apart
 * and of putting back. `lift` is the height of its flight above its path,
 * mm. A part that `glides` keeps its place in the paint order, so it must
 * never rise past the layer above it: the board slides out flat under the
 * display, and the display rises just enough to clear it.
 *
 * Taking apart goes from the top of the stack down, and a part only starts
 * once the parts above it have cleared it; putting back goes from the
 * bottom up, and a part only arrives once the part beneath has set down.
 */
const MOVES = {
  'game-card': { out: 0, in: 4300 },
  'stick-l': { out: 250, in: 4100 },
  'stick-r': { out: 330, in: 4180 },
  'menu-buttons': { out: 420, in: 4020 },
  'dpad': { out: 500, in: 3940 },
  'face-buttons': { out: 580, in: 3860 },
  'front-shell': { out: 980, in: 2500, flight: 1500, lift: 18, glides: true },
  'display': { out: 1230, in: 2300, flight: 1150, lift: 4, glides: true },
  'fan': { out: 2430, in: 1600 },
  'mainboard': { out: 2780, in: 1100, lift: 0, glides: true },
  'battery': { out: 3580, in: 0 },
}
const LIFT = 16
/** How long the parts rest laid out, and the console assembled. */
const HOLD_APART = 4600
const HOLD_TOGETHER = 2400

/**
 * Callouts: each part's name, a point on the part (model millimetres, where
 * it sits assembled) and where the name goes, as an offset from that point
 * on the page in drawing units. The name reads away from the point. Names
 * on the right line up in one column ('column', spaced to clear each
 * other); on the left they sit in the free space beside their parts; one
 * may sit centred below its part ('below').
 */
const LABELS = {
  'front-shell': ['FRONT SHELL', [-78, 30, 14], [-20, -10]],
  'display': ['DISPLAY', [-44, -16, 12.2], [-44, -29]],
  'battery': ['BATTERY', [-44, 4, 6.1], [0, -16]],
  'mainboard': ['MAINBOARD', [-70, -28, 7.4], [-44, -9]],
  'dpad': ['D-PAD', [-74, -6, 15.6], [-6, 0]],
  'stick-l': ['STICKS', [-73, 19, 16.3], [-4, 10]],
  'game-card': ['GAME CARD', [14, 36, 9.8], ['column', 0]],
  'fan': ['FAN', [39.6, -4, 10.4], ['column', 0]],
  'face-buttons': ['BUTTONS', [79.6, 18, 15.4], ['column', 0]],
  'menu-buttons': ['MENU', [14, -30, 15], ['column', 0]],
  'back-shell': ['BACK SHELL', [0, -40, 1.5], ['below', 9]],
}

/** Path coordinates keep this many decimals of a drawing millimetre. */
const DECIMALS = 1

// ---- Model --------------------------------------------------------------------

async function loadModel() {
  const context = { console, structuredClone }
  context.self = context
  vm.createContext(context)
  for (const file of ['assets/sheet.js', 'assets/geometry.js', 'assets/projection.js', `${NAME}/model.js`]) {
    const path = join(tools, file)
    vm.runInContext(await readFile(path, 'utf8'), context, { filename: path })
  }
  return context
}

const ctx = await loadModel()
const { TechnicalGeometry: G, TechnicalProjection: P, Handheld } = ctx
const build = () => Handheld.build({})
const { parts, camera } = build()
const byId = new Map(parts.map(p => [p.id, p]))
const view = P.createCamera(camera)

// The camera's page axes, read back from the projection: project(p) is
// [p · right, -(p · up), depth] with no roll.
const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(v => view.project(v))
const right = axes.map(a => a[0])
const up = axes.map(a => -a[1])
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const add = (a, b) => a.map((n, i) => n + b[i])
const scaleBy = (a, k) => a.map(n => n * k)
/** World vector → page vector, in model millimetres, y down. */
const onPage = v => [dot(v, right), -dot(v, up)]

const zMin = part => Math.min(...part.vertices.map(v => v[2]))
/** A part's page box when moved by world vector `offset`: [x0, y0, x1, y1]. */
function pageBox(part, offset = [0, 0, 0]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const v of part.vertices) {
    const [x, y] = onPage(add(v, offset))
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  return [x0, y0, x1, y1]
}
const union = boxes => [0, 1, 2, 3].map(i => (i < 2 ? Math.min : Math.max)(...boxes.map(b => b[i])))

// ---- Spread layout ---------------------------------------------------------------

/** Each part's resting offset, raised just above whatever it overlaps that is lower in the stack. */
function stackUp() {
  const placed = [], spread = {}
  const footprint = (p, [dx, dy]) => {
    const xs = p.vertices.map(v => v[0] + dx), ys = p.vertices.map(v => v[1] + dy)
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
  }
  for (const p of parts) {
    const [dx, dy] = SPREAD[p.id], f = footprint(p, [dx, dy])
    const z0 = zMin(p), z1 = Math.max(...p.vertices.map(v => v[2]))
    let floor = 0
    for (const q of placed) {
      if (f[0] < q.f[2] && q.f[0] < f[2] && f[1] < q.f[3] && q.f[1] < f[3]) floor = Math.max(floor, q.top + .4)
    }
    const dz = p.id === parts[0].id ? 0 : floor - z0
    spread[p.id] = [dx, dy, dz]
    placed.push({ f, top: z1 + dz })
  }
  return spread
}

const spread = stackUp()
for (const p of parts) if (!SPREAD[p.id]) throw Error(`${p.id} has no place in the spread`)
const slideOf = id => (id === 'game-card' ? [0, CARD_SLIDE, 0] : null)
const liftOf = id => MOVES[id]?.lift ?? LIFT

// ---- One frame for every render ----------------------------------------------

/** Page boxes of everything the animation ever shows at rest: assembled, slid out and spread. */
const restBoxes = parts.flatMap(p => [pageBox(p), pageBox(p, spread[p.id]), ...(slideOf(p.id) ? [pageBox(p, slideOf(p.id))] : [])])
const world = union(restBoxes)
/** Also every part at the top of its flight, which the true renders in the proofs include. */
const reach = union([...restBoxes, ...parts.flatMap(p => [pageBox(p, [0, 0, liftOf(p.id)]), pageBox(p, add(spread[p.id], [0, 0, liftOf(p.id)]))])])

/**
 * The renderer fits each call to the sheet. Two specks at the corners of
 * everything the animation ever shows pin that fit, so separate renders share
 * one paper space. They are tiny feature lines with no faces, so they hide
 * nothing; their ink is dropped.
 */
function frameMarker() {
  const at = (x, y) => right.map((r, i) => x * r - y * up[i])
  const marker = G.part('frame', 'Frame')
  for (const [x, y] of [[reach[0], reach[1]], [reach[2], reach[3]]]) G.line(marker, at(x, y), at(x + 1e-3, y), 'detail')
  return marker
}
const marker = frameMarker()

const render = (shown, options = {}) => P.render([...shown, marker], { camera, explosion: 1, ...options })

// ---- Path data -------------------------------------------------------------------

const round = n => Math.round(n * 10 ** DECIMALS) / 10 ** DECIMALS
const fmt = n => {
  const s = round(n).toFixed(DECIMALS).replace(/\.?0+$/, '')
  return (s === '-0' ? '0' : s).replace(/^(-?)0\./, '$1.')
}

/** Joins numbers the way SVG path grammar allows, without needless spaces. */
function join2(numbers) {
  let out = ''
  for (const s of numbers) {
    if (out && !s.startsWith('-') && !(s.startsWith('.') && /\.\d*$/.test(out.split(/[ -]/).pop()))) out += ' '
    out += s
  }
  return out
}

/**
 * Rewrites the renderer's absolute M/L/C/Z path data as relative commands at
 * DECIMALS precision. Deltas are taken between already-rounded absolute
 * points, so rounding never accumulates along a long contour.
 */
function compact(d) {
  const tokens = d.match(/[MLCZ]|-?[\d.]+(?:e-?\d+)?/gi)
  let out = '', i = 0, cx = 0, cy = 0, sx = 0, sy = 0, last = ''
  const emit = (cmd, nums) => {
    const body = join2(nums.map(fmt))
    if (cmd === last && cmd !== 'm') out += (body.startsWith('-') ? '' : ' ') + body
    else out += cmd + body
    last = cmd === 'm' ? 'l' : cmd
  }
  while (i < tokens.length) {
    const cmd = tokens[i++]
    if (cmd === 'Z' || cmd === 'z') { out += 'z'; last = 'z'; cx = sx; cy = sy; continue }
    const take = n => tokens.slice(i, (i += n)).map(Number).map(round)
    if (cmd === 'M') {
      const [x, y] = take(2)
      emit('m', [x - cx, y - cy]); cx = sx = x; cy = sy = y
    } else if (cmd === 'L') {
      const [x, y] = take(2)
      emit('l', [x - cx, y - cy]); cx = x; cy = y
    } else if (cmd === 'C') {
      const [x1, y1, x2, y2, x, y] = take(6)
      emit('c', [x1 - cx, y1 - cy, x2 - cx, y2 - cy, x - cx, y - cy]); cx = x; cy = y
    } else {
      throw Error(`Unexpected path command ${cmd}`)
    }
  }
  return out
}

/** Closed polygon loops of a fill path (the renderer writes them as M…L…Z). */
const loopsOf = d => d.split('M').filter(Boolean).map(run => run.replace(/Z$/, '').split('L').map(p => p.trim().split(/\s+/).map(Number)))
const areaOf = loop => loop.reduce((s, [x, y], i) => { const [u, v] = loop[(i + 1) % loop.length]; return s + x * v - u * y }, 0) / 2
const loopPath = loops => loops.map(loop => 'M' + loop.map(p => p.join(' ')).join('L') + 'Z').join('')

/** Douglas–Peucker on a closed loop, split at its two most distant points. */
function simplify(loop, tolerance) {
  const far = loop.reduce((best, p, i) => (Math.hypot(p[0] - loop[0][0], p[1] - loop[0][1]) > Math.hypot(loop[best][0] - loop[0][0], loop[best][1] - loop[0][1]) ? i : best), 0)
  const run = (points) => {
    if (points.length < 3) return points
    const [a, b] = [points[0], points.at(-1)], len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    let worst = 0, at = 0
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i], dist = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len
      if (dist > worst) { worst = dist; at = i }
    }
    if (worst <= tolerance) return [a, b]
    return [...run(points.slice(0, at + 1)).slice(0, -1), ...run(points.slice(at))]
  }
  return [...run(loop.slice(0, far + 1)).slice(0, -1), ...run([...loop.slice(far), loop[0]]).slice(0, -1)]
}

/** The outer loops of a fill: its silhouette without the holes. */
function outerLoops(fill) {
  const loops = loopsOf(fill)
  if (!loops.length) return []
  const sign = Math.sign(areaOf(loops.reduce((a, b) => (Math.abs(areaOf(b)) > Math.abs(areaOf(a)) ? b : a))))
  return loops.filter(loop => Math.sign(areaOf(loop)) === sign && Math.abs(areaOf(loop)) > 1)
}

// ---- Render each part alone ----------------------------------------------------

const ROLES = ['outline', 'edge', 'detail', 'texture']
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function layerOf(part) {
  const result = render([part], { explosion: 0, fill: true })
  const id = escapeRe(part.id)
  const group = result.markup.match(new RegExp(`<g id="[^"]*" data-item="${id}"[^>]*>([\\s\\S]*?)</g>`))
  if (!group) throw Error(`No ink for ${part.id}`)
  const ink = {}
  for (const [, role, d] of group[1].matchAll(/<path data-line-role="(\w+)" fill="none" d="([^"]*)"\/>/g)) {
    if (!ROLES.includes(role)) throw Error(`Unexpected line role ${role} on ${part.id}`)
    ink[role] = (ink[role] ?? '') + d
  }
  const fill = [...result.markup.matchAll(new RegExp(`<path data-fill="${id}" data-covers="[^"]*" fill="none" d="([^"]*)"/>`, 'g'))].map(m => m[1]).join('')
  return { id: part.id, name: part.name, ink, fill, frame: result }
}

console.time('layers')
const layers = parts.map(layerOf)
console.timeEnd('layers')
const { scale, offset } = layers[0].frame
for (const l of layers) {
  if (Math.abs(l.frame.scale - scale) > 1e-9 || l.frame.offset.some((n, i) => Math.abs(n - offset[i]) > 1e-9)) {
    throw Error(`${l.id} was fitted to a different frame`)
  }
}
/** World point → drawing units; world vector → drawing vector. */
const paper = p => { const [x, y] = view.project(p); return [x * scale + offset[0], y * scale + offset[1]] }
const paperVector = v => scaleBy(onPage(v), scale)
const paperBox = b => [...paper(right.map((r, i) => b[0] * r - b[1] * up[i])), ...paper(right.map((r, i) => b[2] * r - b[3] * up[i]))]

// ---- Colour -----------------------------------------------------------------------

const ROOT = 'handheld-teardown'
/** Line weights in screen pixels, constant at any display size; the page may override each one. */
const WEIGHTS = { o: 1.1, e: .7, d: .55, t: .45 }
const WEIGHT_NAMES = { o: 'outline', e: 'edge', d: 'detail', t: 'texture' }
const TONES = { edge: 'xe', detail: 'xd', texture: 'xt', light: 'xl' }

/**
 * Colour schemes, each with a one-line `title` for the comparison sheet
 * (`--sheet`). Each part's fill is its body
 * colour; flat regions painted over it (the model's shapes, blocks and
 * discs) pick out faces and components by tone. `inks` are the line and
 * text colours, contours darkest so the construction reads first; `parts`
 * overrides them on one part (o/e/d/t lines, xe/xd/xt/xl text); `fade`
 * makes a part's fill, or a tone, see-through. `page` holds the colours the
 * page draws with it: the callout tags (bg, fg, ring, line) and the
 * highlighters on the hero copy beside it, one [band, text] per phrase
 * (marks).
 *
 * The page's drawing carries every palette, each scoped to
 * `[data-palette=<name>]` on the <svg>, and picks one per visit.
 */
const BASE = {
  inks: { o: '#1e293b', e: '#334155', d: '#475569', t: '#64748b', l: '#f1f5f9' },
  body: {
    'back-shell': '#6366f1', 'battery': '#e2e8f0', 'game-card': '#374151', 'mainboard': '#1c2533',
    'fan': '#94a3b8', 'display': '#1f2937', 'front-shell': '#a5b4fc', 'dpad': '#334155',
    'face-buttons': '#e2e8f0', 'menu-buttons': '#334155', 'stick-l': '#475569', 'stick-r': '#475569',
  },
  colours: {
    // Shells.
    'face': '#c7d2fe', 'interior': '#e5e7eb', 'rib': '#d1d5db', 'speaker': '#334155', 'vent': '#9ca3af',
    'adhesive': '#f8fafc', 'sticker': '#ffffff', 'paper': '#f8fafc', 'glare': '#ffffff',
    // Screen.
    'screen': '#0f172a', 'gold': '#e8b931',
    // Board.
    'board': '#1c2533', 'silk': '#e5e7eb', 'plug': '#f1f5f9', 'substrate': '#3f4a5c', 'metal': '#cbd5e1',
    'chip': '#0b1220', 'inductor': '#4b5563', 'passive': '#c8a77a', 'stick-base': '#94a3b8',
    // Keys and sticks.
    'key-x': '#60a5fa', 'key-a': '#f87171', 'key-b': '#facc15', 'key-y': '#4ade80', 'cap': '#334155', 'hub': '#f8fafc',
    // Game card art.
    'title': '#1e1b4b', 'sky': '#7dd3fc', 'sun': '#fde047', 'mountain': '#818cf8', 'hill': '#22c55e',
    'ground': '#a16207', 'hero': '#ef4444', 'skin': '#fcd34d',
    // Battery gauge.
    'cell': '#10b981', 'level': '#10b981',
  },
  parts: {},
  fade: { glare: .07 },
}
const PALETTES = {
  // Indigo shells, the inside a step deeper than the face; a matte black board with gold copper.
  indigo: {
    title: 'Pale indigo face, deeper inside, black board, gold copper',
    page: { bg: '#eef2ff', fg: '#3730a3', ring: '#c7d2fe', line: '#818cf8', marks: [['#fde68a', '#92400e'], ['#c7d2fe', '#3730a3'], ['#a7f3d0', '#065f46']] },
    body: { 'front-shell': '#c7d2fe', 'back-shell': '#4f46e5', 'mainboard': '#16181d', 'dpad': '#312e81', 'menu-buttons': '#312e81', 'stick-l': '#3730a3', 'stick-r': '#3730a3', 'face-buttons': '#e0e7ff' },
    colours: {
      'face': '#e0e7ff', 'interior': '#a5b4fc', 'rib': '#818cf8', 'speaker': '#312e81', 'vent': '#4338ca', 'adhesive': '#e0e7ff',
      'board': '#16181d', 'substrate': '#2c3039', 'chip': '#08090b', 'inductor': '#3f3f46', 'metal': '#d4d4d8', 'stick-base': '#a1a1aa', 'cap': '#1e1b4b',
    },
    parts: {
      'back-shell': { o: '#1e1b4b', e: '#312e81', d: '#3730a3', t: '#4f46e5', xd: '#312e81', xe: '#1e1b4b', xt: '#4338ca' },
      'mainboard': { o: '#0b0c0f', e: '#3f3f46', d: '#d4a537', t: '#d4a537' },
    },
  },
  // Warm cream and stone, a classic green board with gold copper, crimson action keys.
  retro: {
    title: 'Cream and stone, green board, gold copper, crimson A/B',
    page: { bg: '#f5f5f4', fg: '#44403c', ring: '#d6d3d1', line: '#a8a29e', marks: [['#fde68a', '#92400e'], ['#fecdd3', '#9f1239'], ['#a7f3d0', '#065f46']] },
    inks: { o: '#292524', e: '#44403c', d: '#57534e', t: '#78716c' },
    body: {
      'front-shell': '#e2dac7', 'back-shell': '#a8a29e', 'battery': '#e7e5e4', 'game-card': '#44403c', 'mainboard': '#1d6b3c',
      'fan': '#a8a29e', 'display': '#292524', 'dpad': '#292524', 'menu-buttons': '#78716c', 'face-buttons': '#9f1239',
      'stick-l': '#57534e', 'stick-r': '#57534e',
    },
    colours: {
      'face': '#f2ecdf', 'interior': '#d3c9b2', 'rib': '#bfb39a', 'speaker': '#44403c', 'vent': '#a8a29e', 'adhesive': '#fafaf9',
      'screen': '#1c1917', 'board': '#1d6b3c', 'substrate': '#2f4f3a', 'chip': '#0c0a09', 'inductor': '#44403c', 'metal': '#d6d3d1',
      'stick-base': '#a8a29e', 'silk': '#f5f5f4', 'key-x': '#57534e', 'key-y': '#57534e', 'key-a': '#be123c', 'key-b': '#be123c', 'cap': '#44403c',
    },
    parts: { 'mainboard': { o: '#0c0a09', e: '#14532d', d: '#d4a537', t: '#d4a537' }, 'face-buttons': { xe: '#fafaf9' } },
  },
  // Graphite like a glossy black handheld, neon keys, a navy board with silver copper.
  graphite: {
    title: 'Glossy black, navy board, silver copper, neon keys',
    page: { bg: '#27272a', fg: '#f4f4f5', ring: '#27272a', line: '#71717a', marks: [['#d9f99d', '#3f6212'], ['#a5f3fc', '#155e75'], ['#fbcfe8', '#9d174d']] },
    body: {
      'front-shell': '#3f3f46', 'back-shell': '#27272a', 'battery': '#e4e4e7', 'game-card': '#27272a', 'mainboard': '#123a7a',
      'fan': '#71717a', 'display': '#18181b', 'dpad': '#52525b', 'menu-buttons': '#52525b', 'face-buttons': '#3f3f46',
      'stick-l': '#3f3f46', 'stick-r': '#3f3f46',
    },
    colours: {
      'face': '#1f1f23', 'interior': '#6b6b74', 'rib': '#7d7d86', 'speaker': '#27272a', 'vent': '#3f3f46', 'adhesive': '#a1a1aa',
      'board': '#123a7a', 'substrate': '#1e3a5f', 'chip': '#09090b', 'inductor': '#3f3f46', 'metal': '#e4e4e7', 'stick-base': '#a1a1aa',
      'silk': '#f8fafc', 'cap': '#27272a', 'key-x': '#22d3ee', 'key-a': '#f472b6', 'key-b': '#facc15', 'key-y': '#a3e635',
    },
    parts: {
      'front-shell': { o: '#09090b', e: '#71717a', d: '#a1a1aa', t: '#71717a', xe: '#e4e4e7', xd: '#a1a1aa', xt: '#71717a' },
      'back-shell': { o: '#09090b', e: '#27272a', d: '#3f3f46', t: '#a1a1aa', xd: '#18181b', xe: '#18181b' },
      'mainboard': { o: '#0a1630', e: '#0a1630', d: '#d4d4d8', t: '#d4d4d8' },
      'dpad': { o: '#09090b', e: '#a1a1aa', d: '#a1a1aa' },
      'menu-buttons': { o: '#09090b', e: '#a1a1aa' },
      'stick-l': { o: '#09090b', e: '#a1a1aa', d: '#a1a1aa', t: '#71717a' },
      'stick-r': { o: '#09090b', e: '#a1a1aa', d: '#a1a1aa', t: '#71717a' },
      'face-buttons': { o: '#09090b' },
      'display': { o: '#09090b' },
      'game-card': { o: '#09090b', e: '#71717a', d: '#a1a1aa' },
    },
    fade: { glare: .14 },
  },
  // Clear purple plastic over a white board: the parts show through the shell.
  clear: {
    title: 'See-through purple shell over a white board',
    page: { bg: '#f5f3ff', fg: '#6d28d9', ring: '#ddd6fe', line: '#a78bfa', marks: [['#f5d0fe', '#86198f'], ['#ddd6fe', '#5b21b6'], ['#bae6fd', '#075985']] },
    body: {
      'front-shell': '#7c3aed', 'back-shell': '#6d28d9', 'mainboard': '#f4f4f5', 'battery': '#f4f4f5', 'game-card': '#2e1065',
      'fan': '#a1a1aa', 'display': '#18181b', 'dpad': '#4c1d95', 'menu-buttons': '#4c1d95', 'face-buttons': '#ede9fe',
      'stick-l': '#5b21b6', 'stick-r': '#5b21b6',
    },
    colours: {
      'face': '#8b5cf6', 'interior': '#c4b5fd', 'rib': '#a78bfa', 'speaker': '#4c1d95', 'vent': '#7c3aed', 'adhesive': '#f5f3ff',
      'board': '#f4f4f5', 'substrate': '#a1a1aa', 'chip': '#18181b', 'inductor': '#52525b', 'metal': '#d4d4d8', 'stick-base': '#a1a1aa',
      'silk': '#334155', 'cap': '#4c1d95', 'key-x': '#ede9fe', 'key-a': '#ede9fe', 'key-b': '#ede9fe', 'key-y': '#ede9fe',
    },
    parts: {
      'front-shell': { o: '#2e1065', e: '#5b21b6', d: '#6d28d9', t: '#7c3aed', xd: '#2e1065', xe: '#2e1065' },
      'back-shell': { o: '#2e1065', e: '#4c1d95', d: '#5b21b6', t: '#6d28d9', xd: '#4c1d95', xe: '#2e1065', xt: '#5b21b6' },
      'mainboard': { o: '#3f3f46', e: '#71717a', d: '#c9a227', t: '#c9a227', xl: '#334155' },
      'face-buttons': { xe: '#5b21b6' },
    },
    fade: { 'front-shell': .42, face: .3, glare: .14 },
  },
}
/** Every scheme in full: the base with the palette's changes. */
const SCHEMES = Object.fromEntries(Object.entries(PALETTES).map(([name, { inks = {}, body = {}, colours = {}, parts = {}, fade = {}, ...rest }]) => [name, {
  ...rest,
  inks: { ...BASE.inks, ...inks },
  body: { ...BASE.body, ...body },
  colours: { ...BASE.colours, ...colours },
  parts,
  fade: { ...BASE.fade, ...fade },
}]))
/** The drawing's palette until the page picks one. */
const DEFAULT_PALETTE = 'indigo'
/** Stills are drawn in `PALETTE`, or in every palette. */
const STILL_PALETTES = process.env.PALETTE ? [process.env.PALETTE] : Object.keys(PALETTES)
for (const name of STILL_PALETTES) if (!SCHEMES[name]) throw Error(`PALETTE must be one of ${Object.keys(PALETTES).join(', ')}`)

// ---- Callouts --------------------------------------------------------------------

/** The drawing is laid out for this width on the page (the home page's left column on a desktop); callout tags are sized in page pixels. */
const PAGE_WIDTH = Number(process.env.PAGE_WIDTH ?? 450)
/** A callout's tag at PAGE_WIDTH: text size, padding, and the monospace advance (em) with its letter spacing. */
const TAG = { font: 8, padX: 5, padY: 2.75, advance: 0.66 }
/**
 * On a narrow screen the page keeps tags legible by drawing them larger
 * than the drawing's scale, up to this much (a 6 px floor on a 278 px wide
 * drawing). Tags must clear each other at that size; the drawing's box
 * fits them at their own size, and the page lets larger ones spill into
 * the card's padding.
 */
const TAG_ROOM = 1.25

/** A tag's width and height in drawing units. */
const tagSize = (name, unitsPerPx) => [(name.length * TAG.advance * TAG.font + 2 * TAG.padX) * unitsPerPx, (TAG.font + 2 * TAG.padY) * unitsPerPx]

/**
 * Where a tag sits, [x0, y0, x1, y1]: beside `end`, reading away from its
 * leader (`side` ±1), or centred below it (`side` 0).
 */
function tagBox(end, side, [w, h]) {
  if (!side) return [end[0] - w / 2, end[1], end[0] + w / 2, end[1] + h]
  const x = side > 0 ? end[0] : end[0] - w
  return [x, end[1] - h / 2, x + w, end[1] + h / 2]
}

/** Each callout in drawing units: a dot on the part where it rests laid out, a leader and its tag. */
function callouts(unitsPerPx) {
  const column = Math.max(...parts.map(p => paperBox(pageBox(p, spread[p.id]))[2])) + 6
  const list = Object.entries(LABELS).map(([id, [name, point, [dx, dy]]]) => {
    const dot = paper(add(point, spread[id]))
    const mode = dx === 'column' || dx === 'below' ? dx : 'free'
    const elbow = mode === 'column' ? [column, dot[1] + dy] : mode === 'below' ? [dot[0], dot[1] + dy] : [dot[0] + dx, dot[1] + dy]
    const side = mode === 'below' ? 0 : mode === 'column' || dx >= 0 ? 1 : -1
    return { id, name, dot, elbow, side, mode }
  })
  // The right-hand column, top to bottom, its tags clear of each other at their largest.
  const gap = tagSize('', unitsPerPx * TAG_ROOM)[1] + 4 * unitsPerPx
  const stacked = list.filter(c => c.mode === 'column').sort((a, b) => a.elbow[1] - b.elbow[1])
  stacked.forEach((c, i) => { if (i) c.elbow[1] = Math.max(c.elbow[1], stacked[i - 1].elbow[1] + gap) })
  return list.map(({ id, name, dot, elbow, side }) => {
    const end = side ? [elbow[0] + side * 4, elbow[1]] : [elbow[0], elbow[1] + 1]
    return {
      id, name, dot: dot.map(round), elbow: elbow.map(round), end: end.map(round), side,
      fit: tagBox(end, side, tagSize(name, unitsPerPx)),
      room: tagBox(end, side, tagSize(name, unitsPerPx * TAG_ROOM)),
    }
  })
}

/** Throws if two tags, at their largest, would overlap each other. */
function checkTags(list) {
  list.forEach((a, i) => list.slice(i + 1).forEach((b) => {
    const [p, q] = [a.room, b.room]
    if (p[0] < q[2] && q[0] < p[2] && p[1] < q[3] && q[1] < p[3]) throw Error(`Callout tags ${a.id} and ${b.id} overlap`)
  }))
}

// ---- Drawing box and motion ------------------------------------------------------

const PAD = 3
const box = (() => {
  let [x0, y0, x1, y1] = paperBox(world)
  // Tags reach past the parts and are sized in page pixels, so iterate the fit.
  for (let k = 0; k < 5; k++) {
    for (const c of callouts((x1 - x0 + 2 * PAD) / PAGE_WIDTH)) {
      x0 = Math.min(x0, c.fit[0], c.dot[0]); x1 = Math.max(x1, c.fit[2], c.dot[0])
      y0 = Math.min(y0, c.fit[1]); y1 = Math.max(y1, c.fit[3])
    }
  }
  return [x0 - PAD, y0 - PAD, x1 - x0 + 2 * PAD, y1 - y0 + 2 * PAD].map(n => round(n))
})()
const labels = callouts(box[2] / PAGE_WIDTH)
checkTags(labels)

/**
 * Close-up on the assembled console: the drawing scales by `zoom` about the
 * console's centre and moves it to the centre of the box. The view pulls
 * back to the whole box as the parts spread.
 */
const camera0 = (() => {
  const [x0, y0, x1, y1] = paperBox(union(parts.map(p => pageBox(p))))
  const zoom = Math.min(CLOSE_UP * box[2] / (x1 - x0), 0.72 * box[3] / (y1 - y0))
  return { zoom: Math.round(zoom * 100) / 100, focus: [(x0 + x1) / 2, (y0 + y1) / 2].map(round) }
})()

const flightOfMove = id => MOVES[id]?.flight ?? FLIGHT
const together = Math.max(...Object.entries(MOVES).map(([id, m]) => m.out + (slideOf(id) ? SLIDE : 0) + flightOfMove(id))) + HOLD_APART
const lastHome = Math.max(...Object.entries(MOVES).map(([id, m]) => m.in + flightOfMove(id) + (slideOf(id) ? SLIDE : 0)))
const timeline = {
  parts: parts.map((p, stack) => {
    const m = MOVES[p.id]
    return {
      id: p.id, stack,
      out: m ? m.out : null,
      in: m ? together + m.in : null,
      ...(slideOf(p.id) ? { slides: true } : {}),
      ...(m?.glides ? { glides: true } : {}),
      ...(m?.flight ? { flight: m.flight } : {}),
    }
  }),
  flight: FLIGHT,
  slide: SLIDE,
  cameraOut: [0, 1600],
  cameraIn: [together + MOVES['face-buttons'].in - 300, 1600],
  together,
  cycle: together + lastHome + HOLD_TOGETHER,
}
if (apartAt(timeline) + HOLD_APART !== together) throw Error('Timeline arithmetic disagrees with the motion module')
for (const p of parts) {
  if (!MOVES[p.id] && p.id !== parts[0].id) throw Error(`${p.id} never moves`)
}

/** Everything the component needs to move the drawing, in drawing units. */
const motion = {
  viewBox: box,
  camera: camera0,
  timeline,
  labels: labels.map(({ fit, room, ...c }) => c),
  tag: { ...TAG, width: PAGE_WIDTH },
  palettes: Object.fromEntries(Object.keys(PALETTES).map(name => [name, PALETTES[name].page])),
  parts: Object.fromEntries(parts.map(p => [p.id, {
    to: paperVector(spread[p.id]).map(round),
    ...(slideOf(p.id) ? { slide: paperVector(slideOf(p.id)).map(round) } : {}),
    lift: paperVector([0, 0, liftOf(p.id)]).map(round),
    // How far below the part its shadow falls while assembled: its height above the table.
    drop: round(-paperVector([0, 0, zMin(p)])[1]),
  }])),
}

// ---- Compose -----------------------------------------------------------------------

const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'

/**
 * The drawing's stylesheet: the shared rules, then each palette's colours
 * under its `data-palette`. On the page, strokes keep their width in screen
 * pixels (`vector-effect`). Proof renders go through resvg, which reads no
 * custom properties, animation or `vector-effect`, so there (`standalone`)
 * every width is given in drawing units: `unit` per screen pixel.
 */
function stylesheet({ standalone, unit = 1, palettes = Object.keys(SCHEMES) }) {
  const v = (name, fallback) => (standalone ? fallback : `var(--teardown-${name},${fallback})`)
  const px = w => `${standalone ? +(w * unit).toFixed(4) : w}px`
  const s = `.${ROOT}`
  // The battery's gauge fills bar by bar, holds full, and starts again.
  const charge = [0, 1, 2, 3].map(i => {
    const on = 12 + i * 17
    return `@keyframes ${ROOT}-cell${i}{0%,${on}%{opacity:.14}${on + 3}%,86%{opacity:1}92%,100%{opacity:.14}}${s} .c-cell${i}{animation:${ROOT}-cell${i} 3.4s linear infinite}`
  }).join('')
  const scheme = (name) => {
    const { inks, body, colours, parts, fade } = SCHEMES[name]
    const p = `${s}[data-palette=${name}]`
    return [
      ...Object.keys(WEIGHTS).map(c => `${p} .${c}{stroke:${inks[c]}}`),
      ...Object.entries(body).map(([id, c]) => `${p} [data-part=${id}] .f{fill:${c};stroke:${c}}`),
      ...Object.entries(colours).map(([tone, c]) => `${p} .c-${tone}{fill:${c}}`),
      `${p} .xe{fill:${inks.e}}${p} .xd{fill:${inks.d}}${p} .xt{fill:${inks.t}}${p} .xl{fill:${inks.l}}`,
      // One part's own inks.
      ...Object.entries(parts).flatMap(([id, own]) => Object.entries(own).map(([k, c]) =>
        `${p} [data-part=${id}] .${k}{${k[0] === 'x' ? 'fill' : 'stroke'}:${c}}`)),
      // See-through parts and tones.
      ...Object.entries(fade).map(([key, a]) => (body[key] ? `${p} [data-part=${key}] .f{fill-opacity:${a};stroke-opacity:${a}}` : `${p} .c-${key}{fill-opacity:${a}}`)),
    ].join('')
  }
  return [
    `${s} path{fill:none;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}`,
    // Fills hide what lies behind each part; the hairline stroke closes anti-aliasing seams.
    `${s} .f{stroke-width:${px(.6)}}`,
    `${s} .h{fill:${v('shadow', '#0f172a')};stroke:none}`,
    ...Object.entries(WEIGHTS).map(([c, w]) => `${s} .${c}{stroke-width:${v(WEIGHT_NAMES[c], px(w))}}`),
    `${s} .c{stroke:none}`,
    `${s} text{font-family:${standalone ? 'Menlo' : v('font', MONO)};stroke:none}`,
    ...palettes.map(scheme),
    ...(standalone ? [] : [charge, `@media (prefers-reduced-motion:reduce){${s} [class*=c-cell]{animation:none}}`]),
  ].join('')
}

const escapeXml = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Convex hull of page points (monotone chain), counterclockwise. */
function hull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = list => list.reduce((h, p) => {
    while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop()
    h.push(p)
    return h
  }, [])
  const lower = half(sorted), upper = half(sorted.reverse())
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

const polygon = points => 'M' + points.map(p => p.join(' ')).join('L') + 'Z'

/** A part's colour regions, projected: painted over its fill, under its lines. */
function regionsOf(id) {
  const marks = build().marks.filter(m => m.part === id && m.kind !== 'text')
  // Solids paint back to front, so a taller one in front covers the one behind.
  // Flat shapes first, in the model's order; then solids back to front, so a
  // taller one in front covers the one behind.
  const depth = m => (m.kind === 'block' ? [1, -(m.min[1] + m.max[1]) / 2, m.min[2]] : m.kind === 'disc' ? [1, -m.center[1], m.z[0]] : [0, 0, 0])
  marks.sort((a, b) => depth(a)[0] - depth(b)[0] || depth(a)[1] - depth(b)[1] || depth(a)[2] - depth(b)[2])
  return marks.map((m) => {
    let d
    if (m.kind === 'shape') {
      d = [m.points, ...m.holes].map(loop => polygon(loop.map(([x, y]) => paper([x, y, m.z])))).join('')
    } else if (m.kind === 'block') {
      const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(k => [k & 1 ? m.max[0] : m.min[0], k & 2 ? m.max[1] : m.min[1], k & 4 ? m.max[2] : m.min[2]])
      d = polygon(hull(corners.map(paper)))
    } else {
      const ring = z => Array.from({ length: 48 }, (_, k) => paper([m.center[0] + m.radius * Math.cos(k * Math.PI / 24), m.center[1] + m.radius * Math.sin(k * Math.PI / 24), z]))
      d = polygon(hull([...ring(m.z[0]), ...ring(m.z[1])]))
    }
    const tones = m.tone.split(' ').map(t => `c-${t}`).join(' ')
    return `<path class="c ${tones}"${m.holes?.length ? ' fill-rule="evenodd"' : ''} d="${compact(d)}"/>`
  }).join('')
}

/** A part's printed text, projected onto the faces it lies on. */
function textOf(id) {
  return build().marks.filter(m => m.part === id && m.kind === 'text').map((m) => {
    // Text lies in the plane z = at[2]: one millimetre along it and one down
    // its glyphs, carried onto the page, make its transform.
    const a = (m.angle * Math.PI) / 180, o = paper(m.at)
    const u = paper(add(m.at, [Math.cos(a), Math.sin(a), 0])).map((n, i) => n - o[i])
    const w = paper(add(m.at, [Math.sin(a), -Math.cos(a), 0])).map((n, i) => n - o[i])
    const matrix = [...u, ...w, ...o].map(n => Math.round(n * 1000) / 1000).join(' ')
    const anchor = m.anchor === 'start' ? '' : ` text-anchor="${m.anchor}"`
    const weight = m.weight === 400 ? '' : ` font-weight="${m.weight}"`
    return `<text class="${TONES[m.tone]}" transform="matrix(${matrix})" font-size="${m.size}"${anchor}${weight}>${escapeXml(m.text)}</text>`
  }).join('')
}

/** One part's paths, and its marks unless `plain` (proofs compare linework only). */
function partPaths(l, { plain = false } = {}) {
  // Fills trace every triangle corner along a silhouette. Thinned to well
  // inside the outline stroke drawn over their edge, they lose half their bytes.
  const fill = loopPath(loopsOf(l.fill).map(loop => simplify(loop, .12)))
  return [
    fill && `<path class="f" d="${compact(fill)}"/>`,
    !plain && regionsOf(l.id),
    ...ROLES.filter(r => l.ink[r]).map(r => `<path class="${r[0]}" d="${compact(l.ink[r])}"/>`),
    !plain && textOf(l.id),
  ].filter(Boolean).join('')
}

/** A shadow for each moving part: its silhouette, shown faintly on the table while it is in the air. */
const shadowPath = l => compact(loopPath(outerLoops(l.fill).map(loop => simplify(loop, .35))))

const vectorAt = (m, p) => {
  const slide = m.slide ?? [0, 0]
  return [0, 1].map(i => slide[i] * p.slide + (m.to[i] - slide[i]) * p.travel + m.lift[i] * p.lift)
}

/** Corner radius of a callout tag, page pixels. */
const TAG_RADIUS = 4

/** The callouts as the page draws them, for stills: dot, leader and tag. */
function calloutMarkup(shown, palette) {
  const px = box[2] / PAGE_WIDTH, { bg, fg, ring, line } = PALETTES[palette].page
  const width = n => (n * px).toFixed(3)
  return labels.filter(c => shown[c.id]).map((c) => {
    const size = tagSize(c.name, px), [x0, y0] = tagBox(c.end, c.side, size), [w, h] = size
    return [
      `<path d="M${c.dot.join(' ')}L${c.elbow.join(' ')}L${c.end.join(' ')}" style="fill:none;stroke:${line};stroke-width:${width(.75)}px"/>`,
      `<circle cx="${c.dot[0]}" cy="${c.dot[1]}" r="${width(1.7)}" fill="${fg}" stroke="#fff" stroke-width="${width(.8)}"/>`,
      `<rect x="${x0.toFixed(2)}" y="${y0.toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${width(TAG_RADIUS)}" fill="${bg}" stroke="${ring}" stroke-width="${width(.75)}"/>`,
      `<text x="${(x0 + w / 2).toFixed(2)}" y="${(y0 + h / 2 + TAG.font * px * .36).toFixed(2)}" font-size="${width(TAG.font)}" text-anchor="middle" letter-spacing="${width(.04 * TAG.font)}" style="fill:${fg};font-family:Menlo;font-weight:700">${c.name}</text>`,
      // TAG_ROOM=1 in the environment outlines the room each tag needs at its largest.
      process.env.TAG_ROOM ? `<rect x="${c.room[0]}" y="${c.room[1]}" width="${c.room[2] - c.room[0]}" height="${c.room[3] - c.room[1]}" fill="none" stroke="#ef4444" stroke-dasharray="${width(3)}" stroke-width="${width(.75)}"/>` : '',
    ].join('')
  }).join('')
}

/**
 * The drawing. Without `pose` it is the page's version: parts in stack
 * order, assembled, moved later by the component. With a pose it is that
 * moment, in that pose's paint order, without the camera: `plain` for the
 * proofs, which compare linework with the renderer, or with callouts for
 * stills.
 */
function compose({ pose, plain = false, still = false, palette = DEFAULT_PALETTE } = {}) {
  const ordered = pose ? [...layers].sort((a, b) => pose.parts[a.id].order - pose.parts[b.id].order) : layers
  const groups = ordered.map((l) => {
    const t = pose ? vectorAt(motion.parts[l.id], pose.parts[l.id]) : [0, 0]
    const transform = pose && (t[0] || t[1]) ? ` transform="translate(${fmt(t[0])} ${fmt(t[1])})"` : ''
    return `<g data-part="${l.id}"${transform}>${partPaths(l, { plain })}</g>`
  })
  const shadows = pose ? '' : `<g class="shadows">${layers.slice(1).map(l => `<path class="h" data-part="${l.id}" opacity="0" d="${shadowPath(l)}"/>`).join('')}</g>`
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" class="${ROOT}" data-palette="${palette}" viewBox="${box.join(' ')}" width="${box[2]}" height="${box[3]}" aria-hidden="true">`,
    `<style>${stylesheet(pose ? { standalone: true, unit: box[2] / PAGE_WIDTH / (still ? zoomAt(pose.camera) : 1), palettes: [palette] } : { standalone: false })}</style>`,
    pose ? (still ? `<g transform="${cameraAt(pose.camera)}">${groups.join('')}</g>` : groups.join('')) : `<g class="camera">${shadows}<g class="parts">${groups.join('')}</g></g>`,
    still ? calloutMarkup(Object.fromEntries(Object.entries(pose.parts).map(([id, q]) => [id, q.labelled])), palette) : '',
    '</svg>',
  ].join('')
}

/** The camera's transform at `v`, 0 close on the assembled console and 1 on the whole box, as the component writes it. */
const zoomAt = v => camera0.zoom + (1 - camera0.zoom) * v
function cameraAt(v) {
  const { focus } = camera0, centre = [box[0] + box[2] / 2, box[1] + box[3] / 2]
  const k = zoomAt(v), f = focus.map((n, i) => n + (centre[i] - n) * v)
  return `translate(${fmt(centre[0])} ${fmt(centre[1])}) scale(${k.toFixed(4)}) translate(${fmt(-f[0])} ${fmt(-f[1])})`
}

// ---- Placeholder -----------------------------------------------------------------

/** The camera's close-up transform, as the component writes it at camera = 0. */
const closeUp = () => cameraAt(0)

/**
 * The assembled console as one ghost shape, where the drawing will show it
 * at first. The page shows it until the drawing arrives, then fades the
 * drawing in over it.
 */
function placeholder() {
  const ids = new Set(['back-shell', 'front-shell', 'game-card'])
  const d = layers.filter(l => ids.has(l.id)).flatMap(l => outerLoops(l.fill).map(loop => simplify(loop, .3)))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.join(' ')}" aria-hidden="true"><path fill="currentColor" transform="${closeUp()}" d="${compact(loopPath(d))}"/></svg>`
}

// ---- Write ----------------------------------------------------------------------

const banner = what => `<!-- ${what} Generated by scripts/generate-teardown.mjs from tools/teardown/${NAME} — do not edit by hand. -->\n`
await mkdir(outDir, { recursive: true })
const drawing = compose()
const silhouette = placeholder()
await writeFile(join(outDir, `${NAME}.svg`), banner('Home page teardown drawing.') + drawing + '\n')
await writeFile(join(outDir, `${NAME}-placeholder.svg`), silhouette + '\n')
await writeFile(join(outDir, `${NAME}.json`), JSON.stringify(motion, null, 1) + '\n')
const kb = n => `${(n / 1024).toFixed(1)} KB`
console.log(`${NAME}.svg ${kb(drawing.length)} (${kb(brotliCompressSync(drawing).length)} brotli), placeholder ${kb(silhouette.length)}, viewBox ${box.join(' ')}, close-up ×${camera0.zoom}, cycle ${timeline.cycle} ms`)
for (const l of layers) console.log(`  ${l.id.padEnd(13)} ${kb(partPaths(l).length).padStart(8)}  to ${motion.parts[l.id].to.join(', ')}`)

// ---- Proofs -----------------------------------------------------------------------

const PROOF_WIDTH = Number(process.env.PROOF_WIDTH ?? 900)
let Resvg, proofView = null
const proofIndex = process.argv.indexOf('--proof')
if (proofIndex > 0) {
  const proofDir = process.argv[proofIndex + 1]
  if (!proofDir) throw Error('Usage: node scripts/generate-teardown.mjs --proof <dir> [--moments 0,500] [--crop x,y,w,h]')
  await mkdir(proofDir, { recursive: true })
  Resvg = (await import('@resvg/resvg-js')).Resvg
  const option = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1].split(',').map(Number) : null }
  const step = 250
  const moments = option('--moments') ?? Array.from({ length: Math.ceil(timeline.cycle / step) }, (_, i) => i * step)
  proofView = option('--crop')
  // The true drawing at the same moment: every part through the renderer together.
  const truth = (pose) => {
    const posed = build().parts
    for (const p of posed) {
      const q = pose.parts[p.id], slide = slideOf(p.id) ?? [0, 0, 0]
      p.explosion = [0, 1, 2].map(i => slide[i] * q.slide + (spread[p.id][i] - slide[i]) * q.travel + (i === 2 ? liftOf(p.id) * q.lift : 0))
    }
    const result = render(posed)
    const body = result.markup.replace(/<g id="part-frame[\s\S]*?<\/g>/, '').replace(/<g data-fills="">[\s\S]*?<\/g>/, '')
    const roles = Object.entries(WEIGHT_NAMES).map(([c, r]) => `[data-line-role=${r}]{stroke-width:${WEIGHTS[c] * box[2] / PAGE_WIDTH}px;stroke:${SCHEMES[DEFAULT_PALETTE].inks[c]}}`).join('')
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.join(' ')}" width="${box[2]}" height="${box[3]}"><style>path{fill:none;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}${roles}</style>${body}</svg>`
  }
  let worst = 0
  for (const moment of moments) {
    const pose = teardownPose(timeline, moment)
    if (process.argv.includes('--still')) {
      // Just the layered drawing, as the page paints it, in each palette.
      for (const palette of STILL_PALETTES) {
        const still = pixels(compose({ pose, still: true, palette }))
        await writeFile(join(proofDir, `still${String(moment).padStart(5, '0')}-${palette}.png`), encodePng(still.pixels, still.width, still.height))
      }
      continue
    }
    const a = pixels(compose({ pose, plain: true })), b = pixels(truth(pose))
    const { png, onlyLayered, onlyTruth } = triptych(a, b)
    await writeFile(join(proofDir, `t${String(moment).padStart(5, '0')}.png`), png)
    worst = Math.max(worst, onlyLayered + onlyTruth)
    console.log(`proof at ${String(moment).padStart(5)} ms: ${onlyLayered} px only in the layered drawing, ${onlyTruth} px only in the true one`)
  }
  console.log(`worst moment: ${worst} px differ`)
}

// ---- Palette sheet ---------------------------------------------------------------

/**
 * `--sheet <file.png>`: every palette side by side, the assembled console
 * (cropped to it) above the spread with its callouts, as on the page at
 * PROOF_WIDTH pixels. docs/home.md shows it, converted to WebP.
 */
const sheetIndex = process.argv.indexOf('--sheet')
if (sheetIndex > 0) {
  const file = process.argv[sheetIndex + 1]
  if (!file) throw Error('Usage: node scripts/generate-teardown.mjs --sheet <file.png>')
  Resvg ??= (await import('@resvg/resvg-js')).Resvg
  proofView = null
  const uri = image => 'data:image/png;base64,' + encodePng(image.pixels, image.width, image.height).toString('base64')
  const [assembled, spreadOut] = [0, apartAt(timeline) + 1].map(t => teardownPose(timeline, t))
  const M = 32, TITLE = 64
  const cells = Object.keys(PALETTES).map((palette, i) => {
    const whole = pixels(compose({ pose: assembled, still: true, palette }))
    const apart = pixels(compose({ pose: spreadOut, still: true, palette }))
    // The close-up console fills the middle of the frame.
    const crop = [0.13 * whole.width, 0.14 * whole.height, 0.74 * whole.width, 0.72 * whole.height].map(Math.round)
    const x = M + (i % 2) * (apart.width + M), h = TITLE + crop[3] + 12 + apart.height
    return { h, w: apart.width, svg: y => [
      `<rect x="${x - 10}" y="${y - 10}" width="${apart.width + 20}" height="${h + 20}" rx="16" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>`,
      `<text x="${x + 12}" y="${y + 34}" font-family="Menlo" font-size="26" font-weight="700" fill="#0f172a">${palette}</text>`,
      `<text x="${x + 12}" y="${y + 56}" font-family="Menlo" font-size="15" fill="#64748b">${escapeXml(PALETTES[palette].title)}</text>`,
      `<svg x="${x + (apart.width - crop[2]) / 2}" y="${y + TITLE}" width="${crop[2]}" height="${crop[3]}" viewBox="${crop.join(' ')}"><image width="${whole.width}" height="${whole.height}" href="${uri(whole)}"/></svg>`,
      `<image x="${x}" y="${y + TITLE + crop[3] + 12}" width="${apart.width}" height="${apart.height}" href="${uri(apart)}"/>`,
    ].join('') }
  })
  let y = M
  const rows = []
  for (let r = 0; r < cells.length; r += 2) {
    const row = cells.slice(r, r + 2)
    rows.push(row.map(c => c.svg(y)).join(''))
    y += Math.max(...row.map(c => c.h)) + M + 20
  }
  const width = 2 * cells[0].w + 3 * M
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${y}" viewBox="0 0 ${width} ${y}"><rect width="100%" height="100%" fill="#f1f5f9"/>${rows.join('')}</svg>`
  await writeFile(file, new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng())
  console.log(`palette sheet ${width}×${y} → ${file}`)
}

/**
 * RGBA pixels of an SVG rendered PROOF_WIDTH pixels wide, or of the
 * `proofView` rectangle at that width. A crop renders the whole drawing
 * larger and cuts the rectangle out (resvg panics on some cropped viewBoxes).
 */
function pixels(svg) {
  const [, , bw] = box, zoom = proofView ? bw / proofView[2] : 1
  const image = new Resvg(svg, { fitTo: { mode: 'width', value: Math.round(PROOF_WIDTH * zoom) }, background: '#ffffff' }).render()
  // `pixels` is a getter that copies the whole buffer on every read.
  const full = { width: image.width, height: image.height, pixels: image.pixels }
  if (!proofView) return full
  const k = full.width / box[2], x0 = Math.round((proofView[0] - box[0]) * k), y0 = Math.round((proofView[1] - box[1]) * k)
  const width = Math.min(PROOF_WIDTH, full.width - x0), height = Math.min(Math.round(proofView[3] * k), full.height - y0)
  const out = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) full.pixels.copy(out, y * width * 4, ((y0 + y) * full.width + x0) * 4, ((y0 + y) * full.width + x0 + width) * 4)
  return { width, height, pixels: out }
}

/**
 * Layered drawing | true drawing | where they differ: red ink only in the
 * layered drawing, blue ink only in the true one, over the true drawing in grey.
 */
function triptych(a, b) {
  const { width: w, height: h } = a
  const dark = (img, i) => img.pixels[i * 4] < 170
  const out = Buffer.alloc(w * 3 * h * 4, 255)
  let onlyLayered = 0, onlyTruth = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      for (const [img, column] of [[a, 0], [b, 1]]) img.pixels.copy(out, ((y * w * 3) + column * w + x) * 4, i * 4, i * 4 + 4)
      const da = dark(a, i), db = dark(b, i), o = ((y * w * 3) + 2 * w + x) * 4
      const color = da && !db ? [220, 30, 30] : db && !da ? [30, 70, 230] : db ? [200, 200, 200] : [255, 255, 255]
      if (da && !db) onlyLayered++
      if (db && !da) onlyTruth++
      out.set([...color, 255], o)
    }
  }
  return { png: encodePng(out, w * 3, h), onlyLayered, onlyTruth }
}

/** Minimal RGBA PNG encoder, enough for proof sheets. */
function encodePng(rgba, width, height) {
  const rows = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) rgba.copy(rows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
  const crc = buf => { let c = 0xffffffff; for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]), out = Buffer.alloc(body.length + 8)
    out.writeUInt32BE(data.length, 0); body.copy(out, 4); out.writeUInt32BE(crc(body), body.length + 4)
    return out
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header.set([8, 6, 0, 0, 0], 8)
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))])
}
