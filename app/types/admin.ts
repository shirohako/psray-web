/**
 * Shapes of the admin API (`/admin/*`). Option lists, labels and formatting
 * for the console live in `~/utils/admin`.
 */

// ── Generic list pages (AdminCollection) ─────────────────────────────────────

export interface AdminColumn {
  key: string
  label: string
  /** Render identifiers (IDs, UUIDs, queue names) in monospace. */
  mono?: boolean
}
export interface AdminFilter {
  key: string
  label: string
  options?: { value: string; label: string }[]
  type?: string
}

// ── Overview ─────────────────────────────────────────────────────────────────

/** `GET /overview`: the console's front page in one request. */
export interface AdminOverview {
  /** Queue job outcomes over the last 24 hours, per status. */
  queue_results: { status: string; count: number }[]
  queues: QueueSummary
  scheduler: ScheduleSummary['scheduler']
  recent_failures: SyncFailureRecord[]
  updated_at: string
}

// ── Queues, schedules, logs ──────────────────────────────────────────────────

export interface QueueSummary {
  available: boolean
  worker_status: string
  message?: string
  updated_at?: string
  queues: { name: string; waiting: number; delayed: number; reserved: number }[]
  supervisors: unknown[]
}
export type ScheduleRunStatus =
  | 'running'
  | 'success'
  | 'failed'
  | 'skipped'
  | 'suspected_interrupted'

export interface ScheduleRunSummary {
  id: number
  status: ScheduleRunStatus
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  exit_code: number | null
  error: string | null
}

export interface ScheduleRunDetail extends ScheduleRunSummary {
  task: string
  output: string | null
}

export interface ScheduleRunCounts {
  total: ScheduleRunResultCounts
  last_24_hours: ScheduleRunResultCounts
  last_7_days: ScheduleRunResultCounts
  last_30_days: ScheduleRunResultCounts
}

export interface ScheduleRunResultCounts {
  success: number
  failed: number
}

export interface ScheduleTask {
  key: string
  command: string
  description: string
  expression: string
  frequency: string
  timezone: string
  next_run_at: string | null
  last_run: ScheduleRunSummary | null
  run_counts: ScheduleRunCounts
  skipped: number
  running: number
  history_available: boolean
}
export interface ScheduleSummary {
  scheduler: {
    available: boolean
    history_available: boolean
    last_seen_at: string | null
    status: 'healthy' | 'stale' | 'unknown' | 'unavailable'
    task_count: number
  }
  tasks: ScheduleTask[]
}
export interface LogWindow {
  available: boolean
  text: string
  next_cursor: string | null
  window_bytes?: number
  file_size?: number
  rotated?: boolean
}
/** One line of a `LogWindow`, split and tagged by `adminLogLines`. */
export interface LogLine {
  /** The leading `[timestamp]`, if any. */
  stamp: string
  /** The rest of the line, verbatim. */
  text: string
  level: 'error' | 'warning' | 'trace' | 'info'
}
/** A row of `GET /sync-failures`; the overview carries the latest few. */
export interface SyncFailureRecord {
  id: number
  psnid: string | null
  np_communication_id: string | null
  stage: string
  error_message: string
  created_at: string
}

// ── Penalties and data purges ────────────────────────────────────────────────

export type PurgeCategory = 'sync' | 'account'
export interface PurgeItem {
  key: string
  label: string
  category: PurgeCategory
  impact: string | null
  count: number
}
export interface PurgeReport {
  items: PurgeItem[]
  totals: Record<PurgeCategory, number>
}
export interface BanEvidenceItem {
  type: string
  trophy_set_id: number
  np_communication_id?: string
  trophy_set_name: string
  platform?: string
  summary: {
    progress: number
    earned: Record<'platinum' | 'gold' | 'silver' | 'bronze', number>
    first_earned_at: string | null
    last_earned_at: string | null
    duration_seconds: number
  } | null
  trophies: unknown[]
}
export interface BanEvidence {
  items: BanEvidenceItem[]
  skipped: (number | string)[]
}
/**
 * The ban target. `synced=false` is an account never synced here: it is
 * resolved through PSN (`psnid` is PSN's canonical spelling) and has no
 * local user or data.
 */
export interface BanTarget {
  id: number | null
  psnid: string
  account_id: string
  registered_at: string | null
  synced: boolean
}
export type PenaltyLevel = 'ranking_ban' | 'termination'
/** `POST /bans` with `dry_run: true`. */
export interface BanPreview {
  dry_run: true
  user: BanTarget
  level: PenaltyLevel
  /** What submitting will do, worded by the API. */
  effect: string
  /** The account already has an active penalty of this level; submitting
      reuses it (and a termination purges again). */
  already_applied: boolean
  requires_account_confirmation: boolean
  purge: PurgeReport | null
  evidence: BanEvidence
}
export interface BanResult {
  penalty_id: number
  level: PenaltyLevel
  user: BanTarget
  purged: PurgeReport | null
  evidence: BanEvidence
}
/** The user `POST /sync-resets` acts on, with stats from before the reset. */
export interface SyncResetTarget {
  id: number
  psnid: string
  account_id: string
  registered_at: string | null
  last_synced_at: string | null
  played_game_count: number
  trophy_count: number
  points: number
  rank: number | null
}
/** `POST /sync-resets` with `dry_run: true`. */
export interface SyncResetPreview {
  dry_run: true
  user: SyncResetTarget
  /** A sync is queued or running; submitting is refused until it ends. */
  syncing: boolean
  /** Sync data only, so `totals.account` is always 0. */
  purge: PurgeReport
}
export interface SyncResetResult {
  queue_id: number
  user: SyncResetTarget
  purged: PurgeReport
}

// ── Mail ─────────────────────────────────────────────────────────────────────

/** Whether a mail honours the subscription switches and can be unsubscribed from. */
export type MailCategory = 'transactional' | 'important' | 'features' | 'other'
/** The five UI languages, which are also the languages mails are sent in. */
export type MailLocale = 'zh-Hans' | 'zh-Hant' | 'ja' | 'en' | 'ko'
/** A row of `GET /mail/logs`; `GET /mail/logs/{id}` adds `uuid`, `error` and `body_html`. */
export interface MailLogRecord {
  id: number
  status: string
  skip_reason: string | null
  category: MailCategory
  template_key: string
  template_name: string | null
  campaign_id: number | null
  user_id: number | null
  psnid: string | null
  to_email: string
  locale: string
  subject: string | null
  attempts: number
  has_body: boolean
  queued_at: string | null
  sent_at: string | null
  failed_at: string | null
  created_at: string
  uuid?: string
  error?: string | null
  body_html?: string | null
}
export interface MailVariable {
  name: string
  label: string
  sample: string
  sensitive: boolean
  /** Rendered as a block of HTML; must stand alone on its own line. */
  block: boolean
}
export interface MailTemplateSummary {
  id: number
  key: string
  name: string
  description: string | null
  category: MailCategory
  is_system: boolean
  locales: string[]
  updated_at: string | null
}
export interface MailTemplateDetail extends MailTemplateSummary {
  variables: MailVariable[]
  translations: Record<string, { subject: string; body: string; updated_at: string | null; updated_by: string | null }>
}
export interface MailPreview {
  subject: string
  html: string
  text: string
  unknown_variables: string[]
}
/** `POST /mail/test` and `POST /mail/templates/{id}/test`: one mail sent right away, past the queue. */
export interface MailTestResult {
  /** Whether the mail server accepted it. */
  ok: boolean
  /** The mailer's own error when it did not. */
  error: string | null
  mail_log_id: number
  /** How it went out; `/mail/test` only. */
  mailer?: string
}
/** `POST /mail/campaigns` with `dry_run: true`: who would get the mail. */
export interface MailCampaignPreview {
  dry_run: true
  template_id: number
  /** Registered users with an email, subscribed or not. */
  registered: number
  /** Those with this category switched on — they get the mail. */
  recipients: number
  unsubscribed: number
  /** Recipients whose language the template lacks; they get `sent_in`. */
  fallback_recipients: number
  locales: { locale: string; recipients: number; has_translation: boolean; sent_in: string | null }[]
  per_minute: number
  estimated_minutes: number
}
export interface MailCampaign {
  id: number
  template_id: number
  template_key: string
  name: string
  category: MailCategory
  status: 'sending' | 'completed' | 'cancelled'
  recipient_count: number
  per_minute: number
  /** Mails per status (queued / sent / failed / skipped / cancelled). */
  progress: Record<string, number>
  locales: string[]
  created_by: string | null
  started_at: string | null
  dispatched_at: string | null
  finished_at: string | null
  cancelled_at: string | null
  /** Detail only: the copy as it was when sending started. */
  content_snapshot?: Record<string, { subject: string; body: string }>
}

// ── Feedback ─────────────────────────────────────────────────────────────────

/** `GET /feedback/summary`: what the sidebar badge and the page's tabs count. */
export interface AdminFeedbackSummary {
  pending: number
  awaiting: number
}
/** One reply in `GET /feedback/{id}`. */
export interface AdminFeedbackReply {
  id: number
  is_staff: boolean
  user_id: number | null
  psnid: string | null
  avatar_url: string | null
  content: string
  image_urls: string[]
  ip_address: string | null
  created_at: string
}
/** `GET /feedback/{id}`; list rows carry the fields up to `last_activity_at`. */
export interface AdminFeedbackDetail {
  id: number
  type: string
  status: string
  visibility: 'pending' | 'public' | 'hidden'
  author: 'user' | 'guest'
  user_id: number | null
  psnid: string | null
  guest_name: string | null
  content: string
  image_urls: string[]
  reply_count: number
  has_staff_reply: boolean
  awaiting_reply: boolean
  ip_address: string | null
  created_at: string
  last_activity_at: string
  user?: { id: number, psnid: string, avatar_url: string | null, country: string | null, trophy_level: number | null } | null
  notifies_author?: boolean
  user_agent?: string | null
  context?: Partial<Record<'page_url' | 'screen' | 'viewport' | 'locale' | 'timezone', string>> | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  replies?: AdminFeedbackReply[]
}

// ── Trophy tips ──────────────────────────────────────────────────────────────

/** The fields of a Tip the console can edit. */
export interface AdminTipFields {
  content: string
  language: string
  has_spoiler: boolean
  missable: boolean | null
}
/** `GET /tips/{id}`; list rows carry everything but `user`. */
export interface AdminTipDetail extends AdminTipFields {
  id: number
  trophy_id: number
  trophy_set_id: number | null
  user_id: number | null
  psnid: string | null
  avatar_url: string | null
  vote_up_count: number
  vote_down_count: number
  /** The formats `<RichContent>` renders; the API writes new tips as Markdown. */
  content_type: 'markdown' | 'html'
  created_at: string
  updated_at: string
  trophy: { id: number, name: string, icon_url: string, type: string } | null
  trophy_set: { id: number, name: string, icon_url: string, platform: string[] } | null
  user?: { id: number, psnid: string, avatar_url: string | null, country: string | null, trophy_level: number | null, tip_count: number, tip_vote_count: number } | null
}

// ── Trophy sets ──────────────────────────────────────────────────────────────

export interface TrophyCountsRecord {
  bronze: number
  silver: number
  gold: number
  platinum: number
}
/** `GET /trophy-sets` row. */
export interface AdminTrophySet {
  id: number
  np_communication_id: string
  name: string
  icon_url: string | null
  platform: string[]
  version: string
  np_service_name: string
  defined_trophies: TrophyCountsRecord | null
  has_trophy_groups: boolean
  owners: number
  /** Region & edition tags, comma-joined codes such as `AS,JP,D` (TROPHY_SET_REGIONS); `null` when unset. */
  region: string | null
  game_id: number | null
  /** The game link was set (or cleared) by an admin; automatic matching leaves it alone. */
  game_link_manual: boolean
  created_at: string | null
  updated_at: string | null
}
export type AdminOverrideTarget = 'set' | 'group' | 'trophy'
export type AdminOverrideField = 'name' | 'detail' | 'icon_url'
/** A manual edit kept on top of PSN data; `upstream_value` is PSN's latest value. */
export interface AdminTrophySetOverride {
  target: AdminOverrideTarget
  /** 0 for the set itself, otherwise the group / trophy `id`. */
  target_id: number
  field: AdminOverrideField
  /** `''` is the default language. */
  language_code: string
  value: string
  upstream_value: string | null
  user_id: number | null
  updated_at: string | null
}
export interface AdminTrophyGroupRow {
  id: number
  psn_group_id: string
  name: string | null
  detail: string | null
  icon_url: string | null
  defined_trophies: TrophyCountsRecord | null
}
export interface AdminTrophyRow {
  id: number
  psn_trophy_id: number
  psn_group_id: string
  type: string
  name: string | null
  detail?: string | null
  icon_url: string | null
  is_hidden: boolean
}
/** `GET /trophy-sets/{id}`; list rows carry everything but the fields below. Texts are in `language`. */
export interface AdminTrophySetDetail extends AdminTrophySet {
  detail?: string | null
  default_language?: string | null
  /** `''` is the default language. */
  language?: string
  languages?: { language_code: string, psn_language: string | null, is_default: boolean }[]
  game?: { id: number, name: string, cover_url: string | null } | null
  groups?: AdminTrophyGroupRow[]
  trophies?: AdminTrophyRow[]
  overrides?: AdminTrophySetOverride[]
}
/** `PUT /trophy-sets/{id}/overrides`. */
export interface AdminTrophySetOverrideResult {
  saved: number
  reverted: number
  trophy_set: AdminTrophySetDetail
}
export interface AdminTrophySetRowChanges {
  added: number
  updated: number
  icon_updated: number
}
/** `POST /trophy-sets/{id}/refresh`. */
export interface AdminTrophySetRefresh {
  changes: { trophy_set: string[], groups: AdminTrophySetRowChanges, trophies: AdminTrophySetRowChanges }
  /** Fields PSN changed that stay as the manual value. */
  overridden?: Pick<AdminTrophySetOverride, 'target' | 'target_id' | 'field' | 'language_code' | 'value' | 'upstream_value'>[]
  localization_queued: boolean
  trophy_set: AdminTrophySetDetail
}

// ── System settings ──────────────────────────────────────────────────────────

/** One editable setting from `GET /settings`. Database values win over env. */
export interface SystemSettingItem {
  key: string
  label: string
  description: string | null
  type: 'string' | 'integer' | 'boolean'
  /** Stored encrypted; `value` is always null, only `is_set` tells. */
  secret: boolean
  /** The env var it falls back to, for display. */
  env: string | null
  is_set: boolean
  /** Where the effective value comes from; `default` is the definition's own default. */
  source: 'database' | 'env' | 'default' | null
  value: string | number | boolean | null
  /** Allowed values for a select; empty for free input. */
  options: { value: string; label: string }[]
  /** Whether clearing the database value still leaves an env value. */
  env_is_set: boolean
  /** The definition's default, used when neither database nor env has a value. */
  default: string | number | boolean | null
  updated_at: string | null
}
export interface SystemSettingGroup {
  key: string
  label: string
  description: string
  items: SystemSettingItem[]
}
export interface SystemSettingsResponse {
  groups: SystemSettingGroup[]
}
/** `PATCH /settings`: the keys that actually changed, plus the fresh list. */
export interface SystemSettingsUpdate extends SystemSettingsResponse {
  changed: string[]
}

// ── Series ───────────────────────────────────────────────────────────────────

export type AdminSeriesStatus = 'draft' | 'published' | 'hidden'
export type AdminSeriesReviewReason = 'large' | 'overlap' | 'new_stage'

/** `GET /admin/series` row and `PATCH /admin/series/{id}` result. */
export interface AdminSeriesSummary {
  id: number
  name: string
  status: AdminSeriesStatus
  source: 'igdb' | 'manual'
  igdb_collection_id: number | null
  auto_update: boolean
  needs_review: boolean
  review_reason: AdminSeriesReviewReason | null
  covers: string[]
  stage_count: number
  side_count: number
  trophy_set_count: number
  popularity: number
  first_year: number | null
  last_year: number | null
  /** Bumped by every full save; sent back with the next one. */
  revision: number
  admin_edited_at: string | null
  created_at: string | null
  updated_at: string | null
}

/** A trophy set as the series editor shows it. */
export interface AdminSeriesSet {
  id: number
  np_communication_id: string
  name: string
  platform: string[]
  region: string | null
  icon_url: string | null
  defined_trophies: Record<string, number> | null
  owners: number
  game_id: number | null
}

export interface AdminSeriesStage {
  id: number
  position: number
  kind: 'main' | 'side'
  label: string | null
  game_id: number | null
  game_name: string | null
  igdb_root_id: number | null
  release_date: string | null
  source: 'auto' | 'manual'
  entries: { source: 'auto' | 'manual'; trophy_set: AdminSeriesSet }[]
}

/**
 * What a review flag is based on, worked out from the current data:
 * `overlap` lists the series that contain most of this one's works (empty once
 * the flag is out of date); `large` carries the stage limit it went over.
 */
export type AdminSeriesReviewDetail =
  | { works: number; containers: { id: number; name: string; works: number; shared: number }[] }
  | { threshold: number }

/** `GET /admin/series/{id}`. */
export interface AdminSeriesDetail extends AdminSeriesSummary {
  description: string | null
  cover_url: string | null
  merged_into_id: number | null
  review_detail: AdminSeriesReviewDetail | null
  translations: { language_code: string; name: string }[]
  stages: AdminSeriesStage[]
  exclusions: { trophy_set_id: number | null; game_id: number | null }[]
}

export interface AdminSeriesSuggestion {
  trophy_set: AdminSeriesSet
  /** The stage holding its siblings or look-alikes; `null` for excluded sets. */
  stage_id: number | null
}

/** `GET /admin/series/{id}/suggestions`. */
export interface AdminSeriesSuggestions {
  same_game: AdminSeriesSuggestion[]
  similar_name: AdminSeriesSuggestion[]
  excluded: AdminSeriesSuggestion[]
}

/** `GET /admin/series/search`. */
export interface AdminSeriesSearch {
  trophy_sets: AdminSeriesSet[]
  games: { id: number; name: string | null; first_release_date: string | null; trophy_sets: AdminSeriesSet[] }[]
}

// ── Games ────────────────────────────────────────────────────────────────────

export type AdminReleasePrecision = 'day' | 'month' | 'quarter' | 'year'
/** Fields IGDB refreshes write; a field an admin changed is locked against them. */
export type AdminGameLockedField = 'releases' | 'first_release_date' | 'summary' | 'aliases'

export interface AdminGameRelease {
  platform: string
  region: string
  release_date: string | null
  date_precision: AdminReleasePrecision
  status: string | null
}

/** `GET /games` row. */
export interface AdminGameSummary {
  id: number
  name: string
  cover_url: string | null
  first_release_date: string | null
  first_release_precision: AdminReleasePrecision | null
  platforms: string[]
  trophy_set_count: number
  locked_fields: AdminGameLockedField[]
  igdb_id: string | null
  created_by_user_id: number | null
  updated_at: string | null
}

export interface AdminGameTrophySet {
  id: number
  np_communication_id: string
  name: string
  icon_url: string | null
  platform: string[]
  owners: number
  game_link_manual: boolean
}

/** `GET /games/{id}`. */
export interface AdminGameDetail {
  id: number
  name: string
  summary: string | null
  cover_url: string | null
  first_release_date: string | null
  first_release_precision: AdminReleasePrecision | null
  platforms: string[]
  translations: { language_code: string, name: string, summary: string | null }[]
  aliases: string[]
  releases: AdminGameRelease[]
  sources: { source: string, external_id: string, url: string | null, synced_at: string | null }[]
  locked_fields: AdminGameLockedField[]
  revision: number
  created_by_user_id: number | null
  created_at: string | null
  updated_at: string | null
  trophy_sets: AdminGameTrophySet[]
  /** What IGDB has now, to compare locked fields with; `null` before the first refresh. */
  igdb: { summary: string | null, aliases: string[], releases: AdminGameRelease[] } | null
}

export interface AdminPlatform {
  code: string
  name: string
  abbreviation: string | null
}

/** `GET /games/igdb/search` row. */
export interface AdminIgdbSearchResult {
  igdb_id: number
  name: string
  url: string | null
  first_release_date: string | null
  cover_url: string | null
  platforms: string[]
  imported_game_id: number | null
}
