<script setup lang="ts">
import { Check, DownloadCloud, Gamepad2, Lock, Plus, Search } from 'lucide'
import type { AdminFilter, AdminGameDetail, AdminGameSummary, AdminIgdbSearchResult } from '~/types/admin'
import { adminDate } from '~/utils/admin'
import { formatAdminReleaseDate, GAME_LOCK_LABELS, GAME_SORT_OPTIONS } from '~/utils/adminGame'

definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })

const columns = [
  { key: 'id', label: 'ID', mono: true },
  { key: 'name', label: '游戏' },
  { key: 'first_release_date', label: '首发日' },
  { key: 'platforms', label: '平台' },
  { key: 'trophy_set_count', label: '奖杯组' },
  { key: 'locked_fields', label: '人工修改' },
  { key: 'updated_at', label: '最近更新' },
]
const filters: AdminFilter[] = [
  { key: 'q', label: '游戏名 / 别名 / #ID / IGDB ID' },
  { key: 'missing_release', label: '发售日', options: [{ value: '1', label: '缺发售日' }] },
  { key: 'locked', label: '人工修改', options: [{ value: '1', label: '有锁定字段' }, { value: '0', label: '全部跟随 IGDB' }] },
  { key: 'no_trophy_sets', label: '奖杯组', options: [{ value: '1', label: '没有奖杯组' }] },
  { key: 'sort', label: '排序', options: GAME_SORT_OPTIONS },
]
const rowTo = (row: AdminGameSummary) => `/admin/games/${row.id}`

const api = useAdminApi()

// New game: a name, then straight into the editor.
const createOpen = ref(false)
const createName = ref('')
const creating = ref(false)
const createError = ref<any>(null)
async function create() {
  if (!createName.value.trim()) return
  creating.value = true
  createError.value = null
  try {
    const game = await api.write<AdminGameDetail>('/games', { name: createName.value.trim() })
    createOpen.value = false
    await navigateTo(`/admin/games/${game.id}`)
  } catch (e) {
    createError.value = e
  } finally {
    creating.value = false
  }
}

// Import from IGDB: search, then import (or open the one already imported).
const importOpen = ref(false)
const igdbQuery = ref('')
const igdbResults = ref<AdminIgdbSearchResult[]>([])
const igdbSearching = ref(false)
const importing = ref<number | null>(null)
const importError = ref<any>(null)
async function searchIgdb() {
  if (!igdbQuery.value.trim()) return
  igdbSearching.value = true
  importError.value = null
  try {
    igdbResults.value = await api.get<AdminIgdbSearchResult[]>('/games/igdb/search', { q: igdbQuery.value.trim(), limit: 10 })
  } catch (e) {
    importError.value = e
  } finally {
    igdbSearching.value = false
  }
}
async function importGame(result: AdminIgdbSearchResult) {
  if (result.imported_game_id) return navigateTo(`/admin/games/${result.imported_game_id}`)
  importing.value = result.igdb_id
  importError.value = null
  try {
    const game = await api.write<AdminGameDetail>('/games/igdb', { igdb_id: result.igdb_id })
    importOpen.value = false
    await navigateTo(`/admin/games/${game.id}`)
  } catch (e) {
    importError.value = e
  } finally {
    importing.value = null
  }
}
function openImport() {
  importOpen.value = true
  igdbQuery.value = ''
  igdbResults.value = []
  importError.value = null
}
</script>

<template>
  <AdminCollection
    :icon="Gamepad2"
    title="游戏"
    description="游戏资料主要来自 IGDB。在这里改过的发售信息、首发日、简介、别名会被锁定，之后的 IGDB 刷新不再覆盖；名称、封面、各语言名称 IGDB 刷新本来就不改。"
    endpoint="/games"
    :columns="columns"
    :filters="filters"
    :row-to="rowTo"
    ><template #toolbar
      ><button type="button" class="admin-button" @click="openImport"><LucideIcon :icon="DownloadCloud" class="size-3.5" />从 IGDB 导入</button
      ><button type="button" class="admin-button" @click="createOpen = true; createName = ''"><LucideIcon :icon="Plus" class="size-3.5" />新建游戏</button></template
    ><template #cell-name="{ row }"
      ><span class="flex min-w-56 max-w-md items-center gap-2.5"
        ><img v-if="row.cover_url" :src="row.cover_url" alt="" class="h-10 w-[30px] shrink-0 rounded object-cover ring-1 ring-slate-200" loading="lazy" /><span v-else class="h-10 w-[30px] shrink-0 rounded bg-slate-100" /><span class="min-w-0"
          ><NuxtLink :to="`/admin/games/${row.id}`" class="block truncate font-medium text-slate-900 hover:underline" @click.stop>{{ row.name }}</NuxtLink
          ><span class="mt-0.5 flex items-center gap-1.5"
            ><span v-if="row.igdb_id" class="admin-count font-mono">IGDB {{ row.igdb_id }}</span
            ><span v-else class="admin-count">手动创建</span></span
          ></span
        ></span
      ></template
    ><template #cell-first_release_date="{ row }"
      ><span class="whitespace-nowrap tabular-nums" :class="row.first_release_date ? 'text-slate-600' : 'text-amber-700'">{{ formatAdminReleaseDate(row.first_release_date, row.first_release_precision) }}</span
      ><span v-if="!row.platforms.length" class="ml-1.5 rounded-full bg-amber-50 px-1.5 py-px text-[11px] font-semibold text-amber-700">无发售信息</span></template
    ><template #cell-platforms="{ row }"
      ><span class="flex max-w-56 flex-wrap gap-1"
        ><span v-for="platform in row.platforms.slice(0, 5)" :key="platform" class="admin-count">{{ platform }}</span
        ><span v-if="row.platforms.length > 5" class="text-[11px] text-slate-400">+{{ row.platforms.length - 5 }}</span></span
      ></template
    ><template #cell-trophy_set_count="{ row }"
      ><span class="tabular-nums" :class="row.trophy_set_count ? 'text-slate-600' : 'text-slate-400'">{{ row.trophy_set_count }}</span></template
    ><template #cell-locked_fields="{ row }"
      ><span class="flex flex-wrap gap-1"
        ><span v-for="field in row.locked_fields" :key="field" class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-px text-[11px] font-semibold text-amber-700"><LucideIcon :icon="Lock" class="size-3" />{{ GAME_LOCK_LABELS[field as keyof typeof GAME_LOCK_LABELS] }}</span
        ><span v-if="!row.locked_fields.length" class="text-slate-300">—</span></span
      ></template
    ><template #cell-updated_at="{ row }"
      ><span class="whitespace-nowrap tabular-nums text-slate-600">{{ row.updated_at ? adminDate(row.updated_at) : '—' }}</span></template
  ></AdminCollection>

  <Dialog v-model:open="createOpen" title="新建游戏" size="sm">
    <form id="game-create" class="space-y-3 p-5" @submit.prevent="create">
      <label for="game-create-name" class="block text-xs font-medium text-slate-700">游戏名</label>
      <input id="game-create-name" v-model="createName" maxlength="255" class="admin-input" placeholder="通用名或原名" />
      <p class="text-xs text-slate-500">手动创建的游戏没有 IGDB 来源，不会被 IGDB 刷新。IGDB 上有的游戏，最好用「从 IGDB 导入」。</p>
      <AdminError :error="createError" />
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="createOpen = false">取消</button>
        <button type="submit" form="game-create" class="admin-button admin-primary" :disabled="creating || !createName.trim()">{{ creating ? '正在创建…' : '创建并编辑' }}</button>
      </div>
    </template>
  </Dialog>

  <Dialog v-model:open="importOpen" title="从 IGDB 导入" size="md">
    <div class="space-y-3 p-5">
      <form class="flex gap-2" @submit.prevent="searchIgdb">
        <label class="flex h-8 flex-1 items-center gap-2 rounded-md border border-slate-200 px-2.5 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10">
          <LucideIcon :icon="Search" class="size-3.5 text-slate-400" />
          <input v-model="igdbQuery" class="flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400" placeholder="游戏名（只搜 PlayStation 平台）" autofocus />
        </label>
        <button type="submit" class="admin-button admin-primary" :disabled="igdbSearching || !igdbQuery.trim()">{{ igdbSearching ? '搜索中…' : '搜索' }}</button>
      </form>
      <AdminError :error="importError" />
      <ul class="divide-y divide-slate-100">
        <li v-for="result in igdbResults" :key="result.igdb_id" class="flex items-center gap-3 py-2">
          <img v-if="result.cover_url" :src="result.cover_url" alt="" class="h-12 w-9 shrink-0 rounded object-cover" loading="lazy" />
          <span v-else class="h-12 w-9 shrink-0 rounded bg-slate-100" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[13px] font-medium text-slate-900">{{ result.name }}</span>
            <span class="mt-1 flex flex-wrap items-center gap-1.5">
              <span class="admin-count font-mono">IGDB {{ result.igdb_id }}</span>
              <span v-if="result.first_release_date" class="admin-count">{{ result.first_release_date }}</span>
              <span v-for="platform in result.platforms" :key="platform" class="admin-count">{{ platform }}</span>
            </span>
          </span>
          <button type="button" class="admin-button shrink-0" :disabled="importing !== null" @click="importGame(result)">
            <template v-if="result.imported_game_id"><LucideIcon :icon="Check" class="size-3.5" />已导入，打开</template>
            <template v-else><LucideIcon :icon="DownloadCloud" class="size-3.5" />{{ importing === result.igdb_id ? '正在导入…' : '导入' }}</template>
          </button>
        </li>
      </ul>
      <p v-if="!igdbResults.length && !igdbSearching" class="text-xs text-slate-400">导入时一并带上封面、简介、本地化名称、别名和全部平台的发售信息。</p>
    </div>
  </Dialog>
</template>
