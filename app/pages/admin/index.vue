<script setup lang="ts">
import type { QueueSummary, ScheduleSummary } from '~/utils/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi()
const data = ref<{
  queue_results: { status: string; count: number }[]
  queues: QueueSummary
  scheduler: ScheduleSummary['scheduler']
  recent_failures: any[]
  updated_at: string
} | null>(null)
const error = ref<any>(null),
  busy = ref(false)
async function refresh() {
  if (busy.value) return
  busy.value = true
  try {
    data.value = await api.get('/overview')
    error.value = null
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
onMounted(refresh)
useAdminPoll(refresh)
</script>
<template>
  <div class="flex items-start justify-between">
    <div>
      <p
        class="text-xs font-semibold uppercase tracking-widest text-indigo-600"
      >
        PSRay Administration
      </p>
      <h1 class="mt-2 text-3xl font-bold tracking-tight">运行总览</h1>
      <p class="mt-2 text-sm text-slate-500">
        站点数据与运行状况 · 每 15 秒刷新
      </p>
    </div>
    <button class="admin-button" :disabled="busy" @click="refresh">刷新</button>
  </div>
  <AdminError :error="error" />
  <p v-if="busy && !data" class="admin-card text-slate-500">正在加载…</p>
  <template v-if="data"
    ><div class="grid gap-5 xl:grid-cols-2">
      <section class="admin-card">
        <div class="flex justify-between">
          <h2 class="font-semibold">队列运行</h2>
          <AdminStatus
            :value="
              data.queues.available ? data.queues.worker_status : 'unavailable'
            "
          />
        </div>
        <p v-if="!data.queues.available" class="mt-4 text-sm text-slate-500">
          {{ data.queues.message }}
        </p>
        <div
          v-for="queue in data.queues.queues"
          :key="queue.name"
          class="mt-4 flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-3 text-sm"
        >
          <span class="font-mono">{{ queue.name }}</span
          ><span class="text-slate-500"
            >等待 {{ queue.waiting }} · 延迟 {{ queue.delayed }} · 已保留
            {{ queue.reserved }}</span
          >
        </div>
        <NuxtLink
          to="/admin/queues"
          class="mt-4 inline-block text-sm text-indigo-600"
          >查看队列 →</NuxtLink
        >
      </section>
      <section class="admin-card">
        <div class="flex justify-between">
          <h2 class="font-semibold">调度器</h2>
          <AdminStatus :value="data.scheduler.status" />
        </div>
        <p class="mt-4 text-sm text-slate-500">
          最近心跳：{{ data.scheduler.last_seen_at || '暂无记录' }}
        </p>
        <h3 class="mt-8 text-sm font-semibold">最近 24 小时队列结果</h3>
        <div class="mt-4 flex flex-wrap gap-3">
          <div
            v-for="item in data.queue_results"
            :key="item.status"
            class="rounded-lg bg-slate-50 p-3"
          >
            <AdminStatus :value="item.status" />
            <p class="mt-3 text-2xl font-semibold">{{ item.count }}</p>
          </div>
          <p v-if="!data.queue_results.length" class="text-sm text-slate-400">
            暂无执行记录
          </p>
        </div>
        <NuxtLink
          to="/admin/schedules"
          class="mt-6 inline-block text-sm text-indigo-600"
          >查看定时任务 →</NuxtLink
        >
      </section>
    </div>
    <section class="admin-card">
      <div class="flex justify-between">
        <h2 class="font-semibold">最近同步异常</h2>
        <NuxtLink to="/admin/sync-failures" class="text-sm text-indigo-600"
          >全部异常 →</NuxtLink
        >
      </div>
      <p
        v-if="!data.recent_failures.length"
        class="py-8 text-center text-sm text-slate-400"
      >
        暂无异常记录
      </p>
      <div
        v-for="failure in data.recent_failures"
        :key="failure.id"
        class="mt-4 border-t border-slate-100 pt-4"
      >
        <p class="text-sm font-medium">
          {{ failure.psnid || failure.np_communication_id }}
          <span class="font-normal text-slate-400"
            >· {{ failure.stage }} · {{ failure.created_at }}</span
          >
        </p>
        <p class="mt-1 line-clamp-2 break-words text-sm text-slate-500">
          {{ failure.error_message }}
        </p>
      </div>
    </section>
    <p class="text-xs text-slate-400">
      最后更新 {{ data.updated_at }} · 所有时间使用 UTC
    </p></template
  >
</template>
