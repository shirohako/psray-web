<script setup lang="ts">
import type { LogWindow } from '~/utils/admin'
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
    updated.value = new Date().toISOString()
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
  <div>
    <h1 class="text-2xl font-bold">错误日志</h1>
    <p class="mt-2 text-sm text-slate-500">
      仅查看白名单日志源。每次最多读取 128 KiB，关键词只筛选当前读取窗口。
    </p>
  </div>
  <form
    class="admin-card flex flex-wrap items-end gap-3"
    @submit.prevent="search"
  >
    <label class="min-w-48 flex-1 text-xs text-slate-500"
      >日志源<select v-model="source" class="admin-input mt-2">
        <option v-for="item in sources" :key="item.id" :value="item.id">
          {{ item.label }}{{ item.available ? '' : '（不存在 / 不可读）' }}
        </option>
      </select></label
    ><label class="min-w-48 flex-1 text-xs text-slate-500"
      >关键词<input
        v-model="q"
        class="admin-input mt-2"
        maxlength="200" /></label
    ><button class="admin-button admin-primary" :disabled="busy">
      {{ busy ? '正在读取…' : '读取最新日志' }}
    </button>
  </form>
  <AdminError :error="error" />
  <div v-if="data" class="space-y-4">
    <p v-if="!data.available" class="admin-card text-sm text-slate-500">
      此日志文件不存在或当前不可读取。
    </p>
    <template v-else
      ><div
        class="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"
      >
        <span
          >读取 {{ data.window_bytes }} 字节 / 文件 {{ data.file_size }} 字节 ·
          {{ updated }}</span
        ><button
          class="admin-button"
          :disabled="busy || !data.next_cursor"
          @click="load(data.next_cursor)"
        >
          读取更早内容
        </button>
      </div>
      <p
        v-if="data.rotated"
        class="rounded-lg bg-amber-50 p-3 text-sm text-amber-800"
      >
        日志已轮转或截断，已返回新文件的最近内容。
      </p>
      <pre
        class="max-h-[65vh] overflow-auto rounded-xl bg-slate-950 p-5 font-mono text-xs leading-6 text-slate-200"
        >{{ data.text || '此读取窗口没有匹配内容。' }}</pre>
    </template>
  </div>
</template>
