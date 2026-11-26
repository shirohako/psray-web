import { describe, expect, it } from 'vitest'
import {
  addItem,
  clearRow,
  createTierList,
  DEFAULT_TIERS,
  duplicateTierList,
  insertRow,
  itemFromGame,
  itemFromUpload,
  locateItem,
  moveItem,
  moveRow,
  parseTierStore,
  placedCount,
  removeItem,
  removeRow,
  resetPlacements,
  TIER_LIMITS,
  TIER_POOL,
  TIER_STORE_VERSION,
  tierCoverUrl,
  tierLabelTextColor,
  tierListFileName,
  type TierItem,
  type TierList,
} from '~/utils/tierList'
import { DEFAULT_TIER_EXPORT_OPTIONS, parseTierExportOptions, TIER_EXPORT_METRICS, tierExportLayout } from '~/utils/tierListExport'
import { imageNameFromFile } from '~/utils/tierListImages'
import type { GameBrowseItem } from '~/services/games'

const game = (id: number): TierItem => ({ id: `g${id}`, source: 'game', name: `Game ${id}`, cover: null, color: null, gameId: id })

function listWith(pool: number[], ranked: Record<number, number[]> = {}): TierList {
  const list = createTierList('Test', 1000)
  for (const id of pool) addItem(list, game(id))
  for (const [row, ids] of Object.entries(ranked)) {
    for (const id of ids) addItem(list, game(id), list.rows[Number(row)]!.id)
  }
  return list
}

const ids = (values: string[]) => values.map(id => Number(id.slice(1)))

describe('tier list model', () => {
  it('starts with the default tiers and an empty pool', () => {
    const list = createTierList('Mine', 1000)
    expect(list.rows.map(row => row.label)).toEqual(DEFAULT_TIERS.map(tier => tier.label))
    expect(list.pool).toEqual([])
    expect(list.createdAt).toBe(1000)
    expect(new Set(list.rows.map(row => row.id)).size).toBe(list.rows.length)
  })

  it('adds an item once, at the end or at an index', () => {
    const list = listWith([1, 2])
    expect(addItem(list, game(3), TIER_POOL, 1)).toBe(true)
    expect(ids(list.pool)).toEqual([1, 3, 2])
    expect(addItem(list, game(3))).toBe(false)
    expect(addItem(list, game(4), 'no-such-row')).toBe(false)
    expect(list.items.g4).toBeUndefined()
  })

  it('stops adding at the item limit', () => {
    const list = createTierList('Full')
    for (let id = 0; id < TIER_LIMITS.items; id++) addItem(list, game(id))
    expect(addItem(list, game(TIER_LIMITS.items))).toBe(false)
  })

  it('moves an item between zones, counting the index without the item', () => {
    const list = listWith([1, 2, 3], { 0: [4, 5] })
    const s = list.rows[0]!.id
    expect(moveItem(list, 'g2', s, 1)).toBe(true)
    expect(ids(list.rows[0]!.items)).toEqual([4, 2, 5])
    expect(ids(list.pool)).toEqual([1, 3])
    // Within one zone: to the end, then back to the start.
    expect(moveItem(list, 'g4', s, 2)).toBe(true)
    expect(ids(list.rows[0]!.items)).toEqual([2, 5, 4])
    expect(moveItem(list, 'g4', s, 0)).toBe(true)
    expect(ids(list.rows[0]!.items)).toEqual([4, 2, 5])
    // Dropped where it already was.
    expect(moveItem(list, 'g2', s, 1)).toBe(false)
    expect(locateItem(list, 'g5')).toEqual({ zone: s, index: 2 })
  })

  it('clamps a move past the end and ignores unknown items or zones', () => {
    const list = listWith([1, 2])
    const a = list.rows[1]!.id
    expect(moveItem(list, 'g1', a, 99)).toBe(true)
    expect(ids(list.rows[1]!.items)).toEqual([1])
    expect(moveItem(list, 'g9', a, 0)).toBe(false)
    expect(moveItem(list, 'g2', 'nope', 0)).toBe(false)
    expect(ids(list.pool)).toEqual([2])
  })

  it('removes an item from its zone and the list', () => {
    const list = listWith([1], { 2: [2] })
    expect(removeItem(list, 'g2')).toBe(true)
    expect(list.rows[2]!.items).toEqual([])
    expect(list.items.g2).toBeUndefined()
    expect(removeItem(list, 'g2')).toBe(false)
  })

  it('inserts rows with an unused colour, up to the limit', () => {
    const list = createTierList('Rows')
    const row = insertRow(list, 1, 'S+')!
    expect(list.rows[1]).toBe(row)
    expect(list.rows.filter(other => other.color === row.color)).toHaveLength(1)
    while (list.rows.length < TIER_LIMITS.rows) insertRow(list)
    expect(insertRow(list)).toBeNull()
  })

  it('clears and deletes rows into the front of the pool, keeping one row', () => {
    const list = listWith([1], { 0: [2, 3], 1: [4] })
    expect(clearRow(list, list.rows[0]!.id)).toBe(true)
    expect(ids(list.pool)).toEqual([2, 3, 1])
    expect(clearRow(list, list.rows[0]!.id)).toBe(false)
    expect(removeRow(list, list.rows[1]!.id)).toBe(true)
    expect(ids(list.pool)).toEqual([4, 2, 3, 1])
    while (list.rows.length > 1) removeRow(list, list.rows[0]!.id)
    expect(removeRow(list, list.rows[0]!.id)).toBe(false)
  })

  it('reorders rows', () => {
    const list = createTierList('Order')
    const [s, a, b] = list.rows
    expect(moveRow(list, s!.id, 2)).toBe(true)
    expect(list.rows.slice(0, 3)).toEqual([a, b, s])
    expect(moveRow(list, s!.id, 2)).toBe(false)
  })

  it('resets placements in tier order ahead of the pool', () => {
    const list = listWith([1], { 0: [2], 3: [3, 4] })
    expect(placedCount(list)).toBe(3)
    expect(resetPlacements(list)).toBe(true)
    expect(ids(list.pool)).toEqual([2, 3, 4, 1])
    expect(placedCount(list)).toBe(0)
    expect(resetPlacements(list)).toBe(false)
  })

  it('duplicates with new list and row ids', () => {
    const list = listWith([1], { 0: [2] })
    const copy = duplicateTierList(list, 'Copy', 5000)
    expect(copy.id).not.toBe(list.id)
    expect(copy.title).toBe('Copy')
    expect(copy.rows[0]!.id).not.toBe(list.rows[0]!.id)
    expect(ids(copy.rows[0]!.items)).toEqual([2])
    copy.pool.push('g9')
    expect(list.pool).toEqual(['g1'])
  })
})

describe('tier list items', () => {
  const browse = (cover: GameBrowseItem['cover']): GameBrowseItem => ({
    id: 7,
    name: 'Name',
    localized_name: 'ローカル名',
    display_language: 'ja',
    cover,
    first_release_date: null,
    first_release_precision: null,
    platforms: [],
    trophy_set_count: 0,
  })

  it('takes the smallest srcset variant, or the 1x IGDB size', () => {
    const media = 'https://api.psray.net/media/game-cover/w3/x'
    expect(tierCoverUrl({ id: 'x', url: `${media}/lg.webp`, width: 528, height: 704, color: '#000000', srcset: `${media}/lg.webp 528w, ${media}/sm.webp 300w` }))
      .toBe(`${media}/sm.webp`)
    expect(tierCoverUrl({ id: null, url: 'https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co1.jpg', width: null, height: null, color: null, srcset: null }))
      .toBe('https://images.igdb.com/igdb/image/upload/t_cover_big/co1.jpg')
    expect(tierCoverUrl(null)).toBeNull()
  })

  it('builds items from games and uploads', () => {
    expect(itemFromGame(browse(null))).toEqual({ id: 'g7', source: 'game', name: 'ローカル名', cover: null, color: null, gameId: 7 })
    expect(itemFromUpload({ id: 'abc', name: 'Me' })).toEqual({ id: 'uabc', source: 'upload', name: 'Me', cover: null, color: null, imageId: 'abc' })
    expect(imageNameFromFile('Screenshot 2026.PNG')).toBe('Screenshot 2026')
    expect(imageNameFromFile('.png')).toBe('image')
  })

  it('picks readable label text and safe file names', () => {
    expect(tierLabelTextColor('#fcd34d')).toBe('#0f172a')
    expect(tierLabelTextColor('#334155')).toBe('#ffffff')
    expect(tierLabelTextColor('bad')).toBe('#0f172a')
    expect(tierListFileName('2025: Best/Worst?')).toBe('2025 Best Worst.png')
    expect(tierListFileName('  ')).toBe('tier-list.png')
  })
})

describe('stored tier lists', () => {
  it('round-trips a store', () => {
    const list = listWith([1], { 0: [2] })
    const store = { version: TIER_STORE_VERSION, activeId: list.id, lists: [list] }
    expect(parseTierStore(JSON.stringify(store))).toEqual(store)
  })

  it('returns an empty store for missing, broken or foreign data', () => {
    const empty = { version: TIER_STORE_VERSION, activeId: null, lists: [] }
    expect(parseTierStore(null)).toEqual(empty)
    expect(parseTierStore('{')).toEqual(empty)
    expect(parseTierStore('{"version":99,"lists":[]}')).toEqual(empty)
  })

  it('drops invalid items and repeats, and keeps unplaced items in the pool', () => {
    const json = JSON.stringify({
      version: TIER_STORE_VERSION,
      activeId: 'missing',
      lists: [{
        id: 'l1',
        title: 'x'.repeat(200),
        rows: [
          { id: 'r1', label: 'S', color: 'red', items: ['g1', 'g1', 'g404', 5] },
          { id: 'r1', label: 'dupe', color: '#ffffff', items: [] },
        ],
        pool: ['g1'],
        items: {
          g1: { source: 'game', name: 'One', gameId: 1, cover: 'javascript:alert(1)' },
          g2: { source: 'game', name: 'Two', gameId: 2 },
          g3: { source: 'game', name: 'Wrong id', gameId: 4 },
          uabc: { source: 'upload', name: 'Pic', imageId: 'abc' },
        },
      }],
    })
    const store = parseTierStore(json)
    expect(store.activeId).toBe('l1')
    const [list] = store.lists
    expect(list!.title).toHaveLength(TIER_LIMITS.title)
    expect(list!.rows).toHaveLength(1)
    expect(list!.rows[0]).toMatchObject({ color: '#cbd5e1', items: ['g1'] })
    expect(list!.pool).toEqual(['g2', 'uabc'])
    expect(list!.items.g1!.cover).toBeNull()
    expect(list!.items.g3).toBeUndefined()
  })

  it('gives a list without rows one row', () => {
    const store = parseTierStore(JSON.stringify({ version: TIER_STORE_VERSION, lists: [{ id: 'l1', rows: [], items: {} }] }))
    expect(store.lists[0]!.rows).toHaveLength(1)
  })
})

describe('tier list export', () => {
  const row = (count: number) => ({ label: 'S', color: '#f87171', items: Array.from({ length: count }, () => ({ name: 'x', src: null, color: null })) })

  it('reads saved options over the defaults', () => {
    expect(parseTierExportOptions(null)).toEqual(DEFAULT_TIER_EXPORT_OPTIONS)
    expect(parseTierExportOptions('{"theme":"dark","showNames":true,"watermark":"no"}'))
      .toEqual({ ...DEFAULT_TIER_EXPORT_OPTIONS, theme: 'dark', showNames: true })
    expect(parseTierExportOptions('nope')).toEqual(DEFAULT_TIER_EXPORT_OPTIONS)
  })

  it('wraps items into lines and stacks rows', () => {
    const m = TIER_EXPORT_METRICS
    const layout = tierExportLayout({ rows: [row(0), row(13)] }, { showTitle: true, showNames: false, watermark: true })
    expect(layout.perLine).toBe(12)
    const [empty, full] = layout.rows
    expect(empty!.height).toBe(m.inset * 2 + m.itemHeight)
    expect(full!.y).toBe(empty!.y + empty!.height)
    expect(full!.height).toBe(m.inset * 2 + m.itemHeight * 2 + m.gap)
    expect(full!.items[12]).toEqual({ x: full!.items[0]!.x, y: full!.items[0]!.y + m.itemHeight + m.gap })
    expect(layout.footerTop).toBe(full!.y + full!.height + m.footerGap)
    expect(layout.height).toBe(layout.footerTop! + m.footerHeight + m.pad)
    expect(layout.scale).toBe(m.scale)
  })

  it('leaves out the title and watermark, and makes room for names', () => {
    const m = TIER_EXPORT_METRICS
    const layout = tierExportLayout({ rows: [row(1)] }, { showTitle: false, showNames: true, watermark: false })
    expect(layout.titleTop).toBeNull()
    expect(layout.footerTop).toBeNull()
    expect(layout.board.y).toBe(m.pad)
    expect(layout.rows[0]!.height).toBe(m.inset * 2 + m.itemHeight + m.nameHeight)
  })

  it('scales a very tall image down to stay under the canvas limit', () => {
    const layout = tierExportLayout({ rows: [row(500)] }, { showTitle: true, showNames: true, watermark: true })
    expect(layout.scale).toBeLessThan(TIER_EXPORT_METRICS.scale)
    expect(layout.width * layout.height * layout.scale ** 2).toBeLessThanOrEqual(TIER_EXPORT_METRICS.maxPixels + 1)
  })
})
