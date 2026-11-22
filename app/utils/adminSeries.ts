import type { AdminSeriesDetail, AdminSeriesSet, AdminSeriesStage, AdminSeriesStatus } from '~/types/admin'

/**
 * The series editor's draft and the pure operations on it (move, reorder,
 * split, add), kept framework-free so they can be unit-tested. The page owns
 * the reactive state and calls these to produce the next value.
 */

export const SERIES_STATUS_OPTIONS: { value: AdminSeriesStatus; label: string }[] = [
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
  { value: 'hidden', label: '已下架' },
]

export const SERIES_SOURCE_OPTIONS = [
  { value: 'igdb', label: 'IGDB 自动' },
  { value: 'manual', label: '手动' },
]

export const SERIES_SORT_OPTIONS = [
  { value: 'popular', label: '热门' },
  { value: 'updated', label: '最近更新' },
  { value: 'latest', label: '最新创建' },
  { value: 'name', label: '名称' },
]

/** Why automatic grouping asked an admin to look at a series, as a short title. */
export const SERIES_REVIEW_LABELS: Record<string, string> = {
  large: '阶段太多，可能不是一个系列',
  overlap: '可能和更大的系列重复',
  new_stage: '自动归类追加了新阶段',
}

/** Languages the series name can be translated into, in the order the editor lists them. */
export const SERIES_LANGUAGES = [
  { code: 'ja-JP', label: '日语' },
  { code: 'en-US', label: '英语' },
  { code: 'zh-Hans', label: '简体中文' },
  { code: 'zh-Hant', label: '繁体中文' },
  { code: 'ko-KR', label: '韩语' },
] as const

export interface DraftEntry {
  set: AdminSeriesSet
  source: 'auto' | 'manual'
}

export interface DraftStage {
  /** Stable key for rendering and drag-and-drop: `s<id>` for saved stages, `n<counter>` for new ones. */
  key: string
  id: number | null
  kind: 'main' | 'side'
  label: string
  /** Name the public page falls back to when `label` is empty. */
  fallbackName: string
  releaseDate: string | null
  entries: DraftEntry[]
}

export interface DraftMeta {
  name: string
  description: string
  status: AdminSeriesStatus
  autoUpdate: boolean
  coverUrl: string
  translations: Record<string, string>
}

let counter = 0
export const newStageKey = () => `n${++counter}`

export function draftFromDetail(detail: AdminSeriesDetail): { meta: DraftMeta; stages: DraftStage[] } {
  return {
    meta: {
      name: detail.name,
      description: detail.description ?? '',
      status: detail.status,
      autoUpdate: detail.auto_update,
      coverUrl: detail.cover?.url ?? '',
      translations: Object.fromEntries(detail.translations.map(t => [t.language_code, t.name])),
    },
    stages: detail.stages.map(stageFromDetail),
  }
}

function stageFromDetail(stage: AdminSeriesStage): DraftStage {
  return {
    key: `s${stage.id}`,
    id: stage.id,
    kind: stage.kind,
    label: stage.label ?? '',
    fallbackName: stage.game_name ?? stage.entries[0]?.trophy_set.name ?? '',
    releaseDate: stage.release_date,
    entries: stage.entries.map(entry => ({ set: entry.trophy_set, source: entry.source })),
  }
}

/** A new, empty stage (the save is blocked until it has a trophy set). */
export function emptyStage(kind: 'main' | 'side' = 'main'): DraftStage {
  return { key: newStageKey(), id: null, kind, label: '', fallbackName: '', releaseDate: null, entries: [] }
}

/** Body of `PUT /admin/series/{id}`. */
export function savePayload(revision: number, meta: DraftMeta, stages: DraftStage[]) {
  return {
    revision,
    name: meta.name.trim(),
    description: meta.description.trim() || null,
    status: meta.status,
    auto_update: meta.autoUpdate,
    cover_url: meta.coverUrl.trim() || null,
    translations: Object.entries(meta.translations).map(([language_code, name]) => ({ language_code, name: name.trim() || null })),
    stages: stages.map(stage => ({
      id: stage.id,
      kind: stage.kind,
      label: stage.label.trim() || null,
      trophy_set_ids: stage.entries.map(entry => entry.set.id),
    })),
  }
}

/** Comparable form of a draft: what a save would send, minus the revision. */
export function draftSignature(meta: DraftMeta, stages: DraftStage[]): string {
  const { revision: _revision, translations, ...rest } = savePayload(0, meta, stages)
  return JSON.stringify({ ...rest, translations: translations.filter(t => t.name).sort((a, b) => a.language_code.localeCompare(b.language_code)) })
}

/** Every trophy set id in the draft. */
export const draftSetIds = (stages: DraftStage[]) => new Set(stages.flatMap(stage => stage.entries.map(entry => entry.set.id)))

/**
 * Move a trophy set to another stage, before `beforeSetId` there (or at the
 * end). `toKey` may be `'new'`: a new stage right after the source stage.
 */
export function moveEntry(stages: DraftStage[], setId: number, toKey: string, beforeSetId?: number | null): DraftStage[] {
  const from = stages.find(stage => stage.entries.some(entry => entry.set.id === setId))
  if (!from) return stages
  const entry = from.entries.find(e => e.set.id === setId)!
  let next = stages.map(stage => stage === from ? { ...stage, entries: stage.entries.filter(e => e.set.id !== setId) } : stage)
  let targetKey = toKey
  if (toKey === 'new') {
    const created = { ...emptyStage(from.kind), fallbackName: entry.set.name }
    const index = next.findIndex(stage => stage.key === from.key)
    next = [...next.slice(0, index + 1), created, ...next.slice(index + 1)]
    targetKey = created.key
  }
  return next.map((stage) => {
    if (stage.key !== targetKey) return stage
    const entries = [...stage.entries]
    const at = beforeSetId == null ? -1 : entries.findIndex(e => e.set.id === beforeSetId)
    entries.splice(at === -1 ? entries.length : at, 0, entry)
    return { ...stage, entries }
  })
}

/** Move a stage to `toIndex` (positions counted after it is taken out). */
export function moveStage(stages: DraftStage[], key: string, toIndex: number): DraftStage[] {
  const from = stages.findIndex(stage => stage.key === key)
  if (from === -1) return stages
  const next = [...stages]
  const [stage] = next.splice(from, 1)
  next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, stage!)
  return next
}

/** Fold a stage into the one before it (its versions go to the end there). */
export function mergeIntoPrevious(stages: DraftStage[], key: string): DraftStage[] {
  const index = stages.findIndex(stage => stage.key === key)
  if (index <= 0) return stages
  const previous = stages[index - 1]!
  const merged = { ...previous, entries: [...previous.entries, ...stages[index]!.entries] }
  return [...stages.slice(0, index - 1), merged, ...stages.slice(index + 1)]
}

/**
 * Add trophy sets to a stage (`'new'`: a new stage at the end), skipping any
 * already in the series. Added sets are the admin's own, so they count as manual.
 */
export function addSets(stages: DraftStage[], sets: AdminSeriesSet[], toKey: string): DraftStage[] {
  const present = draftSetIds(stages)
  const fresh = sets.filter((set, i) => !present.has(set.id) && sets.findIndex(s => s.id === set.id) === i)
  if (!fresh.length) return stages
  const entries = fresh.map(set => ({ set, source: 'manual' as const }))
  if (toKey === 'new' || !stages.some(stage => stage.key === toKey)) {
    return [...stages, { ...emptyStage(), fallbackName: fresh[0]!.name, entries }]
  }
  return stages.map(stage => stage.key === toKey ? { ...stage, entries: [...stage.entries, ...entries] } : stage)
}

export function removeEntry(stages: DraftStage[], setId: number): DraftStage[] {
  return stages.map(stage => ({ ...stage, entries: stage.entries.filter(entry => entry.set.id !== setId) }))
}

/** What changed against the saved series, in a line for the save bar. */
export function changeSummary(saved: DraftStage[], draft: DraftStage[]): { added: number; removed: number; restructured: boolean } {
  const before = draftSetIds(saved)
  const after = draftSetIds(draft)
  const added = [...after].filter(id => !before.has(id)).length
  const removed = [...before].filter(id => !after.has(id)).length
  const shape = (stages: DraftStage[]) => JSON.stringify(stages.map(s => [s.id, s.kind, s.label.trim(), s.entries.map(e => e.set.id)]))
  return { added, removed, restructured: shape(saved) !== shape(draft) }
}
