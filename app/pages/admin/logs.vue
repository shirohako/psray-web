<script setup lang="ts">
import { Search, FileText } from 'lucide'
import { adminDate, adminLogLines } from '~/utils/admin'
import type { LogWindow } from '~/types/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi(),
  route = useRoute(),
  router = useRouter()
const sources = ref<{ id: string; label: string; available: boolean }[]>([]),
  source = ref(String(route.query.source || 'laravel')),
  q = ref(String(route.query.q || '')),
  data = ref<LogWindow | null>(null),
  error = ref<any>(null),
  busy = ref(false),
  updated = ref('')
async function load(cursor?: string | null) {
  busy.value = true
  error.value = null
  try {
    data.value = await api.get<LogWindow>(
      `/log-sources/${encodeURIComponent(source.value)}/entries`,
      { q: q.value || undefined, cursor: cursor || undefined },
    )
    updated.value = adminDate(new Date())
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
async function search() {
  await router.replace({
    query: { source: source.value, q: q.value || undefined },
  })
  await load()
}
function formatBytes(value?: number) {
  if (value === undefined) return '—'
  if (value < 1024) return `${value} B`
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KiB`
  return `${(value / 1024 ** 2).toFixed(1)} MiB`
}
function pick(id: string) {
  source.value = id
  search()
}
const lines = computed(() => adminLogLines(data.value?.text || ''))
const errorCount = computed(
  () => lines.value.filter((l) => l.level === 'error').length,
)
onMounted(async () => {
  // Busy from the start, so the viewer shows the skeleton while the source
  // list loads rather than the empty prompt.
  busy.value = true
  try {
    sources.value = await api.get('/log-sources')
    await load()
  } catch (e) {
    error.value = e
    busy.value = false
  }
})
</script>
<template>
  <AdminPageHeader
    :icon="FileText"
    title="错误日志"
    description="仅查看白名单日志源。每次最多读取 128 KiB，关键词只筛选当前读取窗口。"
  />
  <AdminError :error="error" />
  <div class="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
    <aside class="space-y-4">
      <form class="relative" @submit.prevent="search">
        <LucideIcon
          :icon="Search"
          class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
        />
        <input
          v-model="q"
          class="admin-input pl-8"
          placeholder="筛选关键词，回车读取"
          maxlength="200"
          aria-label="关键词"
        />
      </form>
      <nav aria-label="日志源">
        <p class="mb-1.5 px-2 text-[11px] font-semibold tracking-wider text-slate-400">
          日志源
        </p>
        <ul class="space-y-0.5" :aria-busy="busy && !sources.length">
          <template v-if="busy && !sources.length">
            <li
              v-for="i in 4"
              :key="'s' + i"
              class="flex items-center gap-2.5 px-2 py-2.5"
            >
              <span class="size-1.5 shrink-0 rounded-full bg-slate-200" />
              <span
                class="h-2.5 animate-pulse rounded-full bg-slate-100"
                :style="{ width: 40 + ((i * 23) % 45) + '%' }"
              />
            </li>
          </template>
          <li v-for="item in sources" :key="item.id">
            <button
              class="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition"
              :class="
                source === item.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              "
              :aria-current="source === item.id ? 'true' : undefined"
              @click="pick(item.id)"
            >
              <span
                class="size-1.5 shrink-0 rounded-full"
                :class="item.available ? 'bg-emerald-500' : 'bg-slate-300'"
                :title="item.available ? '可读取' : '不存在 / 不可读'"
              />
              <span class="truncate font-mono text-xs">{{ item.label }}</span>
            </button>
          </li>
        </ul>
      </nav>
      <dl
        v-if="data?.available"
        class="space-y-2 rounded-lg border border-slate-200 p-3 text-xs"
      >
        <div class="flex justify-between">
          <dt class="text-slate-500">读取窗口</dt>
          <dd class="font-medium text-slate-900 tabular-nums">
            {{ formatBytes(data.window_bytes) }}
          </dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">文件大小</dt>
          <dd class="font-medium text-slate-900 tabular-nums">
            {{ formatBytes(data.file_size) }}
          </dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">错误行</dt>
          <dd
            class="font-medium tabular-nums"
            :class="errorCount ? 'text-red-700' : 'text-slate-900'"
          >
            {{ errorCount }}
          </dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-slate-500">读取于</dt>
          <dd class="font-mono text-slate-900">{{ updated.slice(11) }}</dd>
        </div>
      </dl>
    </aside>

    <AdminLogViewer
      :source="source"
      :q="q"
      :data="data"
      :lines="lines"
      :busy="busy"
      @older="load(data?.next_cursor)"
    />
  </div>
</template>
