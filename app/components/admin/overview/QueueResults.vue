<script setup lang="ts">
import { ArrowUpRight, CalendarClock } from 'lucide'
import { adminValue } from '~/utils/admin'
import type { AdminOverview } from '~/types/admin'
/** The last 24 hours of queue jobs by outcome: a donut and its legend. */
const props = defineProps<{ counts: AdminOverview['queue_results'] }>()

const resultOrder = ['success', 'partial', 'failed']
const resultColor: Record<string, { bar: string; stroke: string }> = {
  success: { bar: 'bg-emerald-500', stroke: 'stroke-emerald-500' },
  partial: { bar: 'bg-amber-400', stroke: 'stroke-amber-400' },
  failed: { bar: 'bg-red-500', stroke: 'stroke-red-500' },
}
const fallbackColor = { bar: 'bg-slate-400', stroke: 'stroke-slate-400' }
const total = computed(() => props.counts.reduce((a, r) => a + r.count, 0))
const results = computed(() =>
  [...props.counts]
    .filter((r) => r.count > 0)
    .sort(
      (a, b) =>
        (resultOrder.indexOf(a.status) + 1 || 99) -
        (resultOrder.indexOf(b.status) + 1 || 99),
    ),
)
function percent(count: number) {
  return total.value ? (count / total.value) * 100 : 0
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
            >{{ total.toLocaleString() }}</span
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
</template>
