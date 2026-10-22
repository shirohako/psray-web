<script setup lang="ts">
import { CircleCheck, CircleAlert, TriangleAlert, RefreshCw } from 'lucide'
import { adminDate, adminValue } from '~/utils/admin'
import type { AdminOverview } from '~/types/admin'
/**
 * Top of the overview: a verdict from the health checks (worker, scheduler,
 * sync failures) and a KPI strip of queued work, the last 24 hours of jobs
 * and the scheduled tasks.
 */
const props = defineProps<{ data: AdminOverview; busy: boolean }>()
defineEmits<{ refresh: [] }>()

const sum = (list: number[]) => list.reduce((a, b) => a + b, 0)
const totals = computed(() => {
  const queues = props.data.queues.queues
  const results = props.data.queue_results
  const count = (status: string) =>
    results.find((r) => r.status === status)?.count ?? 0
  const runs = sum(results.map((r) => r.count))
  return {
    waiting: sum(queues.map((q) => q.waiting)),
    delayed: sum(queues.map((q) => q.delayed)),
    reserved: sum(queues.map((q) => q.reserved)),
    runs,
    failed: count('failed'),
    successRate: runs ? Math.round((count('success') / runs) * 1000) / 10 : null,
  }
})

type Check = { key: string; label: string; ok: boolean; detail: string }
const checks = computed<Check[]>(() => {
  const { queues, scheduler, recent_failures } = props.data
  const workerOk =
    queues.available &&
    ['running', 'online', 'active'].includes(queues.worker_status)
  return [
    {
      key: 'worker',
      label: '队列 Worker',
      ok: workerOk,
      detail: queues.available
        ? adminValue(queues.worker_status)
        : queues.message || '不可用',
    },
    {
      key: 'scheduler',
      label: '调度器',
      ok: scheduler.status === 'healthy',
      detail: adminValue(scheduler.status),
    },
    {
      key: 'failures',
      label: '同步异常',
      ok: !recent_failures.length,
      detail: recent_failures.length
        ? `最近 ${recent_failures.length} 条`
        : '无',
    },
  ]
})
const issues = computed(() => checks.value.filter((c) => !c.ok).length)
</script>
<template>
  <section
    class="relative overflow-hidden rounded-2xl bg-slate-950 text-white"
  >
    <div
      class="pointer-events-none absolute inset-0"
      :class="
        issues
          ? 'bg-[radial-gradient(55%_90%_at_100%_0%,rgb(245_158_11/0.18),transparent)]'
          : 'bg-[radial-gradient(55%_90%_at_100%_0%,rgb(16_185_129/0.18),transparent)]'
      "
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-size-[32px_32px] mask-[linear-gradient(to_bottom,black,transparent)]"
    />
    <div class="relative p-6 sm:p-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-medium tracking-wider text-slate-400">
            系统状态 · {{ adminDate(data.updated_at) }}
          </p>
          <h1
            class="mt-3 flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            <LucideIcon
              :icon="issues ? TriangleAlert : CircleCheck"
              class="size-7 shrink-0"
              :class="issues ? 'text-amber-400' : 'text-emerald-400'"
            />
            {{ issues ? `${issues} 项需要关注` : '所有系统运行正常' }}
          </h1>
        </div>
        <button
          class="inline-flex h-8 items-center gap-2 rounded-md bg-white/10 px-3 text-[13px] font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15 disabled:opacity-60"
          :disabled="busy"
          title="页面可见时每 15 秒自动刷新，点击立即刷新"
          @click="$emit('refresh')"
        >
          <span class="relative flex size-2">
            <span
              class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden"
            />
            <span
              class="relative inline-flex size-2 rounded-full bg-emerald-400"
            />
          </span>
          实时
          <LucideIcon
            :icon="RefreshCw"
            class="size-3.5 text-slate-400"
            :class="busy ? 'animate-spin' : ''"
          />
        </button>
      </div>
      <ul class="mt-6 flex flex-wrap gap-2">
        <li
          v-for="check in checks"
          :key="check.key"
          class="inline-flex items-center gap-2 rounded-full py-1 pl-1.5 pr-3 text-[13px] ring-1"
          :class="
            check.ok
              ? 'bg-white/5 ring-white/10'
              : 'bg-amber-400/10 ring-amber-400/30'
          "
        >
          <LucideIcon
            :icon="check.ok ? CircleCheck : CircleAlert"
            class="size-4"
            :class="check.ok ? 'text-emerald-400' : 'text-amber-400'"
          />
          <span class="text-slate-300">{{ check.label }}</span>
          <span class="font-medium text-white">{{ check.detail }}</span>
        </li>
      </ul>
    </div>
    <dl
      class="relative grid grid-cols-2 border-t border-white/10 lg:grid-cols-4"
    >
      <div class="border-r border-white/10 p-5 sm:px-8">
        <dt class="text-xs text-slate-400">等待中的任务</dt>
        <dd class="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">
          {{ totals.waiting.toLocaleString() }}
        </dd>
        <dd class="mt-0.5 text-xs text-slate-500 tabular-nums">
          延迟 {{ totals.delayed.toLocaleString() }} · 已保留
          {{ totals.reserved.toLocaleString() }}
        </dd>
      </div>
      <div class="p-5 sm:px-8 lg:border-r lg:border-white/10">
        <dt class="text-xs text-slate-400">24 小时执行</dt>
        <dd class="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">
          {{ totals.runs.toLocaleString() }}
        </dd>
        <dd class="mt-0.5 text-xs text-slate-500 tabular-nums">
          失败 {{ totals.failed.toLocaleString() }}
        </dd>
      </div>
      <div
        class="border-r border-t border-white/10 p-5 sm:px-8 lg:border-t-0"
      >
        <dt class="text-xs text-slate-400">成功率</dt>
        <dd class="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">
          {{ totals.successRate === null ? '—' : totals.successRate
          }}<span
            v-if="totals.successRate !== null"
            class="text-lg text-slate-400"
            >%</span
          >
        </dd>
        <dd class="mt-0.5 text-xs text-slate-500">最近 24 小时</dd>
      </div>
      <div class="border-t border-white/10 p-5 sm:px-8 lg:border-t-0">
        <dt class="text-xs text-slate-400">定时任务</dt>
        <dd class="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">
          {{ data.scheduler.task_count }}
        </dd>
        <dd class="mt-0.5 truncate text-xs text-slate-500">
          心跳
          {{
            data.scheduler.last_seen_at
              ? adminDate(data.scheduler.last_seen_at)
              : '暂无记录'
          }}
        </dd>
      </div>
    </dl>
  </section>
</template>
