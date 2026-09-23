<script setup lang="ts">
import { CalendarClock, History, ChevronDown, ChevronLeft, ChevronRight } from 'lucide'
import {
  adminDate,
  adminDuration,
  adminLocalToUtc,
  type ScheduleRunDetail,
  type ScheduleRunStatus,
  type ScheduleRunSummary,
  type ScheduleSummary,
  type ScheduleTask,
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
        // Entered in local time; the API filters in UTC.
        from: historyFilters.from ? adminLocalToUtc(historyFilters.from) : undefined,
        to: historyFilters.to ? adminLocalToUtc(historyFilters.to) : undefined,
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

const formatDate = adminDate

// Share of successful runs in the retention window, for the health bar.
function successShare(task: ScheduleTask) {
  const { success, failed } = task.run_counts.last_30_days
  return success + failed ? (success / (success + failed)) * 100 : null
}

async function toggleRun(id: number) {
  if (run.value?.id === id) {
    run.value = null
    return
  }
  await loadRun(id)
}

const formatDuration = adminDuration

onMounted(refresh)
useAdminPoll(refresh)
</script>

<template>
  <AdminPageHeader
    :icon="CalendarClock"
    title="定时任务"
    description="来自 Laravel 当前实际注册的 Schedule，本页仅查看状态与执行记录。"
  >
    <AdminRefresh :busy="busy" live @click="refresh" />
  </AdminPageHeader>

  <AdminError :error="error" />

  <section v-if="data" class="admin-panel">
    <dl class="grid grid-cols-2 lg:grid-cols-4">
      <div class="border-b border-r border-slate-200 p-4 lg:border-b-0">
        <dt class="text-xs text-slate-500">调度器</dt>
        <dd class="mt-2"><AdminStatus :value="data.scheduler.status" /></dd>
      </div>
      <div class="border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
        <dt class="text-xs text-slate-500">最近心跳</dt>
        <dd class="mt-1.5 truncate text-[13px] font-medium text-slate-900 tabular-nums">
          {{
            data.scheduler.last_seen_at
              ? formatDate(data.scheduler.last_seen_at)
              : '尚未收到 schedule:run 心跳'
          }}
        </dd>
      </div>
      <div class="border-r border-slate-200 p-4">
        <dt class="text-xs text-slate-500">注册任务</dt>
        <dd class="mt-1 text-xl font-semibold text-slate-950 tabular-nums">
          {{ data.scheduler.task_count }}
        </dd>
      </div>
      <div class="p-4">
        <dt class="text-xs text-slate-500">执行历史</dt>
        <dd class="mt-2">
          <AdminStatus
            :value="data.scheduler.history_available ? 'online' : 'unavailable'"
          />
          <span class="ml-2 text-xs text-slate-400">保留 30 天</span>
        </dd>
      </div>
    </dl>
    <p
      v-if="!data.scheduler.history_available"
      class="border-t border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900"
    >
      历史表当前不可用；执行统计为 0，最近执行状态可能来自短期缓存。
    </p>
  </section>

  <section class="admin-panel overflow-hidden">
    <header class="admin-panel-head">
      <h2 class="admin-panel-title">
        已注册任务
        <span v-if="data" class="admin-count">{{ data.tasks.length }}</span>
      </h2>
      <span class="text-xs text-slate-400"
        >更新于 {{ formatDate(updated) }}</span
      >
    </header>
    <div
      class="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.3fr)_2rem] gap-6 border-b border-slate-200 bg-slate-50/70 px-4 py-2 text-xs font-medium text-slate-500 lg:grid"
    >
      <span>任务</span><span>最近执行</span><span>下次执行</span
      ><span>30 天成功率</span><span />
    </div>
    <div v-if="busy && !data" class="space-y-px">
      <div v-for="i in 3" :key="i" class="h-20 animate-pulse bg-slate-50" />
    </div>
    <ul v-if="data" class="divide-y divide-slate-200">
      <li
        v-for="task in data.tasks"
        :key="task.key"
        class="grid gap-x-6 gap-y-3 px-4 py-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.3fr)_2rem] lg:items-center"
      >
        <div class="min-w-0">
          <p class="break-all font-mono text-[13px] font-semibold text-slate-950">
            {{ task.command }}
          </p>
          <p v-if="task.description" class="mt-0.5 text-xs text-slate-500">
            {{ task.description }}
          </p>
          <p class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span class="admin-kbd">{{ task.expression }}</span>
            {{ task.frequency }} · {{ task.timezone }}
          </p>
        </div>
        <div class="min-w-0 text-xs">
          <template v-if="task.last_run">
            <div class="flex flex-wrap items-center gap-2">
              <AdminStatus :value="task.last_run.status" />
              <span v-if="task.running" class="text-amber-700"
                >· {{ task.running }} 个运行中</span
              >
            </div>
            <p class="mt-1 text-slate-500 tabular-nums">
              {{ formatDate(task.last_run.started_at) }} ·
              {{ formatDuration(task.last_run.duration_ms) }}
            </p>
          </template>
          <span v-else class="text-slate-400">从未执行</span>
        </div>
        <div class="text-xs tabular-nums text-slate-700">
          <span class="text-slate-400 lg:hidden">下次执行 · </span
          >{{ formatDate(task.next_run_at) }}
        </div>
        <div class="text-xs tabular-nums">
          <div class="flex items-baseline justify-between gap-2">
            <span class="text-[13px] font-semibold text-slate-950">{{
              successShare(task) === null
                ? '—'
                : successShare(task)!.toFixed(1) + '%'
            }}</span>
            <span class="text-slate-500"
              >24h {{ (task.run_counts.last_24_hours.success + task.run_counts.last_24_hours.failed).toLocaleString() }} 次<template
                v-if="task.run_counts.last_24_hours.failed"
                >，<span class="font-medium text-red-700"
                  >失败 {{ task.run_counts.last_24_hours.failed }}</span
                ></template
              ></span
            >
          </div>
          <div
            class="mt-1.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-slate-100"
            :title="`30 天：成功 ${task.run_counts.last_30_days.success} · 失败 ${task.run_counts.last_30_days.failed} · 跳过 ${task.skipped}`"
          >
            <div
              v-if="successShare(task) !== null"
              class="h-full rounded-l-full bg-emerald-500"
              :style="{ width: successShare(task) + '%' }"
            />
            <div
              v-if="task.run_counts.last_30_days.failed"
              class="h-full min-w-1 flex-1 rounded-r-full bg-red-500"
            />
          </div>
        </div>
        <button
          class="admin-button w-8 px-0 max-lg:w-auto max-lg:px-2.5 lg:justify-self-end"
          :disabled="!task.history_available"
          :title="task.history_available ? '执行历史' : '历史不可用'"
          :aria-label="task.history_available ? '执行历史' : '历史不可用'"
          @click="showHistory(task)"
        >
          <LucideIcon :icon="History" class="size-4" /><span class="lg:hidden"
            >执行历史</span
          >
        </button>
        <p
          v-if="task.last_run?.error"
          class="break-words rounded-md border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs leading-5 text-red-700 lg:col-span-5"
        >
          {{ task.last_run.error }}
        </p>
      </li>
      <li
        v-if="!data.tasks.length"
        class="px-4 py-16 text-center text-[13px] text-slate-400"
      >
        当前没有注册的定时任务。
      </li>
    </ul>
  </section>

  <Drawer v-model:open="historyOpen" side="right" size="wide">
    <template #title>
      执行历史
      <span v-if="selected" class="ml-1 font-mono text-xs font-normal text-slate-400">{{
        selected.command
      }}</span>
    </template>
    <div v-if="selected" class="flex min-h-full flex-col">
      <p
        v-if="!selected.history_available"
        class="m-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900"
      >
        该任务的执行历史当前不可用。
      </p>
      <template v-else>
        <form
          class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-5 py-2.5"
          @submit.prevent="loadHistory(1)"
        >
          <select v-model="historyFilters.status" class="admin-input w-auto" aria-label="状态">
            <option value="">状态：全部</option>
            <option value="running">执行中</option>
            <option value="success">成功</option>
            <option value="failed">失败</option>
            <option value="skipped">已跳过</option>
            <option value="suspected_interrupted">疑似中断</option>
          </select>
          <label
            class="flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white pl-2.5 text-[13px]"
            ><span class="text-xs text-slate-400">开始</span
            ><input
              v-model="historyFilters.from"
              type="datetime-local"
              class="h-full bg-transparent pr-2 outline-none"
          /></label>
          <label
            class="flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white pl-2.5 text-[13px]"
            ><span class="text-xs text-slate-400">结束</span
            ><input
              v-model="historyFilters.to"
              type="datetime-local"
              class="h-full bg-transparent pr-2 outline-none"
          /></label>
          <select
            v-model.number="historyFilters.per_page"
            class="admin-input w-auto"
            aria-label="每页条数"
          >
            <option :value="20">20 条/页</option>
            <option :value="50">50 条/页</option>
            <option :value="100">100 条/页</option>
          </select>
          <button class="admin-button admin-primary" :disabled="historyLoading">
            筛选
          </button>
          <button
            type="button"
            class="admin-button border-transparent bg-transparent text-slate-500"
            :disabled="historyLoading"
            @click="resetHistoryFilters(); loadHistory(1)"
          >
            重置
          </button>
        </form>

        <div class="flex-1 p-5">
          <AdminError :error="historyError" />
          <div
            v-if="historyLoading"
            class="h-0.5 overflow-hidden rounded-full bg-slate-100"
          >
            <div class="animate-admin-progress h-full w-1/3 bg-slate-900" />
          </div>
          <ol v-else class="divide-y divide-slate-200 rounded-lg border border-slate-200">
            <li v-for="item in history" :key="item.id">
              <button
                class="flex w-full items-center gap-4 px-3 py-2.5 text-left transition hover:bg-slate-50"
                :aria-expanded="run?.id === item.id"
                :disabled="runLoadingId !== null"
                @click="toggleRun(item.id)"
              >
                <span class="w-14 font-mono text-xs text-slate-400">#{{ item.id }}</span>
                <span class="w-20"><AdminStatus :value="item.status" /></span>
                <span class="flex-1 truncate text-xs text-slate-600 tabular-nums">
                  {{ formatDate(item.started_at) }}
                </span>
                <span class="hidden text-xs text-slate-500 tabular-nums sm:inline">
                  {{ formatDuration(item.duration_ms) }}
                </span>
                <span class="hidden w-12 text-right font-mono text-xs text-slate-400 sm:inline"
                  >exit {{ item.exit_code ?? '—' }}</span
                >
                <LucideIcon
                  :icon="ChevronDown"
                  class="size-4 text-slate-400 transition"
                  :class="[
                    run?.id === item.id ? 'rotate-180' : '',
                    runLoadingId === item.id ? 'animate-pulse' : '',
                  ]"
                />
              </button>
              <p
                v-if="item.error && run?.id !== item.id"
                class="truncate px-3 pb-2.5 pl-[5.5rem] font-mono text-xs text-red-700"
              >
                {{ item.error }}
              </p>
              <div
                v-if="run?.id === item.id"
                class="border-t border-dashed border-slate-200 bg-slate-50/60 px-4 py-2"
              >
                <AdminDataView :value="run" />
              </div>
            </li>
            <li
              v-if="!history.length"
              class="py-12 text-center text-[13px] text-slate-400"
            >
              暂无符合条件的执行记录。
            </li>
          </ol>
          <div class="mt-3"><AdminError :error="runError" /></div>
        </div>

        <footer
          class="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-2.5 text-xs text-slate-500"
        >
          <span class="tabular-nums"
            >共 {{ historyMeta.total.toLocaleString() }} 条 · 第
            {{ historyMeta.page }} / {{ historyMeta.lastPage }} 页</span
          >
          <div class="flex gap-1">
            <button
              class="admin-button size-7 px-0"
              aria-label="上一页"
              :disabled="historyMeta.page <= 1 || historyLoading"
              @click="loadHistory(historyMeta.page - 1)"
            >
              <LucideIcon :icon="ChevronLeft" class="size-4" />
            </button>
            <button
              class="admin-button size-7 px-0"
              aria-label="下一页"
              :disabled="historyMeta.page >= historyMeta.lastPage || historyLoading"
              @click="loadHistory(historyMeta.page + 1)"
            >
              <LucideIcon :icon="ChevronRight" class="size-4" />
            </button>
          </div>
        </footer>
      </template>
    </div>
  </Drawer>
</template>
