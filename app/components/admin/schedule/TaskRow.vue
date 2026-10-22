<script setup lang="ts">
import { History } from 'lucide'
import { adminDate, adminDuration } from '~/utils/admin'
import type { ScheduleTask } from '~/types/admin'
/**
 * One registered task in the schedules list: what and when it runs, its last
 * run, and its 30-day success rate. `history` asks for its run history.
 */
const props = defineProps<{ task: ScheduleTask }>()
defineEmits<{ history: [] }>()

// Share of successful runs in the retention window, for the health bar.
const successShare = computed(() => {
  const { success, failed } = props.task.run_counts.last_30_days
  return success + failed ? (success / (success + failed)) * 100 : null
})
</script>
<template>
  <li
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
          {{ adminDate(task.last_run.started_at) }} ·
          {{ adminDuration(task.last_run.duration_ms) }}
        </p>
      </template>
      <span v-else class="text-slate-400">从未执行</span>
    </div>
    <div class="text-xs tabular-nums text-slate-700">
      <span class="text-slate-400 lg:hidden">下次执行 · </span
      >{{ adminDate(task.next_run_at) }}
    </div>
    <div class="text-xs tabular-nums">
      <div class="flex items-baseline justify-between gap-2">
        <span class="text-[13px] font-semibold text-slate-950">{{
          successShare === null
            ? '—'
            : successShare.toFixed(1) + '%'
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
          v-if="successShare !== null"
          class="h-full rounded-l-full bg-emerald-500"
          :style="{ width: successShare + '%' }"
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
      @click="$emit('history')"
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
</template>
