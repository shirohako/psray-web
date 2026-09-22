<script setup lang="ts">
import type { ScheduleSummary, ScheduleTask } from '~/utils/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi()
const data = ref<ScheduleSummary | null>(null),
  error = ref<any>(null),
  busy = ref(false),
  selected = ref<ScheduleTask | null>(null),
  history = ref<any[]>([]),
  historyError = ref<any>(null),
  page = ref(1),
  lastPage = ref(1),
  run = ref<any>(null),
  open = ref(false),
  updated = ref('')
async function refresh() {
  if (busy.value) return
  busy.value = true
  try {
    data.value = await api.get('/schedules')
    error.value = null
    updated.value = new Date().toISOString()
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
async function show(task: ScheduleTask, target = 1) {
  selected.value = task
  page.value = target
  open.value = true
  run.value = null
  historyError.value = null
  history.value = []
  if (!task.history_enabled) return
  try {
    const result = await api.list(`/schedules/${task.key}/runs`, {
      page: target,
    })
    history.value = result.data
    lastPage.value = Number(result.meta?.last_page || 1)
  } catch (e) {
    historyError.value = e
  }
}
onMounted(refresh)
useAdminPoll(refresh)
</script>
<template>
  <div class="flex items-start justify-between">
    <div>
      <h1 class="text-2xl font-bold">定时任务</h1>
      <p class="mt-2 text-sm text-slate-500">
        频率来自实际 Laravel 调度配置。这里只查看状态，不执行或修改任务。
      </p>
    </div>
    <button class="admin-button" :disabled="busy" @click="refresh">刷新</button>
  </div>
  <AdminError :error="error" />
  <div
    v-if="data"
    class="admin-card flex flex-wrap items-center justify-between gap-3"
  >
    <div>
      <h2 class="font-semibold">调度器心跳</h2>
      <p class="mt-2 text-sm text-slate-500">
        最近唤醒：{{ data.scheduler.last_seen_at || '暂无记录' }} · 超过 3
        分钟未更新会提示异常
      </p>
    </div>
    <AdminStatus :value="data.scheduler.status" />
  </div>
  <div class="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table class="w-full text-left text-sm">
      <thead class="bg-slate-50 text-xs text-slate-500">
        <tr>
          <th class="p-4">任务</th>
          <th class="p-4">频率 / 时区</th>
          <th class="p-4">下次计划执行</th>
          <th class="p-4">最近结果</th>
          <th class="p-4">操作</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-for="task in data?.tasks" :key="task.key">
          <td class="p-4 font-mono text-xs">{{ task.command }}</td>
          <td class="p-4">
            <p>{{ task.expression }}</p>
            <p class="mt-1 text-xs text-slate-400">{{ task.timezone }}</p>
          </td>
          <td class="p-4 text-xs">{{ task.next_run_at }}</td>
          <td class="p-4">
            <AdminStatus :value="task.last_run?.status || 'unknown'" />
          </td>
          <td class="p-4">
            <button class="text-indigo-600" @click="show(task)">
              执行记录
            </button>
          </td>
        </tr>
        <tr v-if="!data">
          <td colspan="5" class="p-10 text-center text-slate-400">
            {{ busy ? '正在加载…' : '暂无数据' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="text-xs text-slate-400">
    最后更新 {{ updated || '—' }} · 历史记录保留 30 天
  </p>
  <Dialog v-model:open="open" title="任务执行记录" size="4xl"
    ><div class="space-y-4 p-5">
      <AdminError :error="historyError" /><AdminDataView :value="selected" />
      <p
        v-if="!selected?.history_enabled"
        class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
      >
        此任务每分钟执行，仅保留最近轻量状态，不写逐次历史。
      </p>
      <template v-else
        ><div
          v-for="item in history"
          :key="item.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm"
        >
          <span>{{ item.started_at }} · {{ item.duration_ms ?? '—' }} ms</span
          ><AdminStatus :value="item.status" /><button
            class="text-indigo-600"
            @click="run = item"
          >
            错误与详情
          </button>
        </div>
        <p v-if="!history.length" class="text-sm text-slate-400">
          暂无执行记录
        </p>
        <div class="flex gap-3">
          <button
            class="admin-button"
            :disabled="page <= 1"
            @click="selected && show(selected, page - 1)"
          >
            上一页</button
          ><button
            class="admin-button"
            :disabled="page >= lastPage"
            @click="selected && show(selected, page + 1)"
          >
            下一页
          </button>
        </div>
        <AdminDataView v-if="run" :value="run"
      /></template></div
  ></Dialog>
</template>
