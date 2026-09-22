export interface AdminColumn {
  key: string
  label: string
}
export interface AdminFilter {
  key: string
  label: string
  options?: { value: string; label: string }[]
  type?: string
}
export interface AdminOperation {
  id: string
  status: string
  error: string | null
  result: { penalty_id?: number; data_purged?: boolean } | null
}
export interface AdminPreview {
  identity: { psnid: string; account_id: string; user_id: number | null }
  preview_token: string
  penalties: Record<string, unknown>[]
  impact: { termination: string; ranking_ban: string }
}
export interface QueueSummary {
  available: boolean
  worker_status: string
  message?: string
  updated_at?: string
  queues: { name: string; waiting: number; delayed: number; reserved: number }[]
  supervisors: unknown[]
}
export interface ScheduleTask {
  key: string
  command: string
  expression: string
  timezone: string
  next_run_at: string
  last_run: Record<string, unknown> | null
  history_enabled: boolean
}
export interface ScheduleSummary {
  scheduler: { available: boolean; status: string; last_seen_at: string | null }
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
  termination: '永久封禁',
  ranking_ban: '排名处罚',
  user: '普通用户',
  moderator: '版主',
  admin: '管理员',
  dispatched: '已派发',
  manual: '手动',
  automatic: '自动',
}
export const fieldLabels: Record<string, string> = {
  id: 'ID',
  psnid: 'PSN ID',
  account_id: 'Account ID',
  user_id: '用户 ID',
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
  queue: '队列',
  job: '任务类型',
  subject: '业务对象',
  attempt: '尝试次数',
  attempts: '尝试次数',
  duration_ms: '耗时（毫秒）',
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
  output: '错误输出',
  task: '任务',
  command: '任务命令',
  expression: '调度规则',
  timezone: '时区',
  next_run_at: '下次计划执行',
  last_run: '最近执行',
  history_enabled: '保存执行历史',
  platform: '平台',
  version: '版本',
  detail: '说明',
  language: '语言',
  language_code: '语言',
  source: '来源',
  is_default: '默认语言',
  trophy_id: '奖杯 ID',
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
export function adminApiPrefix(base: string): string {
  return /\/api\/?$/.test(base) ? '/admin' : '/api/admin'
}
export function adminQuery(query: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(query).filter(
      ([key, value]) =>
        !['detail', 'tab'].includes(key) && value !== '' && value != null,
    ),
  )
}
