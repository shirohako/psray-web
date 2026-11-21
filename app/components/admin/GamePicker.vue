<script setup lang="ts">
import { Check, Search } from 'lucide'
import type { AdminGameSummary } from '~/types/admin'
import { formatAdminReleaseDate } from '~/utils/adminGame'

/** Dialog that searches games (name, alias, #ID, IGDB ID) and hands back the one picked. */
const open = defineModel<boolean>('open', { required: true })
const props = withDefaults(defineProps<{
  title?: string
  /** Game that can't be picked (e.g. the one being deleted). */
  excludeId?: number | null
  confirmLabel?: string
  busy?: boolean
}>(), { title: '选择游戏', confirmLabel: '选择' })
const emit = defineEmits<{ pick: [game: AdminGameSummary] }>()

const api = useAdminApi()
const query = ref('')
const results = ref<AdminGameSummary[]>([])
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
    const response = await api.list<AdminGameSummary>('/games', { q, per_page: 8, sort: 'trophy_sets' })
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
        <input v-model="query" class="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400" placeholder="游戏名、别名、#ID 或 IGDB ID" autofocus />
      </label>
      <AdminError :error="error" />
      <div v-if="loading && !results.length" class="space-y-2">
        <div v-for="i in 3" :key="i" class="h-12 animate-pulse rounded-md bg-slate-100" />
      </div>
      <p v-else-if="query.trim() && !results.length" class="py-6 text-center text-xs text-slate-400">没有找到游戏</p>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="game in results" :key="game.id" class="flex items-center gap-3 py-2">
          <img v-if="game.cover_url" :src="game.cover_url" alt="" class="h-12 w-9 shrink-0 rounded object-cover" loading="lazy" />
          <span v-else class="h-12 w-9 shrink-0 rounded bg-slate-100" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] font-medium text-slate-900">{{ game.name }}</span>
            <span class="mt-1 flex flex-wrap items-center gap-1.5">
              <span class="admin-count">#{{ game.id }}</span>
              <span class="admin-count">{{ formatAdminReleaseDate(game.first_release_date, game.first_release_precision) }}</span>
              <span v-for="platform in game.platforms.slice(0, 4)" :key="platform" class="admin-count">{{ platform }}</span>
              <span v-if="game.trophy_set_count" class="admin-count">{{ game.trophy_set_count }} 个奖杯组</span>
            </span>
          </span>
          <button type="button" class="admin-button shrink-0" :disabled="busy || game.id === excludeId" @click="emit('pick', game)">
            <LucideIcon :icon="Check" class="size-3.5" />{{ game.id === excludeId ? '当前游戏' : confirmLabel }}
          </button>
        </li>
      </ul>
    </div>
  </Dialog>
</template>
