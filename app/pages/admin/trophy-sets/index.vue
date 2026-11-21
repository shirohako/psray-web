<script setup lang="ts">
import { Link2, Trophy } from 'lucide'
import { adminDate, TROPHY_SET_SORT_OPTIONS } from '~/utils/admin'
import { TROPHY_SET_GAME_FILTERS } from '~/utils/adminTrophySet'
import type { AdminFilter } from '~/types/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const columns = [
  { key: 'id', label: 'ID', mono: true },
  { key: 'name', label: '奖杯组' },
  { key: 'platform', label: '平台' },
  { key: 'game_id', label: '游戏' },
  { key: 'defined_trophies', label: '奖杯数' },
  { key: 'owners', label: '玩家' },
  { key: 'updated_at', label: '最近更新' },
]
const filters: AdminFilter[] = [
  { key: 'q', label: '标题 / NPWR / #ID' },
  { key: 'game', label: '游戏', options: TROPHY_SET_GAME_FILTERS },
  { key: 'overridden', label: '人工修改', options: [{ value: '1', label: '有人工修改' }, { value: '0', label: '全部跟随 PSN' }] },
  { key: 'sort', label: '排序', options: TROPHY_SET_SORT_OPTIONS },
]
// Drawer: the panel shows everything (no generic field list); refresh state is shared with its footer.
const psnRefresh = useAdminTrophySetRefresh()
const total = (counts: Record<string, number> | null) =>
  counts ? (counts.platinum ?? 0) + (counts.gold ?? 0) + (counts.silver ?? 0) + (counts.bronze ?? 0) : 0
</script>
<template>
  <AdminCollection
    :icon="Trophy"
    title="奖杯组"
    description="库里的奖杯组和它们的图片（索尼 CDN）。旧图片地址会失效，打开详情可以从 PSN 重新拉取；在编辑页改过的标题、描述、图标会保留，PSN 同步不再覆盖。"
    endpoint="/trophy-sets"
    detail-base="/trophy-sets"
    :columns="columns"
    :filters="filters"
    hide-detail-data
    ><template #cell-name="{ row }"
      ><span class="flex min-w-56 max-w-md items-center gap-2.5"
        ><AdminCdnImage :src="row.icon_url" :class="row.platform.includes('PS5') ? 'size-8' : 'h-8 w-[58px]'" /><span class="min-w-0"
          ><NuxtLink :to="`/admin/trophy-sets/${row.id}`" class="block truncate font-medium text-slate-900 hover:underline" @click.stop>{{ row.name }}</NuxtLink
          ><span class="block font-mono text-[11px] text-slate-400">{{ row.np_communication_id }}</span></span
        ></span
      ></template
    ><template #cell-platform="{ row }"
      ><span class="whitespace-nowrap text-slate-600">{{ row.platform.join(' / ') || '—' }}</span></template
    ><template #cell-game_id="{ row }"
      ><NuxtLink v-if="row.game_id" :to="`/admin/games/${row.game_id}`" class="inline-flex items-center gap-1 whitespace-nowrap text-slate-600 hover:underline" @click.stop
        >#{{ row.game_id }}<LucideIcon v-if="row.game_link_manual" :icon="Link2" class="size-3 text-amber-600" title="人工指定" /></NuxtLink
      ><span v-else-if="row.game_link_manual" class="rounded-full bg-amber-50 px-1.5 py-px text-[11px] font-semibold text-amber-700">人工取消</span
      ><span v-else class="text-slate-300">—</span></template
    ><template #cell-defined_trophies="{ row }"
      ><span class="whitespace-nowrap tabular-nums text-slate-600">{{ total(row.defined_trophies) }}</span></template
    ><template #cell-owners="{ row }"
      ><span class="tabular-nums text-slate-600">{{ row.owners.toLocaleString() }}</span></template
    ><template #cell-updated_at="{ row }"
      ><span class="whitespace-nowrap tabular-nums text-slate-600">{{ row.updated_at ? adminDate(row.updated_at) : '—' }}</span></template
    ><template #detail-actions="{ detail }"
      ><AdminTrophySetPanel :detail="detail" :refresh-result="psnRefresh.resultFor(detail.id)" :refresh-error="psnRefresh.errorFor(detail.id)" /></template
    ><template #detail-footer="{ detail, refresh }"
      ><AdminTrophySetDrawerFooter
        v-model:localize="psnRefresh.localize.value"
        :detail="detail"
        :busy="psnRefresh.busy.value"
        @refresh="psnRefresh.run(detail.id, refresh)" /></template
  ></AdminCollection>
</template>
