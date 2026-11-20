<script setup lang="ts">
import { Layers, Plus } from 'lucide'
import type { AdminFilter, AdminSeriesDetail } from '~/types/admin'
import { adminDate } from '~/utils/admin'
import { SERIES_REVIEW_LABELS, SERIES_SORT_OPTIONS, SERIES_SOURCE_OPTIONS, SERIES_STATUS_OPTIONS } from '~/utils/adminSeries'

definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })

const columns = [
  { key: 'id', label: 'ID', mono: true },
  { key: 'name', label: '系列' },
  { key: 'status', label: '状态' },
  { key: 'stage_count', label: '阶段' },
  { key: 'trophy_set_count', label: '奖杯组' },
  { key: 'popularity', label: '热度' },
  { key: 'updated_at', label: '最近更新' },
]
const filters: AdminFilter[] = [
  { key: 'q', label: '系列名 / 游戏名 / #ID' },
  { key: 'status', label: '状态', options: SERIES_STATUS_OPTIONS },
  { key: 'source', label: '来源', options: SERIES_SOURCE_OPTIONS },
  { key: 'needs_review', label: '审核', options: [{ value: '1', label: '待审核' }, { value: '0', label: '无需审核' }] },
  { key: 'sort', label: '排序', options: SERIES_SORT_OPTIONS },
]
const detailOmit = ['covers', 'stages', 'translations', 'exclusions']
const STATUS_TONE: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-slate-100 text-slate-600',
  hidden: 'bg-red-50 text-red-700',
}
const statusLabel = (value: string) => SERIES_STATUS_OPTIONS.find(option => option.value === value)?.label ?? value

// New series: a name, then straight into the editor.
const api = useAdminApi()
const createOpen = ref(false)
const createName = ref('')
const creating = ref(false)
const createError = ref<any>(null)
async function create() {
  if (!createName.value.trim()) return
  creating.value = true
  createError.value = null
  try {
    const series = await api.write<AdminSeriesDetail>('/series', { name: createName.value.trim() })
    createOpen.value = false
    await navigateTo(`/admin/series/${series.id}`)
  } catch (e) {
    createError.value = e
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <AdminCollection
    :icon="Layers"
    title="系列"
    description="游戏系列与阶段。大部分由每周的 series:detect 按 IGDB collection 自动生成；管理员保存过的系列，自动归类只追加、不改动。"
    endpoint="/series"
    detail-base="/series"
    :columns="columns"
    :filters="filters"
    :detail-omit="detailOmit"
    ><template #toolbar
      ><button type="button" class="admin-button" @click="createOpen = true; createName = ''"><LucideIcon :icon="Plus" class="size-3.5" />新建系列</button></template
    ><template #cell-name="{ row }"
      ><span class="flex min-w-64 max-w-lg items-center gap-2.5"
        ><span class="flex shrink-0">
          <AdminCdnImage v-for="(src, i) in row.covers.slice(-3).reverse()" :key="src" :src="src" class="h-8 w-14 rounded object-cover ring-2 ring-white" :class="i ? '-ml-9' : ''" />
          <span v-if="!row.covers.length" class="h-8 w-14 rounded bg-slate-100" /></span
        ><span class="min-w-0"
          ><NuxtLink :to="`/admin/series/${row.id}`" class="block truncate font-medium text-slate-900 hover:underline" @click.stop>{{ row.name }}</NuxtLink
          ><span class="flex items-center gap-1.5 text-[11px] text-slate-400"
            ><span>{{ row.source === 'igdb' ? `IGDB #${row.igdb_collection_id}` : '手动' }}</span
            ><span v-if="!row.auto_update">· 已冻结</span
            ><span v-if="row.admin_edited_at">· 编辑过</span
            ><span v-if="row.needs_review" class="rounded bg-amber-50 px-1 text-amber-700" :title="SERIES_REVIEW_LABELS[row.review_reason]">待审核</span></span
          ></span
        ></span
      ></template
    ><template #cell-status="{ row }"
      ><span class="rounded px-1.5 py-0.5 text-[11px] font-medium" :class="STATUS_TONE[row.status]">{{ statusLabel(row.status) }}</span></template
    ><template #cell-stage_count="{ row }"
      ><span class="whitespace-nowrap tabular-nums text-slate-600">{{ row.stage_count }}<span v-if="row.side_count" class="text-slate-400"> + {{ row.side_count }} 外传</span></span></template
    ><template #cell-trophy_set_count="{ row }"
      ><span class="tabular-nums text-slate-600">{{ row.trophy_set_count }}</span></template
    ><template #cell-popularity="{ row }"
      ><span class="tabular-nums text-slate-600">{{ row.popularity.toLocaleString() }}</span></template
    ><template #cell-updated_at="{ row }"
      ><span class="whitespace-nowrap tabular-nums text-slate-600">{{ row.updated_at ? adminDate(row.updated_at) : '—' }}</span></template
    ><template #detail-actions="{ detail, refresh }"
      ><AdminSeriesPanel :detail="detail" :refresh="refresh" /></template
  ></AdminCollection>

  <Dialog v-model:open="createOpen" title="新建系列" size="sm">
    <form id="series-create" class="space-y-3 p-5" @submit.prevent="create">
      <label for="series-create-name" class="block text-xs font-medium text-slate-700">系列名</label>
      <input id="series-create-name" v-model="createName" maxlength="255" class="admin-input" placeholder="如 The Legend of Heroes: Trails" />
      <p class="text-xs text-slate-500">新建的系列是空的草稿，接着在编辑器里加阶段，再发布。手动系列不参与自动归类。</p>
      <AdminError :error="createError" />
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="createOpen = false">取消</button>
        <button type="submit" form="series-create" class="admin-button admin-primary" :disabled="creating || !createName.trim()">
          {{ creating ? '正在创建…' : '创建并编辑' }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
