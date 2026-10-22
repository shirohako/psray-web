<script setup lang="ts">
import { CalendarClock } from 'lucide'
import { adminDate } from '~/utils/admin'
import type { ScheduleSummary, ScheduleTask } from '~/types/admin'

definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })

const api = useAdminApi()
const data = ref<ScheduleSummary | null>(null)
const error = ref<any>(null)
const busy = ref(false)
const updated = ref('')

// The task whose run history the drawer shows.
const historyTask = ref<ScheduleTask | null>(null)
const historyOpen = ref(false)

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

function showHistory(task: ScheduleTask) {
  historyTask.value = task
  historyOpen.value = true
}

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
              ? adminDate(data.scheduler.last_seen_at)
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
        >更新于 {{ adminDate(updated) }}</span
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
      <AdminScheduleTaskRow
        v-for="task in data.tasks"
        :key="task.key"
        :task="task"
        @history="showHistory(task)"
      />
      <li
        v-if="!data.tasks.length"
        class="px-4 py-16 text-center text-[13px] text-slate-400"
      >
        当前没有注册的定时任务。
      </li>
    </ul>
  </section>

  <AdminScheduleHistoryDrawer v-model:open="historyOpen" :task="historyTask" />
</template>
