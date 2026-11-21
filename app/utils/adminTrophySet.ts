import type { AdminOverrideField, AdminOverrideTarget, AdminTrophySetDetail, AdminTrophySetOverride } from '~/types/admin'

/**
 * The trophy-set editor's draft: every editable text (and icon) of one
 * language, keyed `target:id:field`. Saving sends only what differs from what
 * was loaded; the API keeps those values on top of PSN data and puts them
 * back after every sync (docs/api/admin/trophy-sets). Untouched fields keep
 * following PSN. Framework-free so it can be unit-tested.
 */

export const TROPHY_SET_GAME_FILTERS = [
  { value: 'linked', label: '已关联游戏' },
  { value: 'unlinked', label: '未关联游戏' },
  { value: 'manual', label: '人工指定' },
]

/** Dot colour per trophy type. */
export const TROPHY_TYPE_DOT: Record<string, string> = {
  platinum: 'bg-cyan-400',
  gold: 'bg-amber-400',
  silver: 'bg-slate-400',
  bronze: 'bg-orange-400',
}
export const TROPHY_TYPE_LABEL: Record<string, string> = {
  platinum: '白金',
  gold: '金',
  silver: '银',
  bronze: '铜',
}

export type TextKey = `${AdminOverrideTarget}:${number}:${AdminOverrideField}`
export const textKey = (target: AdminOverrideTarget, id: number, field: AdminOverrideField): TextKey => `${target}:${id}:${field}`

/** Every editable value shown for one language, as loaded (texts already include manual edits). */
export function textsFromDetail(detail: AdminTrophySetDetail): Record<TextKey, string> {
  const isDefault = !detail.language
  const texts: Record<string, string> = {
    [textKey('set', 0, 'name')]: detail.name ?? '',
    [textKey('set', 0, 'detail')]: detail.detail ?? '',
  }
  if (isDefault) texts[textKey('set', 0, 'icon_url')] = detail.icon_url ?? ''
  for (const group of detail.groups ?? []) {
    // Other languages can lack a group's translation; there is nothing to edit then.
    if (group.name === null && !isDefault) continue
    texts[textKey('group', group.id, 'name')] = group.name ?? ''
    texts[textKey('group', group.id, 'detail')] = group.detail ?? ''
    if (isDefault) texts[textKey('group', group.id, 'icon_url')] = group.icon_url ?? ''
  }
  for (const trophy of detail.trophies ?? []) {
    if (trophy.name === null && !isDefault) continue
    texts[textKey('trophy', trophy.id, 'name')] = trophy.name ?? ''
    texts[textKey('trophy', trophy.id, 'detail')] = trophy.detail ?? ''
    if (isDefault) texts[textKey('trophy', trophy.id, 'icon_url')] = trophy.icon_url ?? ''
  }
  return texts as Record<TextKey, string>
}

/** The override behind a field in this language, if any (icons are always the default language). */
export function overrideFor(detail: AdminTrophySetDetail, key: TextKey): AdminTrophySetOverride | undefined {
  const [target, id, field] = key.split(':') as [AdminOverrideTarget, string, AdminOverrideField]
  const language = field === 'icon_url' ? '' : (detail.language ?? '')
  return detail.overrides?.find(o => o.target === target && o.target_id === Number(id) && o.field === field && o.language_code === language)
}

/** What PSN has for a field: the override's upstream value, or the loaded value when nobody changed it. */
export function psnValue(detail: AdminTrophySetDetail, saved: Record<TextKey, string>, key: TextKey): string {
  const override = overrideFor(detail, key)
  return override ? (override.upstream_value ?? '') : (saved[key] ?? '')
}

/**
 * Body of `PUT /admin/trophy-sets/{id}/overrides`: one change per edited field.
 * A field set back to PSN's value is sent as `null` (restore PSN).
 */
export function overrideChanges(detail: AdminTrophySetDetail, saved: Record<TextKey, string>, draft: Record<TextKey, string>) {
  const language = detail.language ?? ''
  return (Object.keys(draft) as TextKey[])
    .filter(key => draft[key] !== saved[key])
    .map((key) => {
      const [target, id, field] = key.split(':') as [AdminOverrideTarget, string, AdminOverrideField]
      const value = (draft[key] ?? '').trim()
      const backToPsn = !!overrideFor(detail, key) && value === psnValue(detail, saved, key).trim()
      return {
        target,
        ...(target === 'set' ? {} : { target_id: Number(id) }),
        field,
        ...(field === 'icon_url' || !language ? {} : { language_code: language }),
        value: backToPsn ? null : value,
      }
    })
}

export type FieldState = 'locked' | 'lock' | 'unlock' | 'free'

/**
 * Where a field stands: `locked` = a manual value PSN no longer overwrites, `lock` = edited and
 * will be kept after saving, `unlock` = set back to PSN and handed back on save, `free` = follows PSN.
 */
export function fieldState(detail: AdminTrophySetDetail, saved: Record<TextKey, string>, draft: Record<TextKey, string>, key: TextKey): FieldState {
  const changed = draft[key] !== saved[key]
  if (overrideFor(detail, key)) {
    return changed && (draft[key] ?? '').trim() === psnValue(detail, saved, key).trim() ? 'unlock' : 'locked'
  }
  return changed ? 'lock' : 'free'
}

/** One state for several fields shown together (a trophy row): pending changes first, then saved edits. */
export function combinedState(states: readonly FieldState[]): FieldState {
  for (const state of ['lock', 'unlock', 'locked'] as const) if (states.includes(state)) return state
  return 'free'
}

/** Names that can't be saved empty. */
export function emptyNames(draft: Record<TextKey, string>): TextKey[] {
  return (Object.keys(draft) as TextKey[]).filter(key => key.endsWith(':name') && !(draft[key] ?? '').trim())
}

/** Overrides per language tab, for the badges (icons count towards the default language). */
export function overrideCounts(overrides: readonly AdminTrophySetOverride[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const override of overrides) {
    const language = override.field === 'icon_url' ? '' : override.language_code
    counts[language] = (counts[language] ?? 0) + 1
  }
  return counts
}

/**
 * Short labels for what has been changed by hand, for the drawer: the set's own
 * title / description / icon by name, other texts counted per language, other
 * icons counted together. `''` languages are the default language.
 */
export function overrideSummary(overrides: readonly AdminTrophySetOverride[]): string[] {
  const labels: string[] = []
  const own = (field: AdminOverrideField) => overrides.some(o => o.target === 'set' && o.field === field && o.language_code === '')
  if (own('name')) labels.push('标题')
  if (own('detail')) labels.push('描述')
  if (own('icon_url')) labels.push('图标')

  const perLanguage = new Map<string, number>()
  let icons = 0
  for (const o of overrides) {
    if (o.target === 'set' && o.language_code === '') continue
    if (o.field === 'icon_url') icons++
    else perLanguage.set(o.language_code, (perLanguage.get(o.language_code) ?? 0) + 1)
  }
  for (const [language, count] of [...perLanguage].sort(([a], [b]) => a.localeCompare(b))) {
    labels.push(`${language ? adminLanguageName(language) : '默认语言'} ${count} 项`)
  }
  if (icons) labels.push(`分组 / 奖杯图标 ${icons} 个`)
  return labels
}

/** A PSN language code in Chinese for the admin, e.g. `zh-Hant → 繁体中文`; the raw code when unknown. */
export function adminLanguageName(code: string | null | undefined): string {
  if (!code) return '默认语言'
  const known: Record<string, string> = { 'zh-Hans': '简体中文', 'zh-Hant': '繁体中文', 'en-US': '英语（美国）', 'en-GB': '英语（英国）', 'ja-JP': '日语', 'ko-KR': '韩语' }
  if (known[code]) return known[code]
  try {
    return new Intl.DisplayNames(['zh-Hans'], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}

/** Only `https://` addresses are accepted for icons. */
export const isHttpsUrl = (value: string) => /^https:\/\/\S+$/.test(value.trim()) && value.trim().length <= 255

// ── Region & edition tags (trophy_set.region) ───────────────────────────────

export interface RegionTag {
  code: string
  label: string
  hint?: string
  kind: 'region' | 'edition'
  /** Flags drawn for a region: one country (or the EU), or two stacked for North America. The Asia store and editions draw their own SVG. */
  flags?: string[]
}

/**
 * The only values a trophy set's region tag can take: PSN store regions and
 * editions. Mirrors App\Support\TrophySetRegion (docs/api/admin/trophy-sets/region.md);
 * change both together.
 */
export const TROPHY_SET_REGIONS: readonly RegionTag[] = [
  { code: 'NA', label: '北美', kind: 'region', flags: ['us', 'ca'] },
  { code: 'EU', label: '欧洲', kind: 'region', flags: ['eu'] },
  { code: 'JP', label: '日本', kind: 'region', flags: ['jp'] },
  { code: 'AS', label: '亚洲', hint: '港台、东南亚', kind: 'region' },
  { code: 'KR', label: '韩国', kind: 'region', flags: ['kr'] },
  { code: 'CN', label: '中国大陆', hint: '国行', kind: 'region', flags: ['cn'] },
  { code: 'HK', label: '香港', kind: 'region', flags: ['hk'] },
  { code: 'TW', label: '台湾', kind: 'region', flags: ['tw'] },
  { code: 'DE', label: '德国', kind: 'region', flags: ['de'] },
  { code: 'AU', label: '澳大利亚', kind: 'region', flags: ['au'] },
  { code: 'NZ', label: '新西兰', kind: 'region', flags: ['nz'] },
  { code: 'RU', label: '俄罗斯', kind: 'region', flags: ['ru'] },
  { code: 'BR', label: '巴西', kind: 'region', flags: ['br'] },
  { code: 'ES', label: '西班牙', kind: 'region', flags: ['es'] },
  { code: 'SA', label: '沙特阿拉伯', kind: 'region', flags: ['sa'] },
  { code: 'P', label: '实体版', hint: '光盘 / 卡带', kind: 'edition' },
  { code: 'D', label: '数字版', hint: '商店下载', kind: 'edition' },
  { code: 'ORIG', label: '原版', hint: '区别于重制、新版', kind: 'edition' },
  { code: 'BDL', label: '合集版', hint: '合集 / 同捆', kind: 'edition' },
]

export const regionTag = (code: string) => TROPHY_SET_REGIONS.find(tag => tag.code === code)

/** `"AS,JP,D"` → `['AS', 'JP', 'D']`; `[]` when unset. */
export function parseRegion(value: string | null | undefined): string[] {
  return (value ?? '').split(',').map(code => code.trim()).filter(Boolean)
}

/**
 * Codes in the order the API stores them: regions alphabetically, then editions
 * in catalogue order (`['D', 'JP', 'AS']` → `['AS', 'JP', 'D']`). Unknown codes and
 * duplicates are dropped.
 */
export function sortRegion(codes: readonly string[]): string[] {
  const known = TROPHY_SET_REGIONS.filter(tag => codes.includes(tag.code))
  return [
    ...known.filter(tag => tag.kind === 'region').map(tag => tag.code).sort(),
    ...known.filter(tag => tag.kind === 'edition').map(tag => tag.code),
  ]
}

/** The stored string for a set of codes, as the front pages show it; `null` when empty. */
export const formatRegion = (codes: readonly string[]) => sortRegion(codes).join(',') || null
