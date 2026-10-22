<script setup lang="ts">
import { ArrowUpRight, Layers } from 'lucide'
import type { QueueSummary } from '~/types/admin'
const props = defineProps<{ summary: QueueSummary }>()

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
    ...props.summary.queues.map((q) => q.waiting + q.delayed + q.reserved),
  ),
)
</script>
<template>
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
      v-if="!summary.available"
      class="px-4 py-16 text-center text-[13px] text-slate-400"
    >
      {{ summary.message || '暂时无法读取队列状态' }}
    </p>
    <ul v-else class="space-y-4 p-4 sm:p-5">
      <li
        v-for="queue in summary.queues"
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
</template>
