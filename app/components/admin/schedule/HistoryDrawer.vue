<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide'
import { adminDate, adminDuration, adminLocalToUtc } from '~/utils/admin'
import type {
  ScheduleRunDetail,
  ScheduleRunStatus,
  ScheduleRunSummary,
  ScheduleTask,
} from '~/types/admin'
/**
 * A scheduled task's run history in a side drawer: filter by status and
 * time, page through, and expand a run for its full record and output.
 * Every opening starts over on the first page with the filters cleared.
 */
const props = defineProps<{ task: ScheduleTask | null }>()
const open = defineModel<boolean>('open', { required: true })

const api = useAdminApi()
const history = ref<ScheduleRunSummary[]>([])
const error = ref<any>(null)
const loading = ref(false)
const filters = reactive({
  status: '' as '' | ScheduleRunStatus,
  from: '',
  to: '',
  per_page: 20,
})
const meta = reactive({ page: 1, lastPage: 1, total: 0 })

const run = ref<ScheduleRunDetail | null>(null)
const runError = ref<any>(null)
const runLoadingId = ref<number | null>(null)

const STATUS_OPTIONS = [
  { value: '', label: '状态：全部' },
  { value: 'running', label: '执行中' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
  { value: 'skipped', label: '已跳过' },
  { value: 'suspected_interrupted', label: '疑似中断' },
] as const
const PER_PAGE_OPTIONS = [20, 50, 100].map((n) => ({ value: n, label: `${n} 条/页` }))

function resetFilters() {
  filters.status = ''
  filters.from = ''
  filters.to = ''
  filters.per_page = 20
}

watch(open, (value) => {
  const task = props.task
  if (!value || !task) return
  history.value = []
  error.value = null
  run.value = null
  runError.value = null
  meta.page = 1
  meta.lastPage = 1
  meta.total = 0
  resetFilters()
  if (task.history_available) load(1)
})

async function load(target = 1) {
  if (!props.task?.history_available || loading.value) return
  loading.value = true
  error.value = null
  run.value = null
  runError.value = null
  try {
    const result = await api.list<ScheduleRunSummary>(
      `/schedules/${encodeURIComponent(props.task.key)}/runs`,
      {
        status: filters.status || undefined,
        // Entered in local time; the API filters in UTC.
        from: filters.from ? adminLocalToUtc(filters.from) : undefined,
        to: filters.to ? adminLocalToUtc(filters.to) : undefined,
        page: target,
        per_page: filters.per_page,
      },
    )
    history.value = result.data
    meta.page = Number(
      result.meta?.current_page || result.meta?.page || target,
    )
    meta.lastPage = Number(result.meta?.last_page || 1)
    meta.total = Number(result.meta?.total || 0)
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
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

async function toggleRun(id: number) {
  if (run.value?.id === id) {
    run.value = null
    return
  }
  await loadRun(id)
}
</script>

<template>
  <Drawer v-model:open="open" side="right" size="wide">
    <template #title>
      执行历史
      <span v-if="task" class="ml-1 font-mono text-xs font-normal text-slate-400">{{
        task.command
      }}</span>
    </template>
    <div v-if="task" class="flex min-h-full flex-col">
      <p
        v-if="!task.history_available"
        class="m-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900"
      >
        该任务的执行历史当前不可用。
      </p>
      <template v-else>
        <form
          class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-5 py-2.5"
          @submit.prevent="load(1)"
        >
          <SelectMenu
            v-model="filters.status"
            :options="STATUS_OPTIONS"
            size="sm"
            :highlight="!!filters.status"
            aria-label="状态"
          />
          <label
            class="flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white pl-2.5 text-[13px]"
            ><span class="text-xs text-slate-400">开始</span
            ><input
              v-model="filters.from"
              type="datetime-local"
              class="h-full bg-transparent pr-2 outline-none"
          /></label>
          <label
            class="flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white pl-2.5 text-[13px]"
            ><span class="text-xs text-slate-400">结束</span
            ><input
              v-model="filters.to"
              type="datetime-local"
              class="h-full bg-transparent pr-2 outline-none"
          /></label>
          <SelectMenu
            v-model="filters.per_page"
            :options="PER_PAGE_OPTIONS"
            size="sm"
            aria-label="每页条数"
          />
          <button class="admin-button admin-primary" :disabled="loading">
            筛选
          </button>
          <button
            type="button"
            class="admin-button border-transparent bg-transparent text-slate-500"
            :disabled="loading"
            @click="resetFilters(); load(1)"
          >
            重置
          </button>
        </form>

        <div class="flex-1 p-5">
          <AdminError :error="error" />
          <div
            v-if="loading"
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
                  {{ adminDate(item.started_at) }}
                </span>
                <span class="hidden text-xs text-slate-500 tabular-nums sm:inline">
                  {{ adminDuration(item.duration_ms) }}
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
            >共 {{ meta.total.toLocaleString() }} 条 · 第
            {{ meta.page }} / {{ meta.lastPage }} 页</span
          >
          <div class="flex gap-1">
            <button
              class="admin-button size-7 px-0"
              aria-label="上一页"
              :disabled="meta.page <= 1 || loading"
              @click="load(meta.page - 1)"
            >
              <LucideIcon :icon="ChevronLeft" class="size-4" />
            </button>
            <button
              class="admin-button size-7 px-0"
              aria-label="下一页"
              :disabled="meta.page >= meta.lastPage || loading"
              @click="load(meta.page + 1)"
            >
              <LucideIcon :icon="ChevronRight" class="size-4" />
            </button>
          </div>
        </footer>
      </template>
    </div>
  </Drawer>
</template>
