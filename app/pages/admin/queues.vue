<script setup lang="ts">
import { statusLabels, type QueueSummary } from '~/utils/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi(),
  route = useRoute(),
  router = useRouter()
const summary = ref<QueueSummary | null>(null),
  error = ref<any>(null)
const tab = computed(() =>
  ['live', 'failed', 'history'].includes(String(route.query.tab))
    ? String(route.query.tab)
    : 'live',
)
async function refresh() {
  try {
    summary.value = await api.get<QueueSummary>('/queues')
    error.value = null
  } catch (e) {
    error.value = e
  }
}
onMounted(refresh)
useAdminPoll(refresh)
const queues = [
  'default',
  'psn-sync',
  'psn-sync-auto',
  'psn-localization',
  'share-card',
].map((value) => ({ value, label: value }))
const liveColumns = [
  { key: 'id', label: 'UUID' },
  { key: 'job', label: '任务' },
  { key: 'queue', label: '队列' },
  { key: 'status', label: '状态' },
  { key: 'attempts', label: '尝试次数' },
]
const failedColumns = [
  { key: 'uuid', label: 'UUID' },
  { key: 'job', label: '任务' },
  { key: 'queue', label: '队列' },
  { key: 'failed_at', label: '失败时间' },
  { key: 'retryable', label: '支持重试' },
]
const historyColumns = [
  { key: 'subject', label: '对象' },
  { key: 'queue', label: '队列' },
  { key: 'status', label: '结果' },
  { key: 'items_total', label: '分项总数' },
  { key: 'items_failed', label: '分项失败' },
  { key: 'duration_ms', label: '耗时 ms' },
  { key: 'created_at', label: '时间' },
]
const timeFilters = [
  { key: 'from', label: '开始时间（UTC）', type: 'datetime-local' },
  { key: 'to', label: '结束时间（UTC）', type: 'datetime-local' },
]
const retried = ref<string | null>(null)
function afterRetry(uuid: string, reload: () => Promise<unknown>, close: () => void) {
  retried.value = uuid
  close()
  void reload()
}
</script>
<template>
  <div>
    <h1 class="text-2xl font-bold">队列监控</h1>
    <p class="mt-2 text-sm text-slate-500">
      实时状态来自 Horizon / Redis，执行历史与可重试失败任务分别存储。
    </p>
  </div>
  <AdminError :error="error" />
  <div v-if="summary" class="admin-card">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="font-semibold">Worker 状态</h2>
      <AdminStatus
        :value="summary.available ? summary.worker_status : 'unavailable'"
      />
    </div>
    <p v-if="!summary.available" class="text-sm text-slate-500">
      {{ summary.message }}
    </p>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <div
        v-for="queue in summary.queues"
        :key="queue.name"
        class="rounded-lg bg-slate-50 p-4"
      >
        <h3 class="break-all font-mono text-sm">{{ queue.name }}</h3>
        <p class="mt-3 text-2xl font-semibold">
          {{ queue.waiting }}
          <span class="text-xs font-normal text-slate-500">等待</span>
        </p>
        <p class="mt-2 text-xs text-slate-500">
          延迟 {{ queue.delayed }} · 已保留 {{ queue.reserved }}
        </p>
      </div>
    </div>
    <details class="mt-4 text-sm">
      <summary class="cursor-pointer text-slate-500">Supervisor 详情</summary>
      <AdminDataView :value="summary.supervisors" class="mt-3" />
    </details>
  </div>
  <nav class="flex gap-2" aria-label="队列视图">
    <button
      v-for="item in [
        { id: 'live', name: '实时任务' },
        { id: 'failed', name: '可重试失败任务' },
        { id: 'history', name: '执行历史' },
      ]"
      :key="item.id"
      class="admin-button"
      :class="tab === item.id ? 'admin-primary' : ''"
      @click="router.replace({ query: { tab: item.id } })"
    >
      {{ item.name }}
    </button>
  </nav>
  <AdminCollection
    v-if="tab === 'live'"
    key="live"
    title="实时任务"
    description="Horizon 数据按配置定期过期；已保留包含正在执行及等待超时回收的任务。"
    endpoint="/queue-jobs"
    detail-base="/queue-jobs"
    :columns="liveColumns"
    :filters="[
      {
        key: 'status',
        label: '状态',
        options: [
          { value: 'recent', label: '最近任务' },
          { value: 'pending', label: '待处理 / 执行中' },
          { value: 'completed', label: '已完成' },
        ],
      },
    ]"
    poll
    cursor-mode
  />
  <AdminCollection
    v-else-if="tab === 'failed'"
    key="failed"
    title="失败任务"
    description="仅 failed_jobs 中受支持的任务可以重试。处罚清理请从处罚详情操作。"
    endpoint="/failed-jobs"
    detail-base="/failed-jobs"
    id-key="uuid"
    :columns="failedColumns"
    :filters="[
      { key: 'queue', label: '队列', options: queues },
      ...timeFilters,
    ]"
    ><template #detail-actions="{ row, reload, close }"
      ><p v-if="retried === row.uuid" class="text-sm text-emerald-700">
        重试已派发，请在实时任务中查看，刷新列表可移除旧记录。
      </p>
      <AdminAction
        v-else-if="row.retryable"
        :path="`/failed-jobs/${row.uuid}/retry`"
        label="重试此任务"
        description="服务器会重新检查业务对象及封禁状态，通过后派发一次任务。"
        @done="afterRetry(row.uuid, reload, close)" /></template
  ></AdminCollection>
  <AdminCollection
    v-else
    key="history"
    title="执行历史"
    description="partial 为分项失败，不代表存在可重试的 failed_jobs 记录。自动同步和卡片记录保留 3 个月，其余队列保留 1 年。"
    endpoint="/queue-logs"
    :columns="historyColumns"
    :filters="[
      { key: 'q', label: 'PSN ID / 业务对象' },
      { key: 'queue', label: '队列', options: queues },
      {
        key: 'status',
        label: '结果',
        options: ['success', 'partial', 'failed'].map((value) => ({
          value,
          label: statusLabels[value]!,
        })),
      },
      ...timeFilters,
    ]"
  />
</template>
