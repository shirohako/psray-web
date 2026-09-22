<script setup lang="ts">
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'psnid', label: 'PSN ID' },
  { key: 'np_communication_id', label: '奖杯组' },
  { key: 'stage', label: '阶段' },
  { key: 'error_message', label: '错误' },
  { key: 'created_at', label: '发生时间' },
]
const filters = [
  { key: 'q', label: '关键词' },
  { key: 'psnid', label: 'PSN ID' },
  { key: 'np_communication_id', label: '奖杯组编号' },
  { key: 'stage', label: '失败阶段' },
  { key: 'from', label: '开始时间（UTC）', type: 'datetime-local' },
  { key: 'to', label: '结束时间（UTC）', type: 'datetime-local' },
]
</script>
<template>
  <AdminCollection
    title="同步异常"
    description="同步分项错误不一定表示整个队列任务失败。可关联账号和执行记录排查。"
    endpoint="/sync-failures"
    detail-base="/sync-failures"
    :columns="columns"
    :filters="filters"
    ><template #detail-actions="{ row }"
      ><div class="flex gap-2">
        <NuxtLink
          v-if="row.psnid"
          :to="{ path: '/admin/users', query: { q: row.psnid } }"
          class="admin-button"
          >用户资料</NuxtLink
        ><NuxtLink
          :to="{
            path: '/admin/queues',
            query: { tab: 'history', q: row.psnid || row.np_communication_id },
          }"
          class="admin-button"
          >队列记录</NuxtLink
        >
      </div></template
    ></AdminCollection
  >
</template>
