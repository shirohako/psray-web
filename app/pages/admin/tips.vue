<script setup lang="ts">
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'user_id', label: '作者 ID' },
  { key: 'trophy_id', label: '奖杯 ID' },
  { key: 'language', label: '语言' },
  { key: 'content', label: '攻略内容' },
  { key: 'vote_up_count', label: '有帮助' },
  { key: 'created_at', label: '发布时间' },
]
const filters = [
  { key: 'q', label: '内容关键词' },
  { key: 'user_id', label: '作者 ID' },
  { key: 'trophy_id', label: '奖杯 ID' },
  { key: 'language', label: '语言' },
]
const removed = ref<number | null>(null)
function afterRemove(id: number, reload: () => Promise<unknown>, close: () => void) {
  removed.value = id
  close()
  void reload()
}
</script>
<template>
  <AdminCollection
    title="攻略管理"
    description="核对攻略内容后填写删除理由。删除同时维护投票和统计，审计保留内容快照。"
    endpoint="/tips"
    detail-base="/tips"
    :columns="columns"
    :filters="filters"
    ><template #detail-actions="{ row, reload, close }"
      ><div class="space-y-3">
        <p v-if="removed === row.id" class="text-sm text-emerald-700">
          攻略已删除，请刷新列表。
        </p>
        <AdminAction
          v-else
          :path="`/tips/${row.id}/remove`"
          label="删除违规攻略"
          description="将永久删除该攻略及其投票，并更新作者和奖杯计数。"
          danger
          @done="afterRemove(row.id, reload, close)"
        />
        <p class="text-xs text-slate-500">
          以下内容按原文安全显示，不执行 HTML。
        </p>
      </div></template
    ></AdminCollection
  >
</template>
