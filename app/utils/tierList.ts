/**
 * Tier list maker (`/tools/tierlist`): the data model and every edit to it, as
 * plain functions so they can be tested without a browser.
 *
 * Everything lives on the visitor's device. Lists are one JSON document in
 * localStorage (`TIER_STORE_KEY`); uploaded images are blobs in IndexedDB (see
 * `tierListImages.ts`) and a list only refers to them by id.
 *
 * The edit functions change the list they are given in place (the editor hands
 * them its reactive copy) and return whether anything changed.
 */
import type { GameBrowseItem } from '~/services/games'
import type { MediaImage } from '~/types/media'

export const TIER_STORE_KEY = 'psray:tierlists'
export const TIER_STORE_VERSION = 1

/** Swatches offered for a row, in the order of the default tiers. */
export const TIER_COLORS = [
  '#f87171', '#fb923c', '#fcd34d', '#bef264', '#6ee7b7',
  '#7dd3fc', '#a5b4fc', '#f0abfc', '#cbd5e1', '#334155',
] as const

/** A new list starts with these rows. */
export const DEFAULT_TIERS: readonly { label: string, color: string }[] = [
  { label: 'S', color: '#f87171' },
  { label: 'A', color: '#fb923c' },
  { label: 'B', color: '#fcd34d' },
  { label: 'C', color: '#bef264' },
  { label: 'D', color: '#6ee7b7' },
  { label: 'F', color: '#7dd3fc' },
]

export const TIER_LIMITS = {
  lists: 50,
  rows: 20,
  items: 500,
  title: 80,
  label: 32,
} as const

/** Zone id of the unranked items. Rows use their own ids. */
export const TIER_POOL = 'pool'

export type TierItemSource = 'game' | 'upload'

export interface TierItem {
  /** `g<game id>` or `u<image id>`, so the same game or image is never in a list twice. */
  id: string
  source: TierItemSource
  name: string
  /** A game's cover URL; `null` for uploads (the blob is looked up by `imageId`) and games without one. */
  cover: string | null
  /** Average colour of the cover, shown while it loads. */
  color: string | null
  gameId?: number
  imageId?: string
}

export interface TierRow {
  id: string
  label: string
  /** `#rrggbb` */
  color: string
  /** Item ids, in order. */
  items: string[]
}

export interface TierList {
  id: string
  title: string
  rows: TierRow[]
  /** Unranked item ids, in order. */
  pool: string[]
  /** Every item in the list, ranked or not. */
  items: Record<string, TierItem>
  createdAt: number
  updatedAt: number
}

export interface TierStore {
  version: typeof TIER_STORE_VERSION
  activeId: string | null
  lists: TierList[]
}

export function newTierId(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export function createTierRow(label: string, color: string): TierRow {
  return { id: newTierId('r'), label, color, items: [] }
}

export function createTierList(title: string, now = Date.now()): TierList {
  return {
    id: newTierId('l'),
    title,
    rows: DEFAULT_TIERS.map(tier => createTierRow(tier.label, tier.color)),
    pool: [],
    items: {},
    createdAt: now,
    updatedAt: now,
  }
}

/** A copy with fresh list and row ids; items keep theirs (they name a game or an image). */
export function duplicateTierList(list: TierList, title: string, now = Date.now()): TierList {
  const copy = JSON.parse(JSON.stringify(list)) as TierList
  copy.id = newTierId('l')
  copy.title = title
  copy.rows = copy.rows.map(row => ({ ...row, id: newTierId('r') }))
  copy.createdAt = now
  copy.updatedAt = now
  return copy
}

/** The smallest variant of a cover that still looks sharp at board size. */
export function tierCoverUrl(cover: MediaImage | null): string | null {
  if (!cover) return null
  if (cover.srcset) {
    const smallest = cover.srcset
      .split(',')
      .map((part) => {
        const [url, width] = part.trim().split(/\s+/)
        return { url, width: Number.parseInt(width ?? '', 10) }
      })
      .filter((candidate): candidate is { url: string, width: number } => Boolean(candidate.url) && Number.isFinite(candidate.width))
      .sort((a, b) => a.width - b.width)[0]
    if (smallest) return smallest.url
  }
  // A cover not yet copied locally is IGDB's 2x original; its 1x size is plenty here.
  return cover.url.replace('/t_cover_big_2x/', '/t_cover_big/')
}

export const gameItemId = (gameId: number) => `g${gameId}`
export const uploadItemId = (imageId: string) => `u${imageId}`

export function itemFromGame(game: GameBrowseItem): TierItem {
  return {
    id: gameItemId(game.id),
    source: 'game',
    name: game.localized_name,
    cover: tierCoverUrl(game.cover),
    color: game.cover?.color ?? null,
    gameId: game.id,
  }
}

export function itemFromUpload(image: { id: string, name: string }): TierItem {
  return { id: uploadItemId(image.id), source: 'upload', name: image.name, cover: null, color: null, imageId: image.id }
}

export function itemCount(list: TierList): number {
  return Object.keys(list.items).length
}

export function placedCount(list: TierList): number {
  return list.rows.reduce((sum, row) => sum + row.items.length, 0)
}

/** The item ids of a zone (a row id or `TIER_POOL`); `null` for an unknown zone. */
export function zoneItems(list: TierList, zone: string): string[] | null {
  if (zone === TIER_POOL) return list.pool
  return list.rows.find(row => row.id === zone)?.items ?? null
}

export function locateItem(list: TierList, itemId: string): { zone: string, index: number } | null {
  const inPool = list.pool.indexOf(itemId)
  if (inPool >= 0) return { zone: TIER_POOL, index: inPool }
  for (const row of list.rows) {
    const index = row.items.indexOf(itemId)
    if (index >= 0) return { zone: row.id, index }
  }
  return null
}

const clampIndex = (index: number | undefined, length: number) =>
  index === undefined || !Number.isFinite(index) ? length : Math.max(0, Math.min(Math.trunc(index), length))

/**
 * Adds an item to a zone (the pool by default), at `index` or the end. Does
 * nothing when the list already has it, is full, or the zone is unknown.
 */
export function addItem(list: TierList, item: TierItem, zone = TIER_POOL, index?: number): boolean {
  if (list.items[item.id] || itemCount(list) >= TIER_LIMITS.items) return false
  const target = zoneItems(list, zone)
  if (!target) return false
  list.items[item.id] = item
  target.splice(clampIndex(index, target.length), 0, item.id)
  return true
}

/**
 * Moves an item to `index` in a zone. The index counts the zone's items
 * without the moved one, which is what a drag shows while it is under way.
 */
export function moveItem(list: TierList, itemId: string, zone: string, index?: number): boolean {
  const from = locateItem(list, itemId)
  const target = zoneItems(list, zone)
  if (!from || !target) return false
  const source = zoneItems(list, from.zone)!
  source.splice(from.index, 1)
  const at = clampIndex(index, target.length)
  target.splice(at, 0, itemId)
  return from.zone !== zone || from.index !== at
}

export function removeItem(list: TierList, itemId: string): boolean {
  const at = locateItem(list, itemId)
  if (at) zoneItems(list, at.zone)!.splice(at.index, 1)
  if (!list.items[itemId]) return Boolean(at)
  delete list.items[itemId]
  return true
}

/** Inserts a row at `index` (the end by default), taking the next unused swatch. */
export function insertRow(list: TierList, index?: number, label = ''): TierRow | null {
  if (list.rows.length >= TIER_LIMITS.rows) return null
  const used = new Set(list.rows.map(row => row.color))
  const color = TIER_COLORS.find(swatch => !used.has(swatch)) ?? TIER_COLORS[list.rows.length % TIER_COLORS.length]!
  const row = createTierRow(label, color)
  list.rows.splice(clampIndex(index, list.rows.length), 0, row)
  return row
}

/** Puts a row's items back at the start of the pool, in their ranked order. */
export function clearRow(list: TierList, rowId: string): boolean {
  const row = list.rows.find(candidate => candidate.id === rowId)
  if (!row?.items.length) return false
  list.pool.unshift(...row.items)
  row.items = []
  return true
}

/** Deletes a row; its items go back to the pool. A list keeps at least one row. */
export function removeRow(list: TierList, rowId: string): boolean {
  const index = list.rows.findIndex(row => row.id === rowId)
  if (index < 0 || list.rows.length <= 1) return false
  clearRow(list, rowId)
  list.rows.splice(index, 1)
  return true
}

/** Moves a row to `index`, counted without the row itself. */
export function moveRow(list: TierList, rowId: string, index: number): boolean {
  const from = list.rows.findIndex(row => row.id === rowId)
  if (from < 0) return false
  const [row] = list.rows.splice(from, 1)
  const at = clampIndex(index, list.rows.length)
  list.rows.splice(at, 0, row!)
  return from !== at
}

/** Sends every ranked item back to the pool, ahead of the unranked ones, in tier order. */
export function resetPlacements(list: TierList): boolean {
  const ranked = list.rows.flatMap(row => row.items)
  if (!ranked.length) return false
  list.pool.unshift(...ranked)
  for (const row of list.rows) row.items = []
  return true
}

/** Text colour that reads on a row's label colour. */
export function tierLabelTextColor(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return '#0f172a'
  const value = Number.parseInt(match[1]!, 16)
  const channel = (shift: number) => {
    const c = ((value >> shift) & 255) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0)
  return luminance > 0.35 ? '#0f172a' : '#ffffff'
}

/** A download name from the list title, without characters file systems reject. */
export function tierListFileName(title: string): string {
  const base = title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
  return `${base || 'tier-list'}.png`
}

// ---------- reading stored data ----------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown, max: number, fallback = '') =>
  typeof value === 'string' ? value.slice(0, max) : fallback

const HEX = /^#[0-9a-f]{6}$/i

function parseItem(id: string, raw: unknown): TierItem | null {
  if (!isRecord(raw)) return null
  const source = raw.source === 'game' || raw.source === 'upload' ? raw.source : null
  if (!source) return null
  const item: TierItem = {
    id,
    source,
    name: text(raw.name, 200),
    cover: typeof raw.cover === 'string' && /^https?:\/\//.test(raw.cover) ? raw.cover : null,
    color: typeof raw.color === 'string' && HEX.test(raw.color) ? raw.color : null,
  }
  if (source === 'game') {
    if (typeof raw.gameId !== 'number' || id !== gameItemId(raw.gameId)) return null
    item.gameId = raw.gameId
  }
  else {
    if (typeof raw.imageId !== 'string' || id !== uploadItemId(raw.imageId)) return null
    item.imageId = raw.imageId
  }
  return item
}

function parseList(raw: unknown): TierList | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id) return null
  const items: Record<string, TierItem> = {}
  if (isRecord(raw.items)) {
    for (const [id, value] of Object.entries(raw.items)) {
      if (Object.keys(items).length >= TIER_LIMITS.items) break
      const item = parseItem(id, value)
      if (item) items[id] = item
    }
  }
  // Each item sits in exactly one zone; unknown or repeated ids are dropped.
  const seen = new Set<string>()
  const ids = (value: unknown) => (Array.isArray(value) ? value : []).filter((id): id is string => {
    if (typeof id !== 'string' || !items[id] || seen.has(id)) return false
    seen.add(id)
    return true
  })
  const rows: TierRow[] = []
  for (const row of Array.isArray(raw.rows) ? raw.rows : []) {
    if (!isRecord(row) || typeof row.id !== 'string' || rows.length >= TIER_LIMITS.rows) continue
    if (rows.some(existing => existing.id === row.id)) continue
    rows.push({
      id: row.id,
      label: text(row.label, TIER_LIMITS.label),
      color: typeof row.color === 'string' && HEX.test(row.color) ? row.color : '#cbd5e1',
      items: ids(row.items),
    })
  }
  if (!rows.length) rows.push(createTierRow('S', DEFAULT_TIERS[0]!.color))
  const pool = ids(raw.pool)
  // Items no zone mentions are kept, unranked.
  for (const id of Object.keys(items)) if (!seen.has(id)) pool.push(id)
  const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : Date.now()
  return {
    id: raw.id,
    title: text(raw.title, TIER_LIMITS.title),
    rows,
    pool,
    items,
    createdAt,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : createdAt,
  }
}

/** Reads the stored JSON, dropping whatever doesn't fit the model. Never throws. */
export function parseTierStore(json: string | null | undefined): TierStore {
  const empty: TierStore = { version: TIER_STORE_VERSION, activeId: null, lists: [] }
  if (!json) return empty
  let raw: unknown
  try {
    raw = JSON.parse(json)
  }
  catch {
    return empty
  }
  if (!isRecord(raw) || raw.version !== TIER_STORE_VERSION) return empty
  const lists: TierList[] = []
  for (const value of Array.isArray(raw.lists) ? raw.lists : []) {
    const list = parseList(value)
    if (list && lists.length < TIER_LIMITS.lists && !lists.some(existing => existing.id === list.id)) lists.push(list)
  }
  const activeId = typeof raw.activeId === 'string' && lists.some(list => list.id === raw.activeId)
    ? raw.activeId
    : lists[0]?.id ?? null
  return { version: TIER_STORE_VERSION, activeId, lists }
}
