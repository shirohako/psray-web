<script setup lang="ts">
import { Ban } from 'lucide'
import { adminDate, PENALTY_LEVELS } from '~/utils/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const collection = ref<{ refresh: () => Promise<void> }>()
const columns = [
  { key: 'id', label: '处罚 ID', mono: true },
  { key: 'psnid', label: 'PSN ID' },
  { key: 'account_id', label: 'Account ID', mono: true },
  { key: 'level', label: '等级' },
  { key: 'source', label: '来源' },
  { key: 'moderator', label: '执行人' },
  { key: 'evidence_count', label: '证据' },
  { key: 'data_purged_at', label: '数据清理' },
  { key: 'banned_at', label: '处罚时间' },
]
const filters = [
  { key: 'q', label: 'PSN ID / Account ID' },
  {
    key: 'level',
    label: '等级',
    options: PENALTY_LEVELS.map((l) => ({ value: l.value, label: l.label })),
  },
]
</script>
<template>
  <AdminCollection
    ref="collection"
    :icon="Ban"
    title="反作弊"
    description="生效中的处罚，新的在前；已撤销的不列出，同一账号的多条处罚各占一行。PSN ID 为处罚时记录的名称，对方改名后处罚仍按 Account ID 生效。"
    endpoint="/bans"
    :columns="columns"
    :filters="filters"
    ><template #toolbar
      ><AdminBanUser @done="collection?.refresh()" /></template
    ><template #cell-moderator="{ row }"
      ><span
        :class="row.moderator ? 'text-slate-700' : 'text-slate-400'"
        >{{ row.moderator?.psnid ?? '—' }}</span
      ></template
    ><template #cell-evidence_count="{ row }"
      ><span
        class="tabular-nums"
        :class="row.evidence_count ? 'text-slate-700' : 'text-slate-400'"
        >{{ row.evidence_count ? `${row.evidence_count} 组` : '—' }}</span
      ></template
    ><template #cell-data_purged_at="{ row }"
      ><span v-if="row.level !== 'termination'" class="text-slate-400"
        >—</span
      ><span
        v-else-if="row.data_purged_at"
        class="text-slate-700"
        :title="adminDate(row.data_purged_at)"
        >已完成</span
      ><span v-else class="font-medium text-amber-700">未完成</span></template
    ><template #detail-actions="{ row, reload, close }"
      ><div
        v-if="row.level === 'termination' && !row.data_purged_at"
        class="space-y-2"
      >
        <p
          class="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900"
        >
          永久停用已生效，但数据清理没有完成。重新提交同一 PSN ID
          的永久停用会沿用原处罚并重试清理。
        </p>
        <AdminBanUser
          :key="row.id"
          :psnid="row.psnid"
          @done="
            () => {
              close()
              reload()
            }
          "
        /></div></template
  ></AdminCollection>
</template>
