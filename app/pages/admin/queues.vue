<script setup lang="ts">
import { Activity, CircleX, History, ListTodo, Server } from 'lucide'
import { statusLabels, type QueueSummary } from '~/utils/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi(),
  route = useRoute(),
  router = useRouter()
const summary = ref<QueueSummary | null>(null),
  error = ref<any>(null),
  busy = ref(false),
  supervisorsOpen = ref(false)
const tab = computed(() =>
  ['live', 'failed', 'history'].includes(String(route.query.tab))
    ? String(route.query.tab)
    : 'live',
)
async function refresh() {
  busy.value = true
  try {
    summary.value = await api.get<QueueSummary>('/queues')
    error.value = null
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
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
  { key: 'id', label: 'UUID', mono: true },
  { key: 'job', label: '任务' },
  { key: 'queue', label: '队列', mono: true },
  { key: 'status', label: '状态' },
  { key: 'attempts', label: '尝试次数' },
]
const failedColumns = [
  { key: 'uuid', label: 'UUID', mono: true },
  { key: 'job', label: '任务' },
  { key: 'queue', label: '队列', mono: true },
  { key: 'failed_at', label: '失败时间' },
  { key: 'retryable', label: '支持重试' },
]
const historyColumns = [
  { key: 'subject', label: '对象' },
  { key: 'queue', label: '队列', mono: true },
  { key: 'status', label: '结果' },
  { key: 'items_total', label: '分项总数' },
  { key: 'items_failed', label: '分项失败' },
  { key: 'duration_ms', label: '耗时' },
  { key: 'created_at', label: '时间' },
]
const timeFilters = [
  { key: 'from', label: '开始时间', type: 'datetime-local' },
  { key: 'to', label: '结束时间', type: 'datetime-local' },
]
const tabs = [
  { id: 'live', name: '实时任务', icon: Activity },
  { id: 'failed', name: '可重试失败', icon: CircleX },
  { id: 'history', name: '执行历史', icon: History },
]
const retried = ref<string | null>(null)
function afterRetry(uuid: string, reload: () => Promise<unknown>, close: () => void) {
  retried.value = uuid
  close()
  void reload()
}
</script>
<template>
  <AdminPageHeader
    :icon="ListTodo"
    title="队列监控"
    description="实时状态来自 Horizon / Redis，执行历史与可重试失败任务分别存储。"
  >
    <AdminRefresh :busy="busy" live @click="refresh" />
  </AdminPageHeader>
  <AdminError :error="error" />
  <section v-if="summary" class="admin-panel overflow-hidden">
    <header class="admin-panel-head">
      <div class="flex items-center gap-3">
        <h2 class="admin-panel-title">Horizon Worker</h2>
        <AdminStatus
          :value="
            !summary.available
              ? 'unavailable'
              : summary.worker_status === 'running'
                ? 'online'
                : summary.worker_status
          "
        />
      </div>
      <button
        class="admin-link"
        :disabled="!summary.supervisors.length"
        @click="supervisorsOpen = true"
      >
        <LucideIcon :icon="Server" class="size-3.5" />Supervisor
        <span class="admin-count">{{ summary.supervisors.length }}</span>
      </button>
    </header>
    <p
      v-if="!summary.available"
      class="px-4 py-10 text-center text-[13px] text-slate-500"
    >
      {{ summary.message || 'Horizon 当前不可用' }}
    </p>
    <ul
      v-else
      class="grid grid-cols-2 divide-slate-200 sm:grid-cols-3 lg:grid-cols-5 [&>li]:border-b [&>li]:border-r [&>li]:border-slate-200 -mb-px -mr-px"
    >
      <li v-for="queue in summary.queues" :key="queue.name" class="p-4">
        <p class="truncate font-mono text-xs text-slate-500" :title="queue.name">
          {{ queue.name }}
        </p>
        <p
          class="mt-2 text-2xl font-semibold tracking-tight text-slate-950 tabular-nums"
        >
          {{ queue.waiting.toLocaleString() }}
        </p>
        <dl class="mt-2 flex gap-4 text-xs tabular-nums">
          <div>
            <dt class="text-slate-400">延迟</dt>
            <dd class="font-medium text-slate-700">{{ queue.delayed }}</dd>
          </div>
          <div>
            <dt class="text-slate-400">已保留</dt>
            <dd class="font-medium text-slate-700">{{ queue.reserved }}</dd>
          </div>
        </dl>
      </li>
    </ul>
  </section>
  <Drawer v-model:open="supervisorsOpen" side="right" size="wide" title="Supervisor">
    <div v-if="summary" class="p-5">
      <AdminDataView :value="summary.supervisors" />
    </div>
  </Drawer>
  <div>
    <div class="admin-panel rounded-b-none px-4">
      <div class="admin-utabs" role="tablist" aria-label="队列视图">
        <button
          v-for="item in tabs"
          :key="item.id"
          role="tab"
          class="admin-utab"
          :aria-selected="tab === item.id"
          @click="router.replace({ query: { tab: item.id } })"
        >
          <LucideIcon :icon="item.icon" class="size-4" />{{ item.name }}
        </button>
      </div>
    </div>
  <AdminCollection
    v-if="tab === 'live'"
    key="live"
    title="实时任务"
    description="Horizon 数据按配置定期过期；已保留包含正在执行及等待超时回收的任务。"
    embedded
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
    description="仅 failed_jobs 中受支持的任务可以重试。"
    embedded
    endpoint="/failed-jobs"
    detail-base="/failed-jobs"
    id-key="uuid"
    :columns="failedColumns"
    :filters="[
      { key: 'queue', label: '队列', options: queues },
      ...timeFilters,
    ]"
    ><template #detail-actions="{ row, reload, close }"
      ><p
        v-if="retried === row.uuid"
        class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[13px] text-emerald-800"
      >
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
    embedded
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
  </div>
</template>
