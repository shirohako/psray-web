import { describe, expect, it } from 'vitest'
import type { AdminTrophySetDetail } from '~/types/admin'
import {
  combinedState,
  emptyNames,
  fieldState,
  formatRegion,
  isHttpsUrl,
  manualLanguageOptions,
  manualPayload,
  manualProblems,
  manualProgress,
  manualTexts,
  overrideChanges,
  overrideCounts,
  overrideSummary,
  parseRegion,
  sortRegion,
  textKey,
  textsFromDetail,
  TROPHY_SET_REGIONS,
} from '~/utils/adminTrophySet'

const detail = (overrides: Partial<AdminTrophySetDetail> = {}): AdminTrophySetDetail => ({
  id: 1, np_communication_id: 'NPWR00001_00', name: 'Guardian (Manual)', icon_url: 'https://img.example/set.png',
  platform: ['PS4'], version: '01.00', np_service_name: 'trophy', defined_trophies: null, has_trophy_groups: false,
  owners: 7, region: null, game_id: null, game_link_manual: false, created_at: null, updated_at: null,
  detail: 'Detail', default_language: 'en-US', language: '',
  groups: [{ id: 3, psn_group_id: 'default', name: 'Guardian', detail: '', icon_url: 'https://cdn/g.png', defined_trophies: null }],
  trophies: [
    { id: 41, psn_trophy_id: 0, psn_group_id: 'default', type: 'gold', name: 'First Light', detail: 'First', icon_url: 'https://cdn/0.png', is_hidden: false },
    { id: 42, psn_trophy_id: 1, psn_group_id: 'default', type: 'bronze', name: null, detail: null, icon_url: 'https://cdn/1.png', is_hidden: false },
  ],
  overrides: [
    { target: 'set', target_id: 0, field: 'name', language_code: '', value: 'Guardian (Manual)', upstream_value: 'Guardian', user_id: 1, updated_at: null },
    { target: 'set', target_id: 0, field: 'icon_url', language_code: '', value: 'https://img.example/set.png', upstream_value: 'https://cdn/set.png', user_id: 1, updated_at: null },
    { target: 'trophy', target_id: 41, field: 'name', language_code: 'zh-Hant', value: '破曉', upstream_value: '曙光', user_id: 1, updated_at: null },
  ],
  ...overrides,
})

describe('trophy set override draft', () => {
  it('collects editable texts; icons only in the default language, missing translations skipped elsewhere', () => {
    const texts = textsFromDetail(detail())
    expect(texts[textKey('set', 0, 'name')]).toBe('Guardian (Manual)')
    expect(texts[textKey('trophy', 41, 'icon_url')]).toBe('https://cdn/0.png')

    const zh = textsFromDetail(detail({ language: 'zh-Hant' }))
    expect(zh).not.toHaveProperty(textKey('trophy', 41, 'icon_url'))
    expect(zh).not.toHaveProperty(textKey('trophy', 42, 'name'))
  })

  it('sends only changed fields, and a field set back to PSN as a restore', () => {
    const d = detail()
    const saved = textsFromDetail(d)
    const draft = { ...saved, [textKey('set', 0, 'name')]: ' Guardian ', [textKey('trophy', 41, 'detail')]: 'Hand-written' }

    expect(overrideChanges(d, saved, draft)).toEqual([
      { target: 'set', field: 'name', value: null },
      { target: 'trophy', target_id: 41, field: 'detail', value: 'Hand-written' },
    ])
    expect(fieldState(d, saved, draft, textKey('set', 0, 'name'))).toBe('unlock')
    expect(fieldState(d, saved, draft, textKey('trophy', 41, 'detail'))).toBe('lock')
    expect(fieldState(d, saved, draft, textKey('set', 0, 'icon_url'))).toBe('locked')
    expect(fieldState(d, saved, draft, textKey('trophy', 41, 'name'))).toBe('free')
  })

  it('tags non-default languages on the change', () => {
    const d = detail({ language: 'zh-Hant', name: '守護者', trophies: [{ id: 41, psn_trophy_id: 0, psn_group_id: 'default', type: 'gold', name: '破曉', detail: '', icon_url: null, is_hidden: false }] })
    const saved = textsFromDetail(d)
    const draft = { ...saved, [textKey('trophy', 41, 'name')]: '曙光' }

    expect(overrideChanges(d, saved, draft)).toEqual([{ target: 'trophy', target_id: 41, field: 'name', language_code: 'zh-Hant', value: null }])
    expect(fieldState(d, saved, saved, textKey('trophy', 41, 'name'))).toBe('locked')
  })

  it('summarises rows, counts tabs and validates', () => {
    expect(combinedState(['free', 'locked', 'lock'])).toBe('lock')
    expect(combinedState(['free', 'locked'])).toBe('locked')
    expect(combinedState(['free'])).toBe('free')
    expect(overrideCounts(detail().overrides!)).toEqual({ '': 2, 'zh-Hant': 1 })
    expect(emptyNames({ [textKey('set', 0, 'name')]: ' ', [textKey('set', 0, 'detail')]: '' } as any)).toEqual([textKey('set', 0, 'name')])
    expect(isHttpsUrl('https://img.example/a.png')).toBe(true)
    expect(isHttpsUrl('http://img.example/a.png')).toBe(false)
  })

  it('summarises manual edits for the drawer', () => {
    const overrides = [
      ...detail().overrides!,
      { target: 'trophy' as const, target_id: 42, field: 'detail' as const, language_code: '', value: 'x', upstream_value: 'y', user_id: 1, updated_at: null },
      { target: 'group' as const, target_id: 3, field: 'icon_url' as const, language_code: '', value: 'https://a', upstream_value: null, user_id: 1, updated_at: null },
    ]
    expect(overrideSummary(overrides)).toEqual(['标题', '图标', '默认语言 1 项', '繁体中文 1 项', '分组 / 奖杯图标 1 个'])
    expect(overrideSummary([])).toEqual([])
  })
})

describe('region tags', () => {
  it('parses the stored string', () => {
    expect(parseRegion('AS,JP,D')).toEqual(['AS', 'JP', 'D'])
    expect(parseRegion(' EU , NA ')).toEqual(['EU', 'NA'])
    expect(parseRegion(null)).toEqual([])
    expect(parseRegion('')).toEqual([])
  })

  it('orders codes as the API stores them: regions alphabetically, then editions', () => {
    expect(sortRegion(['D', 'JP', 'AS'])).toEqual(['AS', 'JP', 'D'])
    expect(sortRegion(['BDL', 'P', 'NA', 'EU', 'NA'])).toEqual(['EU', 'NA', 'P', 'BDL'])
    expect(sortRegion(['XX', 'JP'])).toEqual(['JP'])
    expect(formatRegion(['JP', 'D'])).toBe('JP,D')
    expect(formatRegion([])).toBeNull()
  })

  it('covers every code found in the legacy data', () => {
    const legacy = ['EU', 'NA', 'JP', 'AS', 'KR', 'CN', 'HK', 'P', 'D', 'ORIG', 'DE', 'AU', 'RU', 'BR', 'TW', 'ES', 'BDL', 'NZ', 'SA']
    expect(TROPHY_SET_REGIONS.map(tag => tag.code).sort()).toEqual([...legacy].sort())
    // Every region has flags except the Asia store, which draws a globe.
    expect(TROPHY_SET_REGIONS.filter(tag => tag.kind === 'region' && !tag.flags?.length).map(tag => tag.code)).toEqual(['AS'])
  })
})

describe('manual translations', () => {
  const original = detail({
    groups: [{ id: 3, psn_group_id: 'default', name: 'Guardian', detail: '', icon_url: '', defined_trophies: null }],
    trophies: [
      { id: 41, psn_trophy_id: 0, psn_group_id: 'default', type: 'gold', name: 'First Light', detail: 'Dawn', icon_url: '', is_hidden: false },
      { id: 42, psn_trophy_id: 1, psn_group_id: 'default', type: 'bronze', name: 'Second Wind', detail: 'Again', icon_url: '', is_hidden: false },
    ],
  })
  const translation = {
    language_code: 'zh-Hans', name: '守护者', detail: null, taken_over: false, updated_at: null,
    groups: [], trophies: [{ id: 41, name: '第一缕光', detail: null }],
  }

  it('drafts every entry, empty where untranslated', () => {
    const texts = manualTexts(original, translation)
    expect(texts[textKey('set', 0, 'name')]).toBe('守护者')
    expect(texts[textKey('trophy', 41, 'name')]).toBe('第一缕光')
    expect(texts[textKey('trophy', 41, 'detail')]).toBe('')
    expect(texts[textKey('trophy', 42, 'name')]).toBe('')
    expect(texts[textKey('group', 3, 'name')]).toBe('')
    expect(manualTexts(original, null)[textKey('set', 0, 'name')]).toBe('')
  })

  it('sends only named entries and counts progress like the API', () => {
    const draft = { ...manualTexts(original, translation), [textKey('trophy', 42, 'name')]: ' 再起之风 ', [textKey('trophy', 42, 'detail')]: ' ' }
    expect(manualPayload(original, draft)).toEqual({
      name: '守护者',
      groups: [],
      trophies: [{ id: 41, name: '第一缕光', detail: null }, { id: 42, name: '再起之风', detail: null }],
    })
    expect(manualProgress(original, draft)).toEqual({ translated: 3, total: 4 })
  })

  it('flags an empty title and descriptions without a name', () => {
    const draft = { ...manualTexts(original, null), [textKey('trophy', 42, 'detail')]: '只有描述' }
    expect(manualProblems(draft)).toEqual([textKey('set', 0, 'name'), textKey('trophy', 42, 'name')])
  })

  it('offers languages PSN lacks, common ones first', () => {
    const options = manualLanguageOptions(detail({
      default_language: 'ja-JP',
      languages: [{ language_code: '', psn_language: 'ja-JP', is_default: true }, { language_code: 'zh-Hant', psn_language: 'zh-Hant', is_default: false }],
      manual_translations: [{ language_code: 'zh-Hans', name: '守护者', translated: 1, total: 4, taken_over: false, updated_at: null }],
    }))
    expect(options.slice(0, 5).map(o => [o.code, o.state])).toEqual([
      ['zh-Hans', 'manual'], ['zh-Hant', 'official'], ['en-US', 'free'], ['ja-JP', 'official'], ['ko-KR', 'free'],
    ])
    expect(new Set(options.map(o => o.code)).size).toBe(options.length)
  })
})
