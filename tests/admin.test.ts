import { describe, expect, it } from 'vitest'
import {
  adminApiPrefix,
  adminCampaignFinished,
  adminDate,
  adminDuration,
  adminField,
  adminLocalToUtc,
  adminLogLines,
  adminDaysLeft,
  adminPsnState,
  adminPsnTotals,
  adminMailPlaceholder,
  adminParseTrophySetIds,
  adminQuery,
  adminTipChanges,
  adminUtf8Bytes,
  adminValue,
  MAIL_CAMPAIGN_CATEGORIES,
  TIP_LANGUAGE_LABELS,
  TIP_LANGUAGE_OPTIONS,
} from '../app/utils/admin'
describe('admin contract helpers', () => {
  it('addresses admin routes from the shared API origin', () => {
    expect(adminApiPrefix('https://api.psray.net')).toBe(
      'https://api.psray.net/admin',
    )
    expect(adminApiPrefix('http://localhost:8000/')).toBe(
      'http://localhost:8000/admin',
    )
    expect(adminApiPrefix('')).toBe('/admin')
  })
  it('does not send presentation state or empty filters to the API', () => {
    expect(
      adminQuery({
        q: 'name',
        tab: 'failed',
        detail: '12',
        page: '2',
        status: '',
        available: '0',
      }),
    ).toEqual({ q: 'name', page: '2', available: '0' })
  })
  it('distinguishes partial failure, missing status and booleans', () => {
    expect(adminValue('partial')).toBe('部分失败')
    expect(adminValue(null)).toBe('—')
    expect(adminValue(false)).toBe('否')
    expect(adminValue(0)).toBe('0')
  })
  // Expectations are built with local getters so the suite passes in any TZ.
  const local = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  }
  it('shows API timestamps in browser time, reading zone-less values as UTC', () => {
    const instant = new Date(Date.UTC(2026, 8, 24, 1, 2, 3))
    expect(adminDate('2026-09-24T01:02:03Z')).toBe(local(instant))
    expect(adminDate('2026-09-24 01:02:03')).toBe(local(instant))
    expect(adminDate('2026-09-24T01:02:03.000000Z')).toBe(local(instant))
    expect(adminDate(instant.getTime() / 1000)).toBe(local(instant))
    expect(adminDate(null)).toBe('—')
    expect(adminDate('not a date')).toBe('not a date')
  })
  it('formats only timestamp fields as dates', () => {
    const instant = new Date(Date.UTC(2026, 8, 24, 1, 2, 3))
    expect(adminField('created_at', '2026-09-24 01:02:03')).toBe(local(instant))
    expect(adminField('status', 'partial')).toBe('部分失败')
  })
  it('humanizes durations', () => {
    expect(adminDuration(842)).toBe('842 毫秒')
    expect(adminDuration(1834)).toBe('1.8 秒')
    expect(adminDuration(12_400)).toBe('12 秒')
    expect(adminDuration(192_000)).toBe('3 分 12 秒')
    expect(adminDuration(180_000)).toBe('3 分')
    expect(adminDuration(7_500_000)).toBe('2 小时 5 分')
    expect(adminDuration(97_200_000)).toBe('1 天 3 小时')
    expect(adminDuration(null)).toBe('—')
    expect(adminField('duration_ms', 842)).toBe('842 毫秒')
  })
  it('sends local date filters to the API in UTC', () => {
    const utc = new Date('2026-09-24T09:30').toISOString().slice(0, 16)
    expect(adminLocalToUtc('2026-09-24T09:30')).toBe(utc)
    expect(adminLocalToUtc('')).toBe('')
  })
  it('reads ban evidence trophy sets from IDs and trophy page links', () => {
    expect(
      adminParseTrophySetIds(
        '7, 8，7\nhttps://psray.net/trophies/12?lang=ja /zh-Hans/trophies/13',
      ),
    ).toEqual({ ids: [7, 8, 12, 13], invalid: [] })
    expect(adminParseTrophySetIds('0 NPWR12345_00 7a')).toEqual({
      ids: [],
      invalid: ['0', 'NPWR12345_00', '7a'],
    })
    expect(adminParseTrophySetIds('  ')).toEqual({ ids: [], invalid: [] })
  })
  it('measures penalty reasons in UTF-8 bytes', () => {
    expect(adminUtf8Bytes('cheat')).toBe(5)
    expect(adminUtf8Bytes('作弊')).toBe(6)
  })
  it('names every Tip language in Chinese for the filters', () => {
    expect(TIP_LANGUAGE_OPTIONS).toHaveLength(23)
    expect(TIP_LANGUAGE_OPTIONS[0]).toEqual({ value: 'zh', label: '中文（zh）' })
    expect(TIP_LANGUAGE_LABELS.ja).toBe('日语')
  })
  it('sends only the Tip fields an edit changed', () => {
    const saved = { content: 'Grind the tutorial', language: 'en', has_spoiler: false, missable: null }
    expect(adminTipChanges(saved, { ...saved, content: '  Grind the tutorial \n' })).toEqual({})
    expect(adminTipChanges(saved, { ...saved, content: 'Use the shield', missable: false })).toEqual({
      content: 'Use the shield',
      missable: false,
    })
    expect(adminTipChanges(saved, { ...saved, language: 'ja', has_spoiler: true })).toEqual({ language: 'ja', has_spoiler: true })
  })
  it('splits a log window into stamped lines tagged by severity', () => {
    const lines = adminLogLines(
      [
        '[2026-10-22 06:00:00] local.INFO: Sync finished',
        '[2026-10-22 06:00:01] local.WARNING: Slow response',
        '[2026-10-22 06:00:02] local.ERROR: Boom',
        '[2026-10-22 06:00:03] production.CRITICAL: Disk full',
        'Stack trace:',
        '#0 /var/www/app/Foo.php(12): bar()',
        '   at Foo->bar()',
        'plain text',
      ].join('\n'),
    )
    expect(lines.map((l) => l.level)).toEqual(['info', 'warning', 'error', 'error', 'trace', 'trace', 'trace', 'info'])
    expect(lines[2]).toEqual({ stamp: '[2026-10-22 06:00:02]', text: ' local.ERROR: Boom', level: 'error' })
    expect(lines[7]).toEqual({ stamp: '', text: 'plain text', level: 'info' })
    expect(adminLogLines('')).toEqual([{ stamp: '', text: '', level: 'info' }])
  })
  it('reads levels and times from the PSN bridge NDJSON log', () => {
    const warn = '{"level":"warn","time":"2026-11-28T03:00:00.000Z","event":"upstream.retry","msg":"retrying"}'
    const lines = adminLogLines(
      [warn, '{"level":"error","time":"2026-11-28T03:00:01.000Z","msg":"failed"}', '{"level":"info","msg":"ok"}', '{not json'].join('\n'),
    )
    expect(lines.map((l) => l.level)).toEqual(['warning', 'error', 'info', 'info'])
    expect(lines[0]).toEqual({ stamp: '[2026-11-28T03:00:00.000Z]', text: warn, level: 'warning' })
    expect(lines[2]!.stamp).toBe('')
  })
  it('writes mail template variables the way template copy spells them', () => {
    expect(adminMailPlaceholder('code')).toBe('{{ code }}')
  })
  it('offers campaign templates every mail category but transactional', () => {
    expect(MAIL_CAMPAIGN_CATEGORIES.map((c) => c.value)).toEqual(['important', 'features', 'other'])
  })
  it('counts the campaign mails that are done with, whatever the outcome', () => {
    expect(adminCampaignFinished({ queued: 5, sent: 3, failed: 1, skipped: 2, cancelled: 4 })).toBe(10)
    expect(adminCampaignFinished({ queued: 5 })).toBe(0)
  })
})

describe('PSN connection page helpers', () => {
  it('labels account states and says when one is switched off', () => {
    expect(adminPsnState('ready', true)).toEqual({ label: '可用', tone: 'good' })
    expect(adminPsnState('npsso_invalid', true).tone).toBe('bad')
    expect(adminPsnState('ready', false)).toEqual({ label: '已停用', tone: 'muted' })
  })
  it('counts whole days to a date', () => {
    const now = new Date('2026-11-28T00:00:00Z')
    expect(adminDaysLeft('2026-12-02T12:00:00+00:00', now)).toBe(4)
    expect(adminDaysLeft('2026-11-27T00:00:00+00:00', now)).toBe(-1)
    expect(adminDaysLeft(null, now)).toBeNull()
  })
  it('sums data traffic, failures and limiter rejections from the counters', () => {
    expect(adminPsnTotals({
      'http.trophySet.200': 10, 'http.trophySet.429': 2, 'http.trophyTitles.502': 1, 'http.status.200': 9,
      'limiter.rejected.trophy': 4, 'upstream.trophyGroups.ok': 99,
    })).toEqual({ requests: 13, failed: 3, rateLimited: 4 })
    expect(adminPsnTotals(undefined)).toEqual({ requests: 0, failed: 0, rateLimited: 0 })
  })
})

