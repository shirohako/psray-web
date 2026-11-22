import { describe, expect, it } from 'vitest'
import type { AdminGameDetail } from '~/types/admin'
import {
  cancelRestore,
  derivedFirstRelease,
  draftFromGame,
  draftRelease,
  formatAdminReleaseDate,
  gameSavePayload,
  gameSignature,
  lockPlan,
  normalizeDate,
  restoreFromIgdb,
} from '~/utils/adminGame'

const game = (overrides: Partial<AdminGameDetail> = {}): AdminGameDetail => ({
  id: 12, name: 'Elden Ring', summary: 'From IGDB', cover: null, cover_source: null, cover_source_url: null,
  first_release_date: '2022-02-25', first_release_precision: 'day', platforms: ['PS5', 'PC'],
  translations: [{ language_code: 'ja-JP', name: 'エルデンリング', summary: null }],
  aliases: ['ER'],
  releases: [
    { platform: 'PS5', region: 'WW', release_date: '2022-02-25', date_precision: 'day', status: null },
    { platform: 'PC', region: 'WW', release_date: '2021-11-12', date_precision: 'day', status: 'beta' },
  ],
  sources: [{ source: 'igdb', external_id: '119133', url: null, synced_at: null }],
  locked_fields: [], revision: 3, created_by_user_id: null, created_at: null, updated_at: null,
  trophy_sets: [],
  igdb: { summary: 'From IGDB', aliases: ['ER', 'Elden'], releases: [{ platform: 'PS5', region: 'WW', release_date: '2022-02-25', date_precision: 'day', status: null }] },
  ...overrides,
})

describe('game editor draft', () => {
  it('saves what was loaded unchanged, without pinning the first release date', () => {
    const draft = draftFromGame(game())
    const payload = gameSavePayload(3, draft, [])

    expect(payload).toMatchObject({ revision: 3, name: 'Elden Ring', summary: 'From IGDB', aliases: ['ER'], unlock: [] })
    expect(payload.releases).toEqual([
      { platform: 'PS5', region: 'WW', release_date: '2022-02-25', date_precision: 'day', status: null },
      { platform: 'PC', region: 'WW', release_date: '2021-11-12', date_precision: 'day', status: 'beta' },
    ])
    expect(payload).not.toHaveProperty('first_release_date')
    expect(payload.translations).toEqual([{ language_code: 'ja-JP', name: 'エルデンリング', summary: null }])
  })

  it('ignores release order and empty language slots when comparing', () => {
    const saved = draftFromGame(game())
    const reordered = { ...saved, releases: [...saved.releases].reverse(), translations: { ...saved.translations, 'ko-KR': { name: '', summary: null } } }
    expect(gameSignature(reordered, [])).toBe(gameSignature(saved, []))
    expect(gameSignature({ ...saved, summary: 'Changed' }, [])).not.toBe(gameSignature(saved, []))
  })

  it('plans which fields a save locks', () => {
    const saved = draftFromGame(game())
    const draft = {
      ...saved,
      summary: 'Hand-written',
      releases: [...saved.releases, draftRelease({ platform: 'PS4', region: 'JP', release_date: '2022-02-25' })],
    }
    expect(lockPlan(saved, draft, [])).toEqual({ releases: 'lock', first_release_date: 'free', summary: 'lock', aliases: 'free' })

    // Pinning the date locks it even when the value is the derived one.
    expect(lockPlan(saved, { ...saved, firstMode: 'manual' }, []).first_release_date).toBe('lock')
    // Already locked fields stay locked.
    expect(lockPlan(saved, saved, ['aliases']).aliases).toBe('locked')
  })

  it('restores a locked field from the IGDB snapshot and can take it back', () => {
    const detail = game({ locked_fields: ['summary', 'aliases', 'first_release_date'], summary: 'Mine' })
    const saved = draftFromGame(detail)
    expect(saved.firstMode).toBe('manual')

    let draft = restoreFromIgdb(saved, 'aliases', detail.igdb)
    draft = restoreFromIgdb(draft, 'first_release_date', detail.igdb)
    expect(draft.aliases).toEqual(['ER', 'Elden'])
    expect(lockPlan(saved, draft, detail.locked_fields)).toMatchObject({ aliases: 'unlock', first_release_date: 'unlock', summary: 'locked' })
    expect(gameSavePayload(detail.revision, draft, detail.locked_fields).unlock).toEqual(['first_release_date', 'aliases'])

    draft = cancelRestore(draft, saved, 'aliases')
    expect(draft.aliases).toEqual(['ER'])
    expect(gameSavePayload(detail.revision, draft, detail.locked_fields).unlock).toEqual(['first_release_date'])

    // Without a snapshot only the unlock is queued.
    expect(restoreFromIgdb(saved, 'summary', null)).toMatchObject({ summary: 'Mine', unlock: ['summary'] })
  })

  it('derives the first release date like the API', () => {
    const rows = [
      draftRelease({ platform: 'PC', release_date: '2021-11-12', status: 'beta' }),
      draftRelease({ platform: 'PS4', release_date: '2022-02-14', date_precision: 'month' }),
      draftRelease({ platform: 'PS5', release_date: '2022-02-01', date_precision: 'day' }),
      draftRelease({ platform: 'XSX' }),
    ]
    expect(derivedFirstRelease(rows)).toEqual({ date: '2022-02-01', precision: 'day' })
    expect(derivedFirstRelease([rows[0]!, rows[3]!])).toBeNull()
    expect(normalizeDate('2026-08-17', 'quarter')).toBe('2026-07-01')
    expect(formatAdminReleaseDate('2026-07-01', 'quarter')).toBe('2026 Q3')
    expect(formatAdminReleaseDate(null, 'day')).toBe('未定档')
  })
})
