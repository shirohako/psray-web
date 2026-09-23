<script setup lang="ts">
import {
  ArrowUpRight,
  CircleCheck,
  CircleAlert,
  TriangleAlert,
  Layers,
  CalendarClock,
  RefreshCw,
} from 'lucide'
import {
  adminDate,
  adminValue,
  type QueueSummary,
  type ScheduleSummary,
} from '~/utils/admin'
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

const sum = (list: number[]) => list.reduce((a, b) => a + b, 0)
const totals = computed(() => {
  const queues = data.value?.queues.queues ?? []
  const results = data.value?.queue_results ?? []
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
  if (!data.value) return []
  const { queues, scheduler, recent_failures } = data.value
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

// Queue load: one stacked bar per queue on a shared scale. One hue, three
// steps, darkest = most urgent (waiting).
const segments = [
  { key: 'waiting', label: '等待', color: 'bg-slate-900' },
  { key: 'delayed', label: '延迟', color: 'bg-slate-400' },
  { key: 'reserved', label: '已保留', color: 'bg-slate-200' },
] as const
const queueScale = computed(() =>
  Math.max(
    1,
    ...(data.value?.queues.queues ?? []).map(
      (q) => q.waiting + q.delayed + q.reserved,
    ),
  ),
)

const resultOrder = ['success', 'partial', 'failed']
const resultColor: Record<string, { bar: string; stroke: string }> = {
  success: { bar: 'bg-emerald-500', stroke: 'stroke-emerald-500' },
  partial: { bar: 'bg-amber-400', stroke: 'stroke-amber-400' },
  failed: { bar: 'bg-red-500', stroke: 'stroke-red-500' },
}
const fallbackColor = { bar: 'bg-slate-400', stroke: 'stroke-slate-400' }
const results = computed(() =>
  [...(data.value?.queue_results ?? [])]
    .filter((r) => r.count > 0)
    .sort(
      (a, b) =>
        (resultOrder.indexOf(a.status) + 1 || 99) -
        (resultOrder.indexOf(b.status) + 1 || 99),
    ),
)
function percent(count: number) {
  return totals.value.runs ? (count / totals.value.runs) * 100 : 0
}
// Donut arcs on a circumference of 100 starting at 12 o'clock, with a small
// surface gap between segments.
const arcs = computed(() => {
  const gap = results.value.length > 1 ? 0.8 : 0
  let offset = 0
  return results.value.map((item) => {
    const length = percent(item.count)
    const visible = Math.max(length - gap, 0.4)
    const arc = {
      ...item,
      dash: `${visible} ${100 - visible}`,
      offset: 25 - offset,
    }
    offset += length
    return arc
  })
})
</script>
<template>
  <AdminError :error="error" />

  <div
    v-if="busy && !data"
    class="h-72 animate-pulse rounded-2xl bg-slate-100"
    aria-label="正在加载"
  />

  <template v-if="data">
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
            @click="refresh"
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

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <section class="admin-panel">
        <header class="admin-panel-head">
          <h2 class="admin-panel-title">
            <LucideIcon :icon="Layers" class="size-4 text-slate-400" />队列负载
          </h2>
          <div class="flex items-center gap-4">
            <ul
              class="hidden items-center gap-3 text-xs text-slate-500 sm:flex"
            >
              <li
                v-for="segment in segments"
                :key="segment.key"
                class="flex items-center gap-1.5"
              >
                <span class="size-2 rounded-sm" :class="segment.color" />{{
                  segment.label
                }}
              </li>
            </ul>
            <NuxtLink to="/admin/queues" class="admin-link"
              >详情<LucideIcon :icon="ArrowUpRight" class="size-3.5"
            /></NuxtLink>
          </div>
        </header>
        <p
          v-if="!data.queues.available"
          class="px-4 py-16 text-center text-[13px] text-slate-400"
        >
          {{ data.queues.message || '暂时无法读取队列状态' }}
        </p>
        <ul v-else class="space-y-4 p-4 sm:p-5">
          <li
            v-for="queue in data.queues.queues"
            :key="queue.name"
            class="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_4rem] items-center gap-4"
            :title="`${queue.name}：等待 ${queue.waiting} · 延迟 ${queue.delayed} · 已保留 ${queue.reserved}`"
          >
            <span class="truncate font-mono text-xs text-slate-600">{{
              queue.name
            }}</span>
            <div class="flex h-5 items-center rounded bg-slate-50">
              <div
                class="flex h-full gap-0.5"
                :style="{
                  width:
                    ((queue.waiting + queue.delayed + queue.reserved) /
                      queueScale) *
                      100 +
                    '%',
                }"
              >
                <template v-for="segment in segments" :key="segment.key">
                  <div
                    v-if="queue[segment.key]"
                    class="h-full min-w-1 first:rounded-l last:rounded-r"
                    :class="segment.color"
                    :style="{ flexGrow: queue[segment.key] }"
                  />
                </template>
              </div>
            </div>
            <span
              class="text-right text-[13px] font-semibold text-slate-900 tabular-nums"
              >{{ queue.waiting.toLocaleString() }}</span
            >
          </li>
        </ul>
      </section>

      <section class="admin-panel">
        <header class="admin-panel-head">
          <h2 class="admin-panel-title">
            <LucideIcon
              :icon="CalendarClock"
              class="size-4 text-slate-400"
            />24 小时队列结果
          </h2>
          <NuxtLink
            :to="{ path: '/admin/queues', query: { tab: 'history' } }"
            class="admin-link"
            >历史<LucideIcon :icon="ArrowUpRight" class="size-3.5"
          /></NuxtLink>
        </header>
        <div
          v-if="results.length"
          class="flex flex-col items-center gap-6 p-5 sm:flex-row lg:flex-col xl:flex-row"
        >
          <div class="relative size-40 shrink-0">
            <svg
              viewBox="0 0 42 42"
              class="size-full"
              role="img"
              :aria-label="
                results
                  .map((r) => `${adminValue(r.status)} ${r.count}`)
                  .join('，')
              "
            >
              <circle
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                class="stroke-slate-100"
                stroke-width="4.5"
              />
              <circle
                v-for="arc in arcs"
                :key="arc.status"
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke-width="4.5"
                :class="(resultColor[arc.status] || fallbackColor).stroke"
                :stroke-dasharray="arc.dash"
                :stroke-dashoffset="arc.offset"
              >
                <title>
                  {{ adminValue(arc.status) }}：{{ arc.count }}（{{
                    percent(arc.count).toFixed(1)
                  }}%）
                </title>
              </circle>
            </svg>
            <div
              class="absolute inset-0 flex flex-col items-center justify-center"
            >
              <span
                class="text-xl font-semibold text-slate-900 tabular-nums"
                >{{ totals.runs.toLocaleString() }}</span
              >
              <span class="text-[11px] text-slate-400">次执行</span>
            </div>
          </div>
          <ul class="w-full space-y-3 text-[13px]">
            <li
              v-for="item in results"
              :key="item.status"
              class="flex items-center gap-2.5"
            >
              <span
                class="size-2.5 rounded-sm"
                :class="(resultColor[item.status] || fallbackColor).bar"
              />
              <span class="text-slate-600">{{ adminValue(item.status) }}</span>
              <span
                class="ml-auto font-semibold text-slate-900 tabular-nums"
                >{{ item.count.toLocaleString() }}</span
              >
              <span
                class="w-12 text-right text-xs text-slate-400 tabular-nums"
                >{{ percent(item.count).toFixed(1) }}%</span
              >
            </li>
          </ul>
        </div>
        <p v-else class="px-4 py-16 text-center text-[13px] text-slate-400">
          最近 24 小时没有执行记录
        </p>
      </section>
    </div>

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h2 class="admin-panel-title">
          <LucideIcon
            :icon="TriangleAlert"
            class="size-4 text-slate-400"
          />最近同步异常
          <span v-if="data.recent_failures.length" class="admin-count">{{
            data.recent_failures.length
          }}</span>
        </h2>
        <NuxtLink to="/admin/sync-failures" class="admin-link"
          >全部异常<LucideIcon :icon="ArrowUpRight" class="size-3.5"
        /></NuxtLink>
      </header>
      <div
        v-if="!data.recent_failures.length"
        class="flex items-center justify-center gap-2 py-14 text-[13px] text-slate-500"
      >
        <LucideIcon :icon="CircleCheck" class="size-4 text-emerald-500" />
        没有新的同步异常
      </div>
      <ol v-else class="p-4 sm:p-5">
        <li
          v-for="failure in data.recent_failures"
          :key="failure.id"
          class="group grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-5 sm:grid-cols-[6rem_minmax(0,1fr)]"
        >
          <span
            class="pt-0.5 text-right font-mono text-[11px] leading-5 text-slate-400"
            >{{ adminDate(failure.created_at).slice(5, 16) }}</span
          >
          <div
            class="relative min-w-0 border-l border-slate-200 pb-5 pl-5 group-last:border-transparent group-last:pb-0"
          >
            <span
              class="absolute -left-1.25 top-1.5 size-2.25 rounded-full border-2 border-white bg-red-500 ring-1 ring-red-200"
            />
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[13px] font-semibold text-slate-900">{{
                failure.psnid || failure.np_communication_id
              }}</span>
              <span class="admin-kbd">{{ failure.stage }}</span>
            </div>
            <p
              class="mt-1 line-clamp-2 break-words font-mono text-xs leading-5 text-slate-500"
            >
              {{ failure.error_message }}
            </p>
          </div>
        </li>
      </ol>
    </section>
  </template>
</template>
