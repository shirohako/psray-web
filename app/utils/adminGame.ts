import type { AdminGameDetail, AdminGameLockedField, AdminGameRelease, AdminReleasePrecision } from '~/types/admin'

/**
 * The game editor's draft and the pure operations on it, kept framework-free
 * so they can be unit-tested; the page owns the reactive state.
 *
 * Manual edits win over IGDB (docs/api/admin/games): saving a changed summary,
 * alias list or release list — or pinning the first release date — locks that
 * field, and `game:refresh-igdb` skips it. "Restore IGDB" unlocks it and, when
 * the last IGDB snapshot is known, puts IGDB's value back into the draft.
 */

export const GAME_SORT_OPTIONS = [
  { value: 'latest', label: '最新创建' },
  { value: 'updated', label: '最近更新' },
  { value: 'name', label: '名称' },
  { value: 'trophy_sets', label: '奖杯组最多' },
]

export const GAME_REGION_OPTIONS = [
  { value: 'WW', label: '全球' },
  { value: 'NA', label: '北美' },
  { value: 'EU', label: '欧洲' },
  { value: 'JP', label: '日本' },
  { value: 'ASIA', label: '亚洲' },
  { value: 'CN', label: '中国' },
  { value: 'KR', label: '韩国' },
  { value: 'AU', label: '澳大利亚' },
  { value: 'NZ', label: '新西兰' },
  { value: 'BR', label: '巴西' },
]

export const GAME_PRECISION_OPTIONS: { value: AdminReleasePrecision; label: string }[] = [
  { value: 'day', label: '精确到日' },
  { value: 'month', label: '精确到月' },
  { value: 'quarter', label: '精确到季度' },
  { value: 'year', label: '精确到年' },
]

/** IGDB release statuses, snake_cased by the API. */
export const GAME_STATUS_LABELS: Record<string, string> = {
  alpha: 'Alpha',
  beta: 'Beta',
  early_access: '抢先体验',
  advanced_access: '提前体验',
  advanced_release: '提前发售',
  cancelled: '已取消',
  offline: '已下线',
  full_release: '正式发售',
}

/** Statuses that don't count as a release for the first release date (same as the API). */
const NON_RELEASE_STATUSES = new Set(['alpha', 'beta', 'cancelled', 'offline'])

export const GAME_LOCK_LABELS: Record<AdminGameLockedField, string> = {
  releases: '发售信息',
  first_release_date: '首发日',
  summary: '简介',
  aliases: '别名',
}
/** Lockable fields in the API's order. */
export const GAME_LOCKABLE: AdminGameLockedField[] = ['releases', 'first_release_date', 'summary', 'aliases']

/** Names the editor always offers; other languages a game already has are listed after them. */
export const GAME_LANGUAGES = [
  { code: 'ja-JP', label: '日语' },
  { code: 'en-US', label: '英语' },
  { code: 'zh-Hans', label: '简体中文' },
  { code: 'zh-Hant', label: '繁体中文' },
  { code: 'ko-KR', label: '韩语' },
] as const

export interface DraftRelease {
  /** Stable key for rendering. */
  key: string
  platform: string
  region: string
  /** `''` = not dated yet. */
  date: string
  precision: AdminReleasePrecision
  status: string | null
}

export interface GameDraft {
  name: string
  coverUrl: string
  summary: string
  /** language code → name / summary; summaries aren't edited here but are kept. */
  translations: Record<string, { name: string, summary: string | null }>
  aliases: string[]
  releases: DraftRelease[]
  /** `auto`: derived from the releases; `manual`: pinned (and locked). */
  firstMode: 'auto' | 'manual'
  firstDate: string
  firstPrecision: AdminReleasePrecision
  /** Fields to hand back to IGDB on save (summary / aliases / releases; the first date follows `firstMode`). */
  unlock: AdminGameLockedField[]
}

let counter = 0
const releaseKey = () => `r${++counter}`

export function draftRelease(release?: Partial<AdminGameRelease>): DraftRelease {
  return {
    key: releaseKey(),
    platform: release?.platform ?? 'PS5',
    region: release?.region ?? 'WW',
    date: release?.release_date ?? '',
    precision: release?.date_precision ?? 'day',
    status: release?.status ?? null,
  }
}

export function draftFromGame(game: AdminGameDetail): GameDraft {
  const pinned = game.locked_fields.includes('first_release_date')
  return {
    name: game.name,
    coverUrl: game.cover_url ?? '',
    summary: game.summary ?? '',
    translations: Object.fromEntries(game.translations.map(t => [t.language_code, { name: t.name, summary: t.summary }])),
    aliases: [...game.aliases],
    releases: game.releases.map(draftRelease),
    firstMode: pinned ? 'manual' : 'auto',
    firstDate: game.first_release_date ?? '',
    firstPrecision: game.first_release_precision ?? 'day',
    unlock: [],
  }
}

/** Body of `PUT /admin/games/{id}`. */
export function gameSavePayload(revision: number, draft: GameDraft, locked: readonly AdminGameLockedField[]) {
  const unlock = [...draft.unlock]
  if (draft.firstMode === 'auto' && locked.includes('first_release_date')) unlock.push('first_release_date')
  return {
    revision,
    name: draft.name.trim(),
    summary: draft.summary.trim() || null,
    cover_url: draft.coverUrl.trim() || null,
    translations: Object.entries(draft.translations)
      .filter(([, t]) => t.name.trim())
      .map(([language_code, t]) => ({ language_code, name: t.name.trim(), summary: t.summary })),
    aliases: draft.aliases.map(a => a.trim()).filter(Boolean),
    releases: draft.releases.map(r => ({
      platform: r.platform,
      region: r.region,
      release_date: r.date || null,
      date_precision: r.precision,
      status: r.status,
    })),
    ...(draft.firstMode === 'manual'
      ? { first_release_date: draft.firstDate || null, first_release_precision: draft.firstPrecision }
      : {}),
    unlock: GAME_LOCKABLE.filter(field => unlock.includes(field)),
  }
}

/** Comparable form of a draft: what a save would send, minus the revision; release order doesn't matter. */
export function gameSignature(draft: GameDraft, locked: readonly AdminGameLockedField[]): string {
  const { revision: _revision, releases, translations, ...rest } = gameSavePayload(0, draft, locked)
  return JSON.stringify({
    ...rest,
    translations: [...translations].sort((a, b) => a.language_code.localeCompare(b.language_code)),
    releases: releases.map(r => JSON.stringify(r)).sort(),
  })
}

const releasesKey = (draft: GameDraft) => gameSavePayload(0, draft, []).releases.map(r => JSON.stringify(r)).sort().join('\n')

/**
 * Lock state a save would leave each lockable field in, compared with the saved game:
 * `lock` = newly locked by this save, `unlock` = handed back to IGDB, `locked` / `free` unchanged.
 */
export function lockPlan(saved: GameDraft, draft: GameDraft, locked: readonly AdminGameLockedField[]): Record<AdminGameLockedField, 'locked' | 'free' | 'lock' | 'unlock'> {
  const changed: Record<AdminGameLockedField, boolean> = {
    summary: saved.summary.trim() !== draft.summary.trim(),
    aliases: JSON.stringify(saved.aliases.map(a => a.trim()).filter(Boolean)) !== JSON.stringify(draft.aliases.map(a => a.trim()).filter(Boolean)),
    releases: releasesKey(saved) !== releasesKey(draft),
    first_release_date: draft.firstMode === 'manual'
      && (saved.firstMode !== 'manual' || saved.firstDate !== draft.firstDate || saved.firstPrecision !== draft.firstPrecision),
  }
  const unlocking = (field: AdminGameLockedField) => field === 'first_release_date'
    ? locked.includes(field) && draft.firstMode === 'auto'
    : draft.unlock.includes(field)

  return Object.fromEntries(GAME_LOCKABLE.map((field) => {
    const isLocked = locked.includes(field)
    if (unlocking(field)) return [field, isLocked ? 'unlock' : 'free']
    if (isLocked) return [field, 'locked']
    return [field, changed[field] ? 'lock' : 'free']
  })) as Record<AdminGameLockedField, 'locked' | 'free' | 'lock' | 'unlock'>
}

/**
 * "Restore IGDB" for one field: queue the unlock and, where the last IGDB
 * snapshot has the value, put it back into the draft so the admin sees what
 * will be saved. Without a snapshot the value stays until the next refresh.
 */
export function restoreFromIgdb(draft: GameDraft, field: AdminGameLockedField, igdb: AdminGameDetail['igdb']): GameDraft {
  if (field === 'first_release_date') return { ...draft, firstMode: 'auto' }
  const next: GameDraft = { ...draft, unlock: draft.unlock.includes(field) ? draft.unlock : [...draft.unlock, field] }
  if (!igdb) return next
  if (field === 'summary') next.summary = igdb.summary ?? ''
  if (field === 'aliases') next.aliases = [...igdb.aliases]
  if (field === 'releases') next.releases = igdb.releases.map(draftRelease)
  return next
}

/** Take back a queued "restore IGDB" before saving. */
export function cancelRestore(draft: GameDraft, saved: GameDraft, field: AdminGameLockedField): GameDraft {
  if (field === 'first_release_date') return { ...draft, firstMode: 'manual', firstDate: saved.firstDate, firstPrecision: saved.firstPrecision }
  const next: GameDraft = { ...draft, unlock: draft.unlock.filter(f => f !== field) }
  if (field === 'summary') next.summary = saved.summary
  if (field === 'aliases') next.aliases = [...saved.aliases]
  if (field === 'releases') next.releases = saved.releases.map(r => ({ ...r }))
  return next
}

/**
 * The first release date the API would derive from these releases: the
 * earliest dated one that counts as a release, the finest precision on a tie.
 * `null` when none qualifies (the API then keeps the stored date).
 */
export function derivedFirstRelease(releases: readonly DraftRelease[]): { date: string, precision: AdminReleasePrecision } | null {
  const rank: Record<AdminReleasePrecision, number> = { day: 0, month: 1, quarter: 2, year: 3 }
  const dated = releases
    .filter(r => r.date && !(r.status && NON_RELEASE_STATUSES.has(r.status)))
    .map(r => ({ date: normalizeDate(r.date, r.precision), precision: r.precision }))
    .sort((a, b) => a.date.localeCompare(b.date) || rank[a.precision] - rank[b.precision])
  return dated[0] ?? null
}

/** A date stored at its precision: the first day of the month / quarter / year (as the API normalizes it). */
export function normalizeDate(date: string, precision: AdminReleasePrecision): string {
  const [year, month] = date.split('-').map(Number)
  if (!year || !month) return date
  const pad = (n: number) => String(n).padStart(2, '0')
  switch (precision) {
    case 'year': return `${year}-01-01`
    case 'quarter': return `${year}-${pad(Math.floor((month - 1) / 3) * 3 + 1)}-01`
    case 'month': return `${year}-${pad(month)}-01`
    default: return date
  }
}

/** `2022-02-25`, `2022-02`, `2022 Q1` or `2022`; `未定档` without a date. */
export function formatAdminReleaseDate(date: string | null | undefined, precision: AdminReleasePrecision | null | undefined): string {
  if (!date) return '未定档'
  const [year, month] = date.split('-')
  switch (precision) {
    case 'year': return year!
    case 'quarter': return `${year} Q${Math.floor((Number(month) - 1) / 3) + 1}`
    case 'month': return `${year}-${month}`
    default: return date
  }
}

export const regionName = (code: string) => GAME_REGION_OPTIONS.find(o => o.value === code)?.label ?? code
