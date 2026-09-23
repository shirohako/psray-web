<script setup lang="ts">
import { Search, ChevronsUp, Copy, Check, FileText, WrapText } from 'lucide'
import { adminDate, type LogWindow } from '~/utils/admin'
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
const copied = ref(false)
async function copyText() {
  try {
    await navigator.clipboard.writeText(data.value?.text || '')
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {}
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
const wrap = ref(false)
// Split the window into lines and tag each with a severity so the viewer can
// tint it; the text itself stays verbatim.
const lines = computed(() =>
  (data.value?.text || '').split('\n').map((text) => {
    const level = /\.(ERROR|CRITICAL|ALERT|EMERGENCY)\b/.test(text)
      ? 'error'
      : /\.WARNING\b/.test(text)
        ? 'warning'
        : /^(#\d+ |Stack trace:|\s+at )/.test(text)
          ? 'trace'
          : 'info'
    const stamp = /^\[[^\]]+\]/.exec(text)?.[0] ?? ''
    return { text: text.slice(stamp.length), stamp, level }
  }),
)
const errorCount = computed(
  () => lines.value.filter((l) => l.level === 'error').length,
)
onMounted(async () => {
  try {
    sources.value = await api.get('/log-sources')
    await load()
  } catch (e) {
    error.value = e
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
        <ul class="space-y-0.5">
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

    <section
      class="flex min-h-[28rem] flex-col overflow-hidden rounded-xl bg-[#0b0f17] ring-1 ring-slate-900/10 lg:h-[calc(100vh-13rem)]"
    >
      <header
        class="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-2"
      >
        <span class="flex min-w-0 items-center gap-2 font-mono text-xs text-slate-400">
          <span
            class="size-1.5 rounded-full"
            :class="busy ? 'animate-pulse bg-amber-400' : 'bg-emerald-400'"
          />
          <span class="truncate"
            >{{ source }}<span v-if="q" class="text-slate-500">
              | grep “{{ q }}”</span
            ></span
          >
        </span>
        <div class="flex items-center gap-0.5 text-xs">
          <button
            class="inline-flex h-7 items-center gap-1.5 rounded px-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
            :disabled="busy || !data?.next_cursor"
            @click="load(data?.next_cursor)"
          >
            <LucideIcon :icon="ChevronsUp" class="size-3.5" />更早
          </button>
          <button
            class="grid size-7 place-items-center rounded transition hover:bg-white/10 hover:text-white"
            :class="wrap ? 'text-white' : 'text-slate-400'"
            :aria-pressed="wrap"
            aria-label="自动换行"
            title="自动换行"
            @click="wrap = !wrap"
          >
            <LucideIcon :icon="WrapText" class="size-3.5" />
          </button>
          <button
            class="grid size-7 place-items-center rounded text-slate-400 transition hover:bg-white/10 hover:text-white"
            :aria-label="copied ? '已复制' : '复制日志'"
            :title="copied ? '已复制' : '复制日志'"
            @click="copyText"
          >
            <LucideIcon :icon="copied ? Check : Copy" class="size-3.5" />
          </button>
        </div>
      </header>
      <p
        v-if="data?.rotated"
        class="border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs text-amber-200"
      >
        日志已轮转或截断，已返回新文件的最近内容。
      </p>
      <div class="min-h-0 flex-1 overflow-auto py-2 font-mono text-xs leading-5">
        <p
          v-if="!data && !busy"
          class="px-4 py-10 text-center text-slate-500"
        >
          选择日志源开始读取。
        </p>
        <p
          v-else-if="data && !data.available"
          class="px-4 py-10 text-center text-slate-500"
        >
          此日志文件不存在或当前不可读取。
        </p>
        <p
          v-else-if="data && !data.text"
          class="px-4 py-10 text-center text-slate-500"
        >
          此读取窗口没有匹配内容。
        </p>
        <template v-else>
        <div
          v-for="(line, index) in data?.available ? lines : []"
          :key="index"
          class="flex gap-4 pr-4 hover:bg-white/[0.03]"
          :class="{
            'bg-red-500/[0.07] shadow-[inset_2px_0_0_var(--color-red-500)]':
              line.level === 'error',
            'shadow-[inset_2px_0_0_var(--color-amber-400)]':
              line.level === 'warning',
          }"
        >
          <span
            class="w-12 shrink-0 select-none pl-3 text-right text-slate-600 tabular-nums"
            >{{ index + 1 }}</span
          >
          <span
            :class="[
              wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre',
              line.level === 'error'
                ? 'text-red-300'
                : line.level === 'warning'
                  ? 'text-amber-200'
                  : line.level === 'trace'
                    ? 'text-slate-500'
                    : 'text-slate-300',
            ]"
            ><span class="text-sky-300/70">{{ line.stamp }}</span
            >{{ line.text }}</span
          >
        </div>
        </template>
      </div>
    </section>
  </div>
</template>
