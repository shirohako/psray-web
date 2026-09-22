<script setup lang="ts">
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'actor_id', label: '管理员' },
  { key: 'action', label: '动作' },
  { key: 'subject', label: '对象' },
  { key: 'status', label: '结果' },
  { key: 'reason', label: '理由' },
  { key: 'created_at', label: '时间' },
]
const filters = [
  { key: 'actor_id', label: '管理员 ID' },
  { key: 'action', label: '动作' },
  { key: 'subject', label: '对象' },
  {
    key: 'status',
    label: '结果',
    options: ['success', 'failed', 'running'].map((value) => ({
      value,
      label: (
        { success: '成功', failed: '失败', running: '执行中' } as Record<
          string,
          string
        >
      )[value]!,
    })),
  },
  { key: 'from', label: '开始时间（UTC）', type: 'datetime-local' },
  { key: 'to', label: '结束时间（UTC）', type: 'datetime-local' },
]
</script>
<template>
  <AdminCollection
    title="操作审计"
    description="管理员操作、变更快照及异步执行结果。审计记录不可在后台修改或删除。"
    endpoint="/audit-logs"
    :columns="columns"
    :filters="filters"
  />
</template>
