import { TIP_LANGUAGE_CODES } from '~/utils/tip'

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
/** Penalty levels, mildest first. The API has no default: picking the wrong
    one can delete an account, so the admin always chooses. */
export const PENALTY_LEVELS: {
  value: PenaltyLevel
  label: string
  effect: string
}[] = [
  {
    value: 'ranking_ban',
    label: '禁止排名',
    effect: '清空现有名次，不再参与任何排行榜；仍可同步与登录，数据全部保留。',
  },
  {
    value: 'termination',
    label: '永久停用',
    effect: '禁止同步与登录，删除该用户的全部数据连同用户行，资料页随之消失。',
  },
]
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
/** Mail categories: whether a mail honours the subscription switches and can be unsubscribed from. */
export const MAIL_CATEGORIES = [
  { value: 'transactional', label: '账户与安全', note: '验证码、反馈回复等，总是发送、不能退订' },
  { value: 'important', label: '重要通知', note: '故障、维护等' },
  { value: 'features', label: '新功能通知', note: '' },
  { value: 'other', label: '其他推送', note: '' },
] as const
export type MailCategory = (typeof MAIL_CATEGORIES)[number]['value']
export const MAIL_CATEGORY_LABELS = Object.fromEntries(MAIL_CATEGORIES.map((c) => [c.value, c.label])) as Record<MailCategory, string>
export const MAIL_STATUSES = [
  { value: 'queued', label: '排队中' },
  { value: 'sent', label: '已发送' },
  { value: 'failed', label: '失败' },
  { value: 'skipped', label: '已跳过' },
  { value: 'cancelled', label: '已取消' },
] as const
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
/** The five UI languages, which are also the languages mails are sent in. */
export const MAIL_LOCALES = [
  { value: 'zh-Hans', label: '简体中文' },
  { value: 'zh-Hant', label: '繁體中文' },
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어' },
] as const
export type MailLocale = (typeof MAIL_LOCALES)[number]['value']
/** Feedback type / visibility labels and filter options (statuses go through `statusLabels`). */
export const FEEDBACK_TYPE_OPTIONS = [
  { value: 'bug', label: 'Bug' },
  { value: 'suggestion', label: '建议' },
  { value: 'other', label: '其他' },
]
export const FEEDBACK_STATUS_OPTIONS = [
  { value: 'open', label: '待处理' },
  { value: 'in_progress', label: '处理中' },
  { value: 'done', label: '已完成' },
  { value: 'declined', label: '不处理' },
]
export const FEEDBACK_VISIBILITY_OPTIONS = [
  { value: 'pending', label: '待审核' },
  { value: 'public', label: '公开' },
  { value: 'hidden', label: '已隐藏' },
]
export const FEEDBACK_TYPE_LABELS: Record<string, string> = Object.fromEntries(FEEDBACK_TYPE_OPTIONS.map((o) => [o.value, o.label]))
export const FEEDBACK_VISIBILITY_LABELS: Record<string, string> = Object.fromEntries(FEEDBACK_VISIBILITY_OPTIONS.map((o) => [o.value, o.label]))
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
export const TIP_SORT_OPTIONS = [
  { value: 'latest', label: '最新发布' },
  { value: 'updated', label: '最近修改' },
  { value: 'helpful', label: '「有帮助」最多' },
  { value: 'unhelpful', label: '「无帮助」最多' },
]
export const TIP_SPOILER_OPTIONS = [
  { value: '1', label: '含剧透' },
  { value: '0', label: '不含剧透' },
]
/** Languages a Tip can be written in, named in Chinese like the rest of the console. */
export const TIP_LANGUAGE_OPTIONS = TIP_LANGUAGE_CODES.map((code) => ({ value: code, label: `${chineseLanguageName(code)}（${code}）` }))
export const TIP_LANGUAGE_LABELS: Record<string, string> = Object.fromEntries(TIP_LANGUAGE_CODES.map((code) => [code, chineseLanguageName(code)]))
function chineseLanguageName(code: string): string {
  try {
    return new Intl.DisplayNames(['zh-Hans'], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}
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
  content_type: string
  created_at: string
  updated_at: string
  trophy: { id: number, name: string, icon_url: string, type: string } | null
  trophy_set: { id: number, name: string, icon_url: string, platform: string[] } | null
  user?: { id: number, psnid: string, avatar_url: string | null, country: string | null, trophy_level: number | null, tip_count: number, tip_vote_count: number } | null
}
/** What an edit form changed (content compared trimmed), ready to PATCH; empty when nothing did. */
export function adminTipChanges(saved: AdminTipFields, form: AdminTipFields): Partial<AdminTipFields> {
  const changes: Partial<AdminTipFields> = {}
  const content = form.content.trim()
  if (content !== saved.content) changes.content = content
  if (form.language !== saved.language) changes.language = form.language
  if (form.has_spoiler !== saved.has_spoiler) changes.has_spoiler = form.has_spoiler
  if (form.missable !== saved.missable) changes.missable = form.missable
  return changes
}
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
/** A row of `GET /bans`: an active penalty. An account with several
    penalties has one row each. */
export interface BanRecord {
  id: number
  account_id: string
  /** The name recorded at ban time; later renames do not update it. */
  psnid: string
  level: PenaltyLevel
  source: string
  reason_code: string | null
  reason: string | null
  moderator: { id: number; psnid: string } | null
  banned_at: string
  /** Terminations only: null while the purge is unfinished, and
      resubmitting the termination retries it. Always null for ranking bans. */
  data_purged_at: string | null
  evidence_count: number
  is_psnprofiles_banned: boolean
}
/** The API saves evidence for at most this many trophy sets per ban. */
export const BAN_EVIDENCE_MAX = 20
/**
 * Read evidence trophy-set IDs from free text: plain IDs or pasted trophy
 * page links (`/trophies/123`), separated by spaces, commas or new lines.
 * Duplicates collapse; anything else is returned as invalid.
 */
export function adminParseTrophySetIds(text: string): {
  ids: number[]
  invalid: string[]
} {
  const ids: number[] = []
  const invalid: string[] = []
  for (const token of text.split(/[\s,，、;；]+/).filter(Boolean)) {
    const match = /^\d+$/.test(token)
      ? token
      : /\/trophies\/(\d+)(?:[/?#]|$)/.exec(token)?.[1]
    const id = match ? Number(match) : 0
    if (!Number.isSafeInteger(id) || id < 1) invalid.push(token)
    else if (!ids.includes(id)) ids.push(id)
  }
  return { ids, invalid }
}
/** UTF-8 length, which is how the API limits penalty reasons. */
export function adminUtf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length
}
export const statusLabels: Record<string, string> = {
  success: '成功',
  failed: '失败',
  partial: '部分失败',
  running: '执行中',
  queued: '等待执行',
  pending: '等待执行',
  completed: '完成',
  skipped: '已跳过',
  healthy: '正常',
  stale: '心跳过期',
  unknown: '未知',
  unavailable: '不可用',
  suspected_interrupted: '疑似中断',
  online: '在线',
  offline: '离线',
  paused: '已暂停',
  termination: '永久停用',
  ranking_ban: '禁止排名',
  user: '普通用户',
  moderator: '版主',
  admin: '管理员',
  dispatched: '已派发',
  manual: '手动',
  automatic: '自动',
  sent: '已发送',
  sending: '发送中',
  cancelled: '已取消',
  open: '待处理',
  in_progress: '处理中',
  done: '已完成',
  declined: '不处理',
}
export const fieldLabels: Record<string, string> = {
  id: 'ID',
  psnid: 'PSN ID',
  account_id: 'Account ID',
  user_id: '用户 ID',
  guest_name: '访客昵称',
  ip_address: 'IP',
  user_agent: 'User-Agent',
  visibility: '可见性',
  reply_count: '回复数',
  has_staff_reply: '有官方回复',
  awaiting_reply: '待回复',
  notifies_author: '回复会发邮件',
  last_activity_at: '最后活动',
  reviewed_by: '审核人',
  reviewed_at: '审核时间',
  actor_id: '管理员 ID',
  moderator_user_id: '执行人 ID',
  name: '名称',
  role: '角色',
  country: '地区',
  status: '状态',
  created_at: '创建时间',
  updated_at: '更新时间',
  registered_at: '注册时间',
  last_synced_at: '最近同步',
  sync_next_at: '下次同步',
  sync_interval: '同步间隔（小时）',
  reason_description: '处罚理由',
  reason: '操作理由',
  penalty_level: '处罚类型',
  penalty_source: '处罚来源',
  internal_note: '内部备注',
  evidence: '证据',
  revoked_at: '撤销时间',
  revoked_by_user_id: '撤销人 ID',
  revocation_reason: '撤销理由',
  data_purged_at: '清理完成时间',
  level: '处罚等级',
  banned_at: '封禁时间',
  reason_code: '理由代码',
  moderator: '执行人',
  evidence_count: '证据条数',
  is_psnprofiles_banned: 'PSNProfiles 已封禁',
  queue: '队列',
  job: '任务类型',
  subject: '业务对象',
  attempt: '尝试次数',
  attempts: '尝试次数',
  duration_ms: '耗时',
  items_total: '分项总数',
  items_failed: '分项失败',
  items_skipped: '分项跳过',
  error: '错误',
  exception: '异常堆栈',
  context: '上下文',
  stage: '失败阶段',
  error_message: '错误说明',
  np_communication_id: '奖杯组编号',
  np_service_name: 'PSN 服务',
  started_at: '开始时间',
  finished_at: '结束时间',
  failed_at: '失败时间',
  exit_code: '退出码',
  output: '输出',
  task: '任务',
  command: '任务命令',
  description: '任务说明',
  expression: '调度规则',
  frequency: '执行频率',
  timezone: '时区',
  next_run_at: '下次计划执行',
  last_run: '最近执行',
  history_available: '执行历史可用',
  run_counts: '执行统计',
  platform: '平台',
  version: '版本',
  detail: '说明',
  language: '语言',
  language_code: '语言',
  source: '来源',
  is_default: '默认语言',
  trophy_id: '奖杯 ID',
  trophy_set_id: '奖杯组 ID',
  trophy_set: '奖杯组',
  psn_trophy_id: 'PSN 奖杯编号',
  psn_group_id: '分组',
  type: '类型',
  content: '攻略内容',
  content_type: '内容格式',
  has_spoiler: '包含剧透',
  missable: '易错过',
  vote_up_count: '有帮助',
  vote_down_count: '无帮助',
  points: '点数',
  trophy_level: '奖杯等级',
  platinum: '白金',
  gold: '金杯',
  silver: '银杯',
  bronze: '铜杯',
  rank: '全球排名',
  server_rank: '地区排名',
  is_rankable: '排名资格',
  is_profile_public: '资料公开',
  is_plus: 'PS Plus',
  progress: '进度',
  played_game_count: '游玩游戏数',
  completed_game_count: '完成游戏数',
  user: '用户',
  penalties: '处罚历史',
  sync: '同步状态',
  state: '当前状态',
  penalty: '处罚',
  operation: '清理操作',
  result: '执行结果',
  set: '奖杯组',
  trophies: '奖杯清单',
  translations: '翻译覆盖',
  trophy: '奖杯',
  group_translations_count: '已翻译分组数',
  trophy_translations_count: '已翻译奖杯数',
  action: '操作类型',
  before: '变更前',
  after: '变更后',
  request_id: '请求 ID',
  audit_id: '审计 ID',
  http_status: 'HTTP 状态',
  available: '服务可用',
  retryable: '支持重试',
  retry_note: '重试说明',
  connection: '连接',
  uuid: '任务 UUID',
  owners: '拥有者',
  completed: '已完成',
  tip_count: '攻略数量',
  tip_vote_count: '累计有帮助',
  defined_trophies: '奖杯定义',
  avatar_url: '头像地址',
  icon_url: '图标地址',
  banner_url: '横幅地址',
  about_me: '简介',
  auto_sync_enabled: '自动同步开关',
  sync_min_level: '同步最低等级',
}
export function adminValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'object')
    return Array.isArray(value) ? value.map(adminValue).join('、') : '详情'
  return statusLabels[String(value)] ?? String(value)
}
const pad = (n: number) => String(n).padStart(2, '0')
/**
 * Parse an admin API timestamp. The API speaks UTC: zone-less strings
 * ("2026-09-24 01:10:02") are read as UTC, numbers as Unix seconds.
 */
export function adminParseDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return new Date(value * 1000)
  const text = String(value).trim()
  const zoneless = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(text)
  const date = new Date(zoneless ? text.replace(' ', 'T') + 'Z' : text)
  return Number.isNaN(date.getTime()) ? null : date
}
/** Format a timestamp in the browser's time zone as "YYYY-MM-DD HH:mm:ss". */
export function adminDate(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  const date = value instanceof Date ? value : adminParseDate(value)
  if (!date) return String(value)
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}
/**
 * Humanize a duration in milliseconds: "842 毫秒", "1.8 秒", "3 分 12 秒",
 * "2 小时 5 分", "1 天 3 小时". Non-numeric values pass through.
 */
export function adminDuration(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  const ms = Number(value)
  if (!Number.isFinite(ms) || ms < 0) return String(value)
  if (ms < 1000) return `${Math.round(ms)} 毫秒`
  const seconds = ms / 1000
  if (seconds < 60)
    return `${seconds < 10 ? Number(seconds.toFixed(1)) : Math.round(seconds)} 秒`
  const total = Math.round(seconds)
  const [d, h, m, s] = [
    Math.floor(total / 86400),
    Math.floor((total % 86400) / 3600),
    Math.floor((total % 3600) / 60),
    total % 60,
  ]
  const parts = d
    ? [[d, '天'], [h, '小时']]
    : h
      ? [[h, '小时'], [m, '分']]
      : [[m, '分'], [s, '秒']]
  return parts
    .filter(([n], i) => i === 0 || n)
    .map(([n, unit]) => `${n} ${unit}`)
    .join(' ')
}
/**
 * Display a record field: timestamps (`*_at`) in local time, durations
 * (`*_ms`) humanized, the rest as-is.
 */
export function adminField(key: string, value: unknown): string {
  if (typeof value === 'boolean') return adminValue(value)
  if (key.endsWith('_at')) return adminDate(value)
  if (key.endsWith('_ms')) return adminDuration(value)
  return adminValue(value)
}
/**
 * Convert a local `datetime-local` value ("YYYY-MM-DDTHH:mm") to the UTC
 * "YYYY-MM-DDTHH:mm" the API filters on. Other values pass through.
 */
export function adminLocalToUtc(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 16)
}
export function adminApiPrefix(base: string): string {
  return `${base.replace(/\/+$/, '')}/admin`
}
export function adminQuery(query: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([key, value]) =>
        !['detail', 'tab'].includes(key) && value !== '' && value != null,
    ),
  )
}
