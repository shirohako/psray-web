<script setup lang="ts">
import { Trophy } from 'lucide'
import { adminDate, TROPHY_SET_SORT_OPTIONS } from '~/utils/admin'
import type { AdminFilter } from '~/types/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const columns = [
  { key: 'id', label: 'ID', mono: true },
  { key: 'name', label: '奖杯组' },
  { key: 'platform', label: '平台' },
  { key: 'defined_trophies', label: '奖杯数' },
  { key: 'owners', label: '玩家' },
  { key: 'updated_at', label: '最近更新' },
]
const filters: AdminFilter[] = [
  { key: 'q', label: '标题 / NPWR / #ID' },
  { key: 'sort', label: '排序', options: TROPHY_SET_SORT_OPTIONS },
]
// Rendered by the panel itself; the generic field list below it keeps the rest.
const detailOmit = ['name', 'icon_url', 'platform', 'version', 'defined_trophies', 'groups', 'trophies']
const total = (counts: Record<string, number> | null) =>
  counts ? (counts.platinum ?? 0) + (counts.gold ?? 0) + (counts.silver ?? 0) + (counts.bronze ?? 0) : 0
</script>
<template>
  <AdminCollection
    :icon="Trophy"
    title="奖杯组"
    description="库里的奖杯组和它们的图片（索尼 CDN）。旧图片地址会失效，列表里标红的就是加载不出来的；打开详情可以从 PSN 重新拉取，换成新地址。"
    endpoint="/trophy-sets"
    detail-base="/trophy-sets"
    :columns="columns"
    :filters="filters"
    :detail-omit="detailOmit"
    ><template #cell-name="{ row }"
      ><span class="flex min-w-56 max-w-md items-center gap-2.5"
        ><AdminCdnImage :src="row.icon_url" :class="row.platform.includes('PS5') ? 'size-8' : 'h-8 w-[58px]'" /><span class="min-w-0"
          ><span class="block truncate font-medium text-slate-900">{{ row.name }}</span
          ><span class="block font-mono text-[11px] text-slate-400">{{ row.np_communication_id }}</span></span
        ></span
      ></template
    ><template #cell-platform="{ row }"
      ><span class="whitespace-nowrap text-slate-600">{{ row.platform.join(' / ') || '—' }}</span></template
    ><template #cell-defined_trophies="{ row }"
      ><span class="whitespace-nowrap tabular-nums text-slate-600">{{ total(row.defined_trophies) }}</span></template
    ><template #cell-owners="{ row }"
      ><span class="tabular-nums text-slate-600">{{ row.owners.toLocaleString() }}</span></template
    ><template #cell-updated_at="{ row }"
      ><span class="whitespace-nowrap tabular-nums text-slate-600">{{ row.updated_at ? adminDate(row.updated_at) : '—' }}</span></template
    ><template #detail-actions="{ detail, refresh }"
      ><AdminTrophySetPanel :detail="detail" :refresh="refresh" /></template
  ></AdminCollection>
</template>
