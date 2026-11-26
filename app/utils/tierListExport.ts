/**
 * Draws a tier list as a PNG in the browser. Nothing is sent anywhere: covers
 * are loaded with CORS (IGDB and our `/media` both send
 * `Access-Control-Allow-Origin: *`), uploads are local `blob:` URLs, so the
 * canvas stays readable and `toBlob` works.
 *
 * `tierExportLayout` is the pure geometry; `renderTierListImage` paints it.
 */
import { tierLabelTextColor } from '~/utils/tierList'

export type TierExportTheme = 'light' | 'dark'

export interface TierExportOptions {
  theme: TierExportTheme
  showTitle: boolean
  showNames: boolean
  watermark: boolean
}

export const TIER_EXPORT_OPTIONS_KEY = 'psray:tierlist-export'

export const DEFAULT_TIER_EXPORT_OPTIONS: TierExportOptions = {
  theme: 'light',
  showTitle: true,
  showNames: false,
  watermark: true,
}

export function parseTierExportOptions(json: string | null | undefined): TierExportOptions {
  const options = { ...DEFAULT_TIER_EXPORT_OPTIONS }
  if (!json) return options
  try {
    const raw = JSON.parse(json) as Partial<Record<keyof TierExportOptions, unknown>>
    if (raw.theme === 'light' || raw.theme === 'dark') options.theme = raw.theme
    for (const key of ['showTitle', 'showNames', 'watermark'] as const) {
      if (typeof raw[key] === 'boolean') options[key] = raw[key]
    }
  }
  catch {}
  return options
}

export interface TierExportItem {
  name: string
  /** Image URL; `null` draws a placeholder with the name. */
  src: string | null
  color: string | null
}

export interface TierExportRow {
  label: string
  color: string
  items: TierExportItem[]
}

export interface TierExportInput {
  title: string
  rows: TierExportRow[]
  /** Shown at the bottom right next to the watermark. */
  date: string
  /** Shown after the brand name in the watermark. */
  site: string
}

/** Sizes in CSS pixels; the canvas is drawn at `scale` times these. */
export const TIER_EXPORT_METRICS = {
  width: 1120,
  pad: 32,
  labelWidth: 112,
  itemWidth: 72,
  itemHeight: 96,
  gap: 6,
  inset: 6,
  nameHeight: 30,
  titleSize: 30,
  titleGap: 18,
  footerGap: 16,
  footerHeight: 22,
  scale: 2,
  /** Safari refuses canvases above about 16.7 million pixels. */
  maxPixels: 16_000_000,
} as const

export interface TierExportLayout {
  width: number
  height: number
  scale: number
  perLine: number
  cellHeight: number
  /** Baseline-free top of the title text, or `null` when hidden. */
  titleTop: number | null
  board: { x: number, y: number, width: number, height: number }
  rows: { y: number, height: number, items: { x: number, y: number }[] }[]
  /** Top of the watermark line, or `null` when hidden. */
  footerTop: number | null
}

export function tierExportLayout(input: Pick<TierExportInput, 'rows'>, options: Pick<TierExportOptions, 'showTitle' | 'showNames' | 'watermark'>): TierExportLayout {
  const m = TIER_EXPORT_METRICS
  const boardX = m.pad
  const boardWidth = m.width - m.pad * 2
  const itemsX = boardX + m.labelWidth + m.inset
  const itemsWidth = boardWidth - m.labelWidth - m.inset * 2
  const perLine = Math.max(1, Math.floor((itemsWidth + m.gap) / (m.itemWidth + m.gap)))
  const cellHeight = m.itemHeight + (options.showNames ? m.nameHeight : 0)

  let y = m.pad
  let titleTop: number | null = null
  if (options.showTitle) {
    titleTop = y
    y += Math.round(m.titleSize * 1.25) + m.titleGap
  }

  const boardY = y
  const rows = input.rows.map((row) => {
    const lines = Math.max(1, Math.ceil(row.items.length / perLine))
    const height = m.inset * 2 + lines * cellHeight + (lines - 1) * m.gap
    const items = row.items.map((_, index) => ({
      x: itemsX + (index % perLine) * (m.itemWidth + m.gap),
      y: y + m.inset + Math.floor(index / perLine) * (cellHeight + m.gap),
    }))
    const placed = { y, height, items }
    y += height
    return placed
  })
  const board = { x: boardX, y: boardY, width: boardWidth, height: y - boardY }

  let footerTop: number | null = null
  if (options.watermark) {
    footerTop = y + m.footerGap
    y = footerTop + m.footerHeight
  }
  const height = y + m.pad
  const scale = Math.min(m.scale, Math.sqrt(m.maxPixels / (m.width * height)))
  return { width: m.width, height, scale, perLine, cellHeight, titleTop, board, rows, footerTop }
}

// ---------- painting ----------

const THEMES = {
  light: { bg: '#ffffff', text: '#0f172a', muted: '#94a3b8', border: '#e2e8f0', row: '#ffffff', placeholder: '#e2e8f0', placeholderText: '#475569', name: '#334155' },
  dark: { bg: '#020617', text: '#f8fafc', muted: '#64748b', border: '#1e293b', row: '#0f172a', placeholder: '#1e293b', placeholderText: '#cbd5e1', name: '#cbd5e1' },
} as const

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** Greedy wrap that breaks CJK anywhere and Latin at spaces; ellipsizes past `maxLines`. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const ch of Array.from(text.trim().replace(/\s+/g, ' '))) {
    const next = line + ch
    if (!line || ctx.measureText(next).width <= maxWidth) {
      line = next
      continue
    }
    let carry = ch
    const space = line.lastIndexOf(' ')
    if (ch !== ' ' && space > 0 && /[\p{L}\p{N}]$/u.test(line) && /[\p{L}\p{N}]/u.test(ch) && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(ch)) {
      carry = line.slice(space + 1) + ch
      line = line.slice(0, space)
    }
    lines.push(line.trimEnd())
    line = carry.trimStart()
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]!
  while (last && ctx.measureText(`${last}…`).width > maxWidth) last = Array.from(last).slice(0, -1).join('')
  kept[maxLines - 1] = `${last.trimEnd()}…`
  return kept
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    if (/^https?:/i.test(src) && new URL(src, location.href).origin !== location.origin) img.crossOrigin = 'anonymous'
    const timer = window.setTimeout(() => resolve(null), 15_000)
    img.onload = () => {
      window.clearTimeout(timer)
      resolve(img.naturalWidth ? img : null)
    }
    img.onerror = () => {
      window.clearTimeout(timer)
      resolve(null)
    }
    img.src = src
  })
}

async function loadImages(sources: string[]): Promise<Map<string, HTMLImageElement | null>> {
  const unique = [...new Set(sources)]
  const loaded = new Map<string, HTMLImageElement | null>()
  let next = 0
  const worker = async () => {
    while (next < unique.length) {
      const src = unique[next++]!
      loaded.set(src, await loadImage(src))
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, unique.length) }, worker))
  return loaded
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ratio = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / ratio
  const sh = h / ratio
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h)
}

/** Label size by length: a letter or two big, a word smaller, a phrase small and wrapped. */
function labelFont(label: string): { size: number, lineHeight: number, maxLines: number } {
  const length = Array.from(label.trim()).length
  if (length <= 2) return { size: 34, lineHeight: 40, maxLines: 1 }
  if (length <= 4) return { size: 24, lineHeight: 30, maxLines: 2 }
  return { size: 15, lineHeight: 19, maxLines: 4 }
}

export interface TierExportEnvironment {
  /** CSS font-family list, e.g. the page's own. */
  fontFamily: string
  /** Same-origin brand mark for the watermark. */
  logo: string | null
}

export async function renderTierListImage(
  input: TierExportInput,
  options: TierExportOptions,
  env: TierExportEnvironment,
): Promise<{ blob: Blob, missing: number }> {
  const m = TIER_EXPORT_METRICS
  const layout = tierExportLayout(input, options)
  const theme = THEMES[options.theme]
  const family = env.fontFamily

  // Canvas text doesn't wait for web fonts; load the slices this text needs first.
  const names = input.rows.flatMap(row => row.items.map(item => item.name)).join('')
  await Promise.allSettled([
    document.fonts.load(`700 ${m.titleSize}px ${family}`, input.title || 'A'),
    document.fonts.load(`700 34px ${family}`, input.rows.map(row => row.label).join('') || 'A'),
    document.fonts.load(`500 11px ${family}`, names || 'A'),
    document.fonts.load(`400 12px ${family}`, `${input.site}${input.date}PSRay`),
  ])

  const sources = input.rows.flatMap(row => row.items.map(item => item.src)).filter((src): src is string => Boolean(src))
  const [images, logo] = await Promise.all([loadImages(sources), env.logo ? loadImage(env.logo) : Promise.resolve(null)])

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(layout.width * layout.scale)
  canvas.height = Math.round(layout.height * layout.scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  ctx.scale(layout.scale, layout.scale)
  ctx.textBaseline = 'middle'

  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, layout.width, layout.height)

  if (layout.titleTop !== null) {
    ctx.fillStyle = theme.text
    ctx.font = `700 ${m.titleSize}px ${family}`
    ctx.textAlign = 'left'
    const [title] = wrapLines(ctx, input.title, layout.board.width, 1)
    ctx.fillText(title ?? '', layout.board.x, layout.titleTop + (m.titleSize * 1.25) / 2)
  }

  // Board: rounded frame, rows separated by hairlines.
  const { board } = layout
  ctx.save()
  roundedRect(ctx, board.x, board.y, board.width, board.height, 6)
  ctx.clip()
  ctx.fillStyle = theme.row
  ctx.fillRect(board.x, board.y, board.width, board.height)

  let missing = 0
  input.rows.forEach((row, rowIndex) => {
    const placed = layout.rows[rowIndex]!
    ctx.fillStyle = row.color
    ctx.fillRect(board.x, placed.y, m.labelWidth, placed.height)

    const font = labelFont(row.label)
    ctx.font = `700 ${font.size}px ${family}`
    ctx.fillStyle = tierLabelTextColor(row.color)
    ctx.textAlign = 'center'
    const lines = wrapLines(ctx, row.label, m.labelWidth - 16, font.maxLines)
    const top = placed.y + placed.height / 2 - (lines.length * font.lineHeight) / 2
    lines.forEach((line, i) => ctx.fillText(line, board.x + m.labelWidth / 2, top + font.lineHeight * (i + 0.5)))

    row.items.forEach((item, itemIndex) => {
      const { x, y } = placed.items[itemIndex]!
      const img = item.src ? images.get(item.src) ?? null : null
      ctx.save()
      roundedRect(ctx, x, y, m.itemWidth, m.itemHeight, 3)
      ctx.clip()
      if (img) {
        drawCover(ctx, img, x, y, m.itemWidth, m.itemHeight)
      }
      else {
        if (item.src) missing++
        ctx.fillStyle = item.color ?? theme.placeholder
        ctx.fillRect(x, y, m.itemWidth, m.itemHeight)
        ctx.fillStyle = item.color ? tierLabelTextColor(item.color) : theme.placeholderText
        ctx.font = `600 11px ${family}`
        const nameLines = wrapLines(ctx, item.name, m.itemWidth - 10, 5)
        const nameTop = y + m.itemHeight / 2 - (nameLines.length * 14) / 2
        nameLines.forEach((line, i) => ctx.fillText(line, x + m.itemWidth / 2, nameTop + 14 * (i + 0.5)))
      }
      ctx.restore()

      if (options.showNames) {
        ctx.fillStyle = theme.name
        ctx.font = `500 11px ${family}`
        ctx.textAlign = 'center'
        const nameLines = wrapLines(ctx, item.name, m.itemWidth, 2)
        nameLines.forEach((line, i) => ctx.fillText(line, x + m.itemWidth / 2, y + m.itemHeight + 4 + 13 * (i + 0.5)))
      }
    })

    if (rowIndex > 0) {
      ctx.fillStyle = theme.border
      ctx.fillRect(board.x, placed.y, board.width, 1)
    }
  })
  ctx.restore()

  ctx.strokeStyle = theme.border
  ctx.lineWidth = 1
  roundedRect(ctx, board.x + 0.5, board.y + 0.5, board.width - 1, board.height - 1, 6)
  ctx.stroke()

  if (layout.footerTop !== null) {
    const mid = layout.footerTop + m.footerHeight / 2
    let x = board.x
    if (logo) {
      if (options.theme === 'dark') {
        ctx.fillStyle = '#ffffff'
        roundedRect(ctx, x, mid - 11, 22, 22, 6)
        ctx.fill()
        ctx.drawImage(logo, x + 3, mid - 8, 16, 16)
      }
      else {
        ctx.drawImage(logo, x, mid - 10, 20, 20)
      }
      x += 28
    }
    ctx.textAlign = 'left'
    ctx.fillStyle = theme.text
    ctx.font = `700 13px ${family}`
    ctx.fillText('PSRay', x, mid)
    x += ctx.measureText('PSRay').width + 8
    ctx.fillStyle = theme.muted
    ctx.font = `400 12px ${family}`
    ctx.fillText(input.site, x, mid)
    ctx.textAlign = 'right'
    ctx.fillText(input.date, board.x + board.width, mid)
  }

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Canvas export failed')
  return { blob, missing }
}
