<script setup lang="ts">
import { Lightbulb, Plus, RefreshCw, Search } from 'lucide'
import type { AdminSeriesSearch, AdminSeriesSet, AdminSeriesSuggestion, AdminSeriesSuggestions } from '~/types/admin'
import { draftSetIds, type DraftStage } from '~/utils/adminSeries'

/**
 * Where the series editor gets trophy sets from: suggestions (other versions
 * of games already in the series, look-alike titles not linked to a game yet,
 * sets removed earlier) and a search that can add a single set or a whole
 * game. Sets go to the target stage, or to the stage a suggestion points at.
 */
const props = defineProps<{ seriesId: number; stages: DraftStage[] }>()
const target = defineModel<string>('target', { required: true })
const emit = defineEmits<{ add: [sets: AdminSeriesSet[], toKey: string] }>()

const api = useAdminApi()
const tab = ref<'suggestions' | 'search'>('suggestions')
const present = computed(() => draftSetIds(props.stages))

const stageOptions = computed(() => {
  let n = 0
  return [
    ...props.stages.map(stage => ({
      value: stage.key,
      label: `${stage.kind === 'main' ? `第 ${++n} 阶段` : '外传'} · ${stage.label || stage.fallbackName || '未命名'}`,
    })),
    { value: 'new', label: '新阶段（末尾）' },
  ]
})

// ── Suggestions ─────────────────────────────────────────────────────────────
const suggestions = ref<AdminSeriesSuggestions | null>(null)
const suggestionsLoading = ref(false)
const suggestionsError = ref<any>(null)
async function loadSuggestions() {
  suggestionsLoading.value = true
  suggestionsError.value = null
  try {
    suggestions.value = await api.get<AdminSeriesSuggestions>(`/series/${props.seriesId}/suggestions`)
  } catch (e) {
    suggestionsError.value = e
  } finally {
    suggestionsLoading.value = false
  }
}
onMounted(loadSuggestions)

const groups = computed(() => suggestions.value
  ? [
      { key: 'same_game', title: '同游戏的其他版本', hint: '新地区版、新平台版', items: suggestions.value.same_game },
      { key: 'similar_name', title: '标题相近', hint: '多半还没关联到游戏', items: suggestions.value.similar_name },
      { key: 'excluded', title: '之前删掉的', hint: '自动归类不会再加回', items: suggestions.value.excluded },
    ].filter(group => group.items.length)
  : [])

/** A suggestion goes to the stage it points at when that stage is still there. */
function addSuggestion(item: AdminSeriesSuggestion) {
  const stage = props.stages.find(s => s.id !== null && s.id === item.stage_id)
  emit('add', [item.trophy_set], stage?.key ?? target.value)
}

// ── Search ──────────────────────────────────────────────────────────────────
const query = ref('')
const result = ref<AdminSeriesSearch | null>(null)
const searching = ref(false)
const searchError = ref<any>(null)
let timer: ReturnType<typeof setTimeout> | undefined
let generation = 0

watch(query, (value) => {
  clearTimeout(timer)
  const q = value.trim()
  if (q.length < 2) {
    result.value = null
    return
  }
  timer = setTimeout(() => search(q), 300)
})

async function search(q: string) {
  const current = ++generation
  searching.value = true
  searchError.value = null
  try {
    const data = await api.get<AdminSeriesSearch>('/series/search', { q })
    if (current === generation) result.value = data
  } catch (e) {
    if (current === generation) searchError.value = e
  } finally {
    if (current === generation) searching.value = false
  }
}
onBeforeUnmount(() => clearTimeout(timer))

const missing = (sets: AdminSeriesSet[]) => sets.filter(set => !present.value.has(set.id))
</script>

<template>
  <aside class="admin-panel flex max-h-[calc(100vh-8rem)] flex-col overflow-hidden">
    <div class="space-y-2 border-b border-slate-200 p-3">
      <label for="series-target" class="block text-[11px] font-medium text-slate-500">加入到</label>
      <select id="series-target" v-model="target" class="admin-input h-8 text-xs">
        <option v-for="option in stageOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </div>

    <div class="flex border-b border-slate-200 px-3" role="tablist">
      <button type="button" role="tab" class="admin-utab h-10 flex-1 justify-center" :aria-selected="tab === 'suggestions'" @click="tab = 'suggestions'">
        <LucideIcon :icon="Lightbulb" class="size-3.5" />建议
      </button>
      <button type="button" role="tab" class="admin-utab h-10 flex-1 justify-center" :aria-selected="tab === 'search'" @click="tab = 'search'">
        <LucideIcon :icon="Search" class="size-3.5" />搜索
      </button>
    </div>

    <!-- Suggestions -->
    <div v-if="tab === 'suggestions'" class="min-h-0 flex-1 overflow-y-auto">
      <div class="flex items-center justify-between px-3 pt-3 text-[11px] text-slate-400">
        <span>按玩家数排序，每类最多 30 条</span>
        <button type="button" class="admin-link" :disabled="suggestionsLoading" @click="loadSuggestions">
          <LucideIcon :icon="RefreshCw" class="size-3" :class="suggestionsLoading ? 'animate-spin' : ''" />刷新
        </button>
      </div>
      <AdminError :error="suggestionsError" class="m-3" />
      <div v-if="suggestionsLoading && !suggestions" class="space-y-2 p-3">
        <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-md bg-slate-100" />
      </div>
      <p v-else-if="suggestions && !groups.length" class="px-3 py-8 text-center text-xs text-slate-400">没有建议，系列看起来是完整的。</p>
      <section v-for="group in groups" :key="group.key" class="px-3 py-2">
        <h3 class="flex items-baseline gap-2 py-1.5 text-xs font-semibold text-slate-700">
          {{ group.title }}<span class="font-normal text-slate-400">{{ group.hint }}</span>
        </h3>
        <ul class="divide-y divide-slate-100">
          <li v-for="item in group.items" :key="item.trophy_set.id" class="py-2">
            <AdminSeriesSetRow :set="item.trophy_set" :present="present.has(item.trophy_set.id)">
              <button v-if="!present.has(item.trophy_set.id)" type="button" class="admin-button h-7 px-2 text-xs" @click="addSuggestion(item)">
                <LucideIcon :icon="Plus" class="size-3.5" />加入
              </button>
            </AdminSeriesSetRow>
          </li>
        </ul>
      </section>
    </div>

    <!-- Search -->
    <div v-else class="flex min-h-0 flex-1 flex-col">
      <div class="p-3">
        <div class="relative">
          <LucideIcon :icon="Search" class="pointer-events-none absolute left-2.5 top-2 size-4 text-slate-400" />
          <input v-model="query" type="search" class="admin-input pl-8" placeholder="标题、NPWR 或 #ID" aria-label="搜索奖杯组" autofocus />
        </div>
        <div v-if="searching" class="mt-2 h-0.5 overflow-hidden rounded-full bg-slate-100"><div class="animate-admin-progress h-full w-1/3 bg-slate-900" /></div>
      </div>
      <AdminError :error="searchError" class="mx-3" />
      <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <p v-if="!result" class="py-8 text-center text-xs text-slate-400">输入至少 2 个字符开始搜索。</p>
        <p v-else-if="!result.trophy_sets.length" class="py-8 text-center text-xs text-slate-400">没有找到奖杯组。</p>
        <template v-else>
          <section v-if="result.games.length" class="mb-3 space-y-1.5">
            <h3 class="py-1 text-xs font-semibold text-slate-700">整个游戏</h3>
            <div v-for="game in result.games" :key="game.id" class="flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-2">
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-medium text-slate-900">{{ game.name }}</p>
                <p class="text-[11px] text-slate-400">{{ game.first_release_date?.slice(0, 4) ?? '未定档' }} · {{ game.trophy_sets.length }} 个奖杯组<template v-if="missing(game.trophy_sets).length < game.trophy_sets.length">，{{ game.trophy_sets.length - missing(game.trophy_sets).length }} 个已在系列里</template></p>
              </div>
              <button type="button" class="admin-button h-7 px-2 text-xs" :disabled="!missing(game.trophy_sets).length" @click="emit('add', missing(game.trophy_sets), target)">
                <LucideIcon :icon="Plus" class="size-3.5" />加入 {{ missing(game.trophy_sets).length }} 个
              </button>
            </div>
          </section>
          <h3 class="py-1 text-xs font-semibold text-slate-700">奖杯组</h3>
          <ul class="divide-y divide-slate-100">
            <li v-for="set in result.trophy_sets" :key="set.id" class="py-2">
              <AdminSeriesSetRow :set="set" :present="present.has(set.id)">
                <button v-if="!present.has(set.id)" type="button" class="admin-button h-7 px-2 text-xs" @click="emit('add', [set], target)">
                  <LucideIcon :icon="Plus" class="size-3.5" />加入
                </button>
              </AdminSeriesSetRow>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </aside>
</template>
