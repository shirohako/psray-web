import { describe, expect, it } from 'vitest'
import type { AdminSeriesSet } from '~/types/admin'
import {
  addSets,
  changeSummary,
  draftSignature,
  mergeIntoPrevious,
  moveEntry,
  moveStage,
  removeEntry,
  savePayload,
  type DraftMeta,
  type DraftStage,
} from '~/utils/adminSeries'

const set = (id: number): AdminSeriesSet => ({
  id, np_communication_id: `NPWR${id}`, name: `Set ${id}`, platform: ['PS4'], region: null,
  icon_url: null, defined_trophies: null, owners: 0, game_id: null,
})
const stage = (id: number, sets: number[], kind: 'main' | 'side' = 'main'): DraftStage => ({
  key: `s${id}`, id, kind, label: '', fallbackName: '', releaseDate: null,
  entries: sets.map(s => ({ set: set(s), source: 'auto' })),
})
const ids = (stages: DraftStage[]) => stages.map(s => s.entries.map(e => e.set.id))
const meta: DraftMeta = { name: ' Trails ', description: '', status: 'published', autoUpdate: true, coverUrl: '', translations: { 'zh-Hans': '轨迹', 'ja-JP': ' ' } }

describe('series editor draft', () => {
  const base = [stage(1, [11, 12]), stage(2, [21]), stage(3, [31], 'side')]

  it('moves a version between stages, before another one or to the end', () => {
    expect(ids(moveEntry(base, 12, 's2'))).toEqual([[11], [21, 12], [31]])
    expect(ids(moveEntry(base, 12, 's2', 21))).toEqual([[11], [12, 21], [31]])
    expect(ids(moveEntry(base, 11, 's1', null))).toEqual([[12, 11], [21], [31]])
  })

  it('splits a version into a new stage right after its own', () => {
    const next = moveEntry(base, 12, 'new')
    expect(ids(next)).toEqual([[11], [12], [21], [31]])
    expect(next[1]!.id).toBeNull()
    expect(next[1]!.kind).toBe('main')
  })

  it('reorders and merges stages', () => {
    expect(moveStage(base, 's3', 0).map(s => s.id)).toEqual([3, 1, 2])
    expect(moveStage(base, 's1', 9).map(s => s.id)).toEqual([2, 3, 1])
    expect(ids(mergeIntoPrevious(base, 's2'))).toEqual([[11, 12, 21], [31]])
    expect(mergeIntoPrevious(base, 's1')).toBe(base)
  })

  it('adds new sets as manual, skipping ones already in the series', () => {
    const next = addSets(base, [set(12), set(40), set(40)], 's2')
    expect(ids(next)).toEqual([[11, 12], [21, 40], [31]])
    expect(next[1]!.entries[1]!.source).toBe('manual')
    expect(ids(addSets(base, [set(50)], 'new'))).toEqual([[11, 12], [21], [31], [50]])
    expect(ids(removeEntry(base, 21))).toEqual([[11, 12], [], [31]])
  })

  it('builds the save body and notices only real changes', () => {
    expect(savePayload(3, meta, base)).toEqual({
      revision: 3,
      name: 'Trails',
      description: null,
      status: 'published',
      auto_update: true,
      cover_url: null,
      translations: [{ language_code: 'zh-Hans', name: '轨迹' }, { language_code: 'ja-JP', name: null }],
      stages: [
        { id: 1, kind: 'main', label: null, trophy_set_ids: [11, 12] },
        { id: 2, kind: 'main', label: null, trophy_set_ids: [21] },
        { id: 3, kind: 'side', label: null, trophy_set_ids: [31] },
      ],
    })
    expect(draftSignature(meta, base)).toBe(draftSignature({ ...meta, translations: { 'ja-JP': '', 'zh-Hans': '轨迹' } }, base))
    expect(draftSignature(meta, base)).not.toBe(draftSignature(meta, moveStage(base, 's2', 0)))
    expect(changeSummary(base, addSets(removeEntry(base, 21), [set(40)], 's1'))).toEqual({ added: 1, removed: 1, restructured: true })
    expect(changeSummary(base, base)).toEqual({ added: 0, removed: 0, restructured: false })
  })
})
