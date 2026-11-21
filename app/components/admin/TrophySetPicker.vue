<script setup lang="ts">
import { Link2, Search } from 'lucide'
import type { AdminTrophySet } from '~/types/admin'

/** Dialog that searches trophy sets (title, NPWR, #ID) and hands back the one picked. */
const open = defineModel<boolean>('open', { required: true })
const props = withDefaults(defineProps<{
  title?: string
  /** Sets already linked to this game are shown as such. */
  gameId?: number | null
  busy?: boolean
}>(), { title: '添加奖杯组' })
const emit = defineEmits<{ pick: [set: AdminTrophySet] }>()

const api = useAdminApi()
const query = ref('')
const results = ref<AdminTrophySet[]>([])
const loading = ref(false)
const error = ref<any>(null)
let generation = 0
let timer: ReturnType<typeof setTimeout> | undefined

async function search() {
  const current = ++generation
  const q = query.value.trim()
  if (!q) {
    results.value = []
    return
  }
  loading.value = true
  error.value = null
  try {
    const response = await api.list<AdminTrophySet>('/trophy-sets', { q, per_page: 8 })
    if (current === generation) results.value = response.data
  } catch (e) {
    if (current === generation) error.value = e
  } finally {
    if (current === generation) loading.value = false
  }
}
watch(query, () => {
  clearTimeout(timer)
  timer = setTimeout(search, 250)
})
watch(open, (value) => {
  if (value) {
    query.value = ''
    results.value = []
    error.value = null
  }
})
</script>

<template>
  <Dialog v-model:open="open" :title="props.title" size="md">
    <div class="space-y-3 p-5">
      <label class="flex h-9 items-center gap-2 rounded-md border border-slate-200 px-2.5 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10">
        <LucideIcon :icon="Search" class="size-4 text-slate-400" />
        <input v-model="query" class="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400" placeholder="奖杯组标题、NPWR 或 #ID" autofocus />
      </label>
      <AdminError :error="error" />
      <div v-if="loading && !results.length" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-12 animate-pulse rounded-md bg-slate-100" />
      </div>
      <p v-else-if="query.trim() && !results.length" class="py-6 text-center text-xs text-slate-400">没有找到奖杯组</p>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="set in results" :key="set.id" class="flex items-center gap-3 py-2">
          <AdminCdnImage :src="set.icon_url" :class="set.platform.includes('PS5') ? 'size-10' : 'h-10 w-[72px]'" class="shrink-0" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] font-medium text-slate-900">{{ set.name }}</span>
            <span class="mt-1 flex flex-wrap items-center gap-1.5">
              <span class="admin-count font-mono">{{ set.np_communication_id }}</span>
              <span v-for="platform in set.platform" :key="platform" class="admin-count">{{ platform }}</span>
              <span v-if="set.game_id && set.game_id === gameId" class="rounded-full bg-emerald-50 px-1.5 py-px text-[11px] font-semibold text-emerald-700">已关联</span>
              <span v-else-if="set.game_id" class="rounded-full bg-amber-50 px-1.5 py-px text-[11px] font-semibold text-amber-700">已关联游戏 #{{ set.game_id }}</span>
            </span>
          </span>
          <button type="button" class="admin-button shrink-0" :disabled="busy || (!!gameId && set.game_id === gameId)" @click="emit('pick', set)">
            <LucideIcon :icon="Link2" class="size-3.5" />{{ set.game_id && set.game_id !== gameId ? '改关联到这里' : '关联' }}
          </button>
        </li>
      </ul>
    </div>
  </Dialog>
</template>
