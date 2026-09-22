<script setup lang="ts">
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'psnid', label: 'PSN ID' },
  { key: 'role', label: '角色' },
  { key: 'country', label: '地区' },
  { key: 'trophy_level', label: '等级' },
  { key: 'last_synced_at', label: '最近同步' },
  { key: 'registered_at', label: '注册时间' },
]
const filters = [
  { key: 'q', label: 'PSN ID / Account ID' },
  {
    key: 'registered',
    label: '注册情况',
    options: [
      { value: '1', label: '已注册' },
      { value: '0', label: '未注册' },
    ],
  },
  {
    key: 'penalty',
    label: '处罚状态',
    options: [
      { value: 'none', label: '无处罚' },
      { value: 'ranking_ban', label: '排名处罚' },
      { value: 'termination', label: '永久封禁' },
    ],
  },
]
</script>
<template>
  <AdminCollection
    title="用户"
    description="查询账号资料、同步状态与处罚历史。"
    endpoint="/users"
    detail-base="/users"
    :columns="columns"
    :filters="filters"
    ><template #detail-actions="{ row, refresh }"
      ><div class="flex flex-wrap gap-2">
        <NuxtLink
          :to="'/p/' + encodeURIComponent(row.psnid)"
          class="admin-button"
          >公开资料</NuxtLink
        ><NuxtLink
          :to="{ path: '/admin/sync-failures', query: { psnid: row.psnid } }"
          class="admin-button"
          >同步异常</NuxtLink
        ><NuxtLink
          :to="{ path: '/admin/penalties', query: { q: row.account_id } }"
          class="admin-button"
          >处罚记录</NuxtLink
        ><AdminPenaltyForm
          v-if="row.role !== 'admin'"
          :psnid="row.psnid"
          @done="refresh"
        /></div></template
  ></AdminCollection>
</template>
