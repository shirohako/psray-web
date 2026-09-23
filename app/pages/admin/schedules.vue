<script setup lang="ts">
import type {
  ScheduleRunDetail,
  ScheduleRunStatus,
  ScheduleRunSummary,
  ScheduleSummary,
  ScheduleTask,
} from '~/utils/admin'

definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })

const api = useAdminApi()
const data = ref<ScheduleSummary | null>(null)
const error = ref<any>(null)
const busy = ref(false)
const updated = ref('')

const selected = ref<ScheduleTask | null>(null)
const history = ref<ScheduleRunSummary[]>([])
const historyError = ref<any>(null)
const historyLoading = ref(false)
const historyOpen = ref(false)
const historyFilters = reactive({
  status: '' as '' | ScheduleRunStatus,
  from: '',
  to: '',
  per_page: 20,
})
const historyMeta = reactive({ page: 1, lastPage: 1, total: 0 })

const run = ref<ScheduleRunDetail | null>(null)
const runError = ref<any>(null)
const runLoadingId = ref<number | null>(null)

const countItems = [
  { key: 'total', label: '保留期内' },
  { key: 'last_24_hours', label: '24 小时' },
  { key: 'last_7_days', label: '7 天' },
  { key: 'last_30_days', label: '30 天' },
] as const

async function refresh() {
  if (busy.value) return
  busy.value = true
  try {
    data.value = await api.get<ScheduleSummary>('/schedules')
    error.value = null
    updated.value = new Date().toISOString()
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}

function resetHistoryFilters() {
  historyFilters.status = ''
  historyFilters.from = ''
  historyFilters.to = ''
  historyFilters.per_page = 20
}

async function showHistory(task: ScheduleTask) {
  selected.value = task
  historyOpen.value = true
  history.value = []
  historyError.value = null
  run.value = null
  runError.value = null
  historyMeta.page = 1
  historyMeta.lastPage = 1
  historyMeta.total = 0
  resetHistoryFilters()
  if (task.history_available) await loadHistory(1)
}

async function loadHistory(target = 1) {
  if (!selected.value?.history_available || historyLoading.value) return
  historyLoading.value = true
  historyError.value = null
  run.value = null
  runError.value = null
  try {
    const result = await api.list<ScheduleRunSummary>(
      `/schedules/${encodeURIComponent(selected.value.key)}/runs`,
      {
        status: historyFilters.status || undefined,
        from: historyFilters.from || undefined,
        to: historyFilters.to || undefined,
        page: target,
        per_page: historyFilters.per_page,
      },
    )
    history.value = result.data
    historyMeta.page = Number(
      result.meta?.current_page || result.meta?.page || target,
    )
    historyMeta.lastPage = Number(result.meta?.last_page || 1)
    historyMeta.total = Number(result.meta?.total || 0)
  } catch (e) {
    historyError.value = e
  } finally {
    historyLoading.value = false
  }
}

async function loadRun(id: number) {
  if (runLoadingId.value !== null) return
  runLoadingId.value = id
  run.value = null
  runError.value = null
  try {
    run.value = await api.get<ScheduleRunDetail>(`/schedule-runs/${id}`)
  } catch (e) {
    runError.value = e
  } finally {
    runLoadingId.value = null
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.toLocaleString('zh-CN', {
    timeZone: 'UTC',
    hour12: false,
  })} UTC`
}

function formatDuration(value: number | null | undefined) {
  return value === null || value === undefined
    ? '—'
    : `${value.toLocaleString()} ms`
}

onMounted(refresh)
useAdminPoll(refresh)
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold">定时任务</h1>
      <p class="mt-2 text-sm text-slate-500">
        任务来自 Laravel 当前实际注册的 Schedule，本页仅查看状态与执行记录。
      </p>
    </div>
    <button class="admin-button" :disabled="busy" @click="refresh">
      {{ busy ? '刷新中…' : '刷新' }}
    </button>
  </div>

  <AdminError :error="error" />

  <section v-if="data" class="admin-card space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="font-semibold">调度器</h2>
          <AdminStatus :value="data.scheduler.status" />
        </div>
        <p class="mt-2 text-sm text-slate-500">
          最近心跳：{{ formatDate(data.scheduler.last_seen_at) }}
          <span v-if="!data.scheduler.last_seen_at"
            >· 尚未收到 schedule:run 心跳</span
          >
        </p>
      </div>
      <div class="flex gap-6 text-right text-sm">
        <div>
          <p class="text-slate-400">注册任务</p>
          <p class="mt-1 text-xl font-semibold tabular-nums">
            {{ data.scheduler.task_count }}
          </p>
        </div>
        <div>
          <p class="text-slate-400">执行历史</p>
          <p
            class="mt-1 font-medium"
            :class="
              data.scheduler.history_available
                ? 'text-emerald-700'
                : 'text-amber-700'
            "
          >
            {{ data.scheduler.history_available ? '可用' : '不可用' }}
          </p>
        </div>
      </div>
    </div>
    <p
      v-if="!data.scheduler.history_available"
      class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
    >
      历史表当前不可用；执行统计为 0，最近执行状态可能来自短期缓存。
    </p>
  </section>

  <p v-if="busy && !data" class="admin-card text-sm text-slate-500">
    正在加载任务清单…
  </p>

  <div v-if="data" class="space-y-4">
    <article v-for="task in data.tasks" :key="task.key" class="admin-card">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="break-all font-mono text-sm font-semibold">
            {{ task.command }}
          </h2>
          <p class="mt-2 text-sm text-slate-500">
            {{ task.frequency }} ·
            <span class="font-mono">{{ task.expression }}</span> ·
            {{ task.timezone }}
          </p>
          <p class="mt-2 text-sm text-slate-600">{{ task.description }}</p>
        </div>
        <button
          class="admin-button"
          :disabled="!task.history_available"
          @click="showHistory(task)"
        >
          {{ task.history_available ? '执行历史' : '历史不可用' }}
        </button>
      </div>

      <div
        class="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
      >
        <div class="rounded-lg bg-slate-50 p-4">
          <p class="text-xs font-medium text-slate-400">计划与最近执行</p>
          <p class="mt-3 text-sm">
            下次执行：{{ formatDate(task.next_run_at) }}
          </p>
          <div v-if="task.last_run" class="mt-3 space-y-2 text-sm">
            <div class="flex items-center gap-2">
              <span>最近结果：</span>
              <AdminStatus :value="task.last_run.status" />
            </div>
            <p class="text-slate-500">
              {{ formatDate(task.last_run.started_at) }} ·
              {{ formatDuration(task.last_run.duration_ms) }}
            </p>
            <p v-if="task.last_run.error" class="break-words text-red-700">
              {{ task.last_run.error }}
            </p>
          </div>
          <p v-else class="mt-3 text-sm text-slate-500">从未留下执行记录</p>
        </div>

        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div
              v-for="item in countItems"
              :key="item.key"
              class="rounded-lg border border-slate-100 p-3"
            >
              <p class="text-xs text-slate-400">{{ item.label }}</p>
              <p class="mt-1 text-lg font-semibold tabular-nums">
                {{
                  (
                    task.run_counts[item.key].success +
                    task.run_counts[item.key].failed
                  ).toLocaleString()
                }}
              </p>
              <p class="mt-1 text-xs tabular-nums text-slate-500">
                <span class="text-emerald-700"
                  >成功
                  {{ task.run_counts[item.key].success.toLocaleString() }}</span
                >
                ·
                <span
                  :class="
                    task.run_counts[item.key].failed ? 'text-red-700' : ''
                  "
                  >失败
                  {{ task.run_counts[item.key].failed.toLocaleString() }}</span
                >
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span class="text-slate-500">当前保留的已跳过记录</span>
              <span class="font-semibold tabular-nums">
                {{ task.skipped.toLocaleString() }}
              </span>
            </div>
            <div
              class="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span class="text-slate-500">当前运行中</span>
              <span class="font-semibold tabular-nums">
                {{ task.running.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>

    <p
      v-if="!data.tasks.length"
      class="admin-card py-10 text-center text-sm text-slate-400"
    >
      当前没有注册的定时任务。
    </p>
  </div>

  <p class="text-xs text-slate-400">
    最后更新 {{ formatDate(updated) }} · 执行历史默认保留 30 天
  </p>

  <Dialog
    v-model:open="historyOpen"
    :title="selected ? `${selected.command} · 执行历史` : '执行历史'"
    size="4xl"
  >
    <div class="space-y-5 p-5">
      <div v-if="selected" class="rounded-lg bg-slate-50 p-4 text-sm">
        <p class="font-mono font-semibold">{{ selected.command }}</p>
        <p class="mt-2 break-all text-xs text-slate-500">
          Key：{{ selected.key }}
        </p>
      </div>

      <p
        v-if="selected && !selected.history_available"
        class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
      >
        该任务的执行历史当前不可用。
      </p>

      <template v-else>
        <form
          class="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2 xl:grid-cols-5"
          @submit.prevent="loadHistory(1)"
        >
          <label class="text-xs font-medium text-slate-500">
            状态
            <select v-model="historyFilters.status" class="admin-input mt-2">
              <option value="">全部</option>
              <option value="running">执行中</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
              <option value="skipped">已跳过</option>
              <option value="suspected_interrupted">疑似中断</option>
            </select>
          </label>
          <label class="text-xs font-medium text-slate-500">
            开始时间
            <input
              v-model="historyFilters.from"
              type="datetime-local"
              class="admin-input mt-2"
            />
          </label>
          <label class="text-xs font-medium text-slate-500">
            结束时间
            <input
              v-model="historyFilters.to"
              type="datetime-local"
              class="admin-input mt-2"
            />
          </label>
          <label class="text-xs font-medium text-slate-500">
            每页
            <select
              v-model.number="historyFilters.per_page"
              class="admin-input mt-2"
            >
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </label>
          <div class="flex items-end gap-2">
            <button
              class="admin-button admin-primary"
              :disabled="historyLoading"
            >
              查询
            </button>
            <button
              type="button"
              class="admin-button"
              :disabled="historyLoading"
              @click="resetHistoryFilters(); loadHistory(1)"
            >
              重置
            </button>
          </div>
        </form>

        <AdminError :error="historyError" />
        <p v-if="historyLoading" class="text-sm text-slate-500">
          正在加载执行记录…
        </p>

        <div v-else class="space-y-3">
          <div
            v-for="item in history"
            :key="item.id"
            class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium">#{{ item.id }}</span>
                <AdminStatus :value="item.status" />
              </div>
              <p class="mt-2 text-xs text-slate-500">
                {{ formatDate(item.started_at) }} ·
                {{ formatDuration(item.duration_ms) }} · Exit Code
                {{ item.exit_code ?? '—' }}
              </p>
              <p
                v-if="item.error"
                class="mt-2 break-words text-xs text-red-700"
              >
                {{ item.error }}
              </p>
            </div>
            <button
              class="admin-button"
              :disabled="runLoadingId !== null"
              @click="loadRun(item.id)"
            >
              {{ runLoadingId === item.id ? '加载中…' : '查看详情' }}
            </button>
          </div>
          <p
            v-if="!history.length"
            class="py-6 text-center text-sm text-slate-400"
          >
            暂无符合条件的执行记录。
          </p>
        </div>

        <div
          class="flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <span class="text-slate-500">
            第 {{ historyMeta.page }} / {{ historyMeta.lastPage }} 页 · 共
            {{ historyMeta.total }} 条
          </span>
          <div class="flex gap-2">
            <button
              class="admin-button"
              :disabled="historyMeta.page <= 1 || historyLoading"
              @click="loadHistory(historyMeta.page - 1)"
            >
              上一页
            </button>
            <button
              class="admin-button"
              :disabled="
                historyMeta.page >= historyMeta.lastPage || historyLoading
              "
              @click="loadHistory(historyMeta.page + 1)"
            >
              下一页
            </button>
          </div>
        </div>

        <AdminError :error="runError" />
        <section v-if="run" class="rounded-xl border border-slate-200 p-4">
          <div
            class="mb-3 flex flex-wrap items-center justify-between gap-2"
          >
            <h3 class="font-semibold">执行记录 #{{ run.id }}</h3>
            <AdminStatus :value="run.status" />
          </div>
          <AdminDataView :value="run" />
        </section>
      </template>
    </div>
  </Dialog>
</template>
