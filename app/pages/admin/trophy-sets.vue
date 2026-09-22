<script setup lang="ts">
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '奖杯组' },
  { key: 'np_communication_id', label: 'PSN 编号' },
  { key: 'platform', label: '平台' },
  { key: 'version', label: '版本' },
  { key: 'updated_at', label: '最近更新' },
]
const filters = [
  { key: 'q', label: '名称 / PSN 编号' },
  {
    key: 'platform',
    label: '平台',
    options: ['PS5', 'PS4', 'PS3', 'PSVITA'].map((value) => ({
      value,
      label: value,
    })),
  },
]
const cardBase = useRuntimeConfig().public.cardBase
</script>
<template>
  <AdminCollection
    title="奖杯数据"
    description="查询奖杯定义、统计与翻译覆盖；本页不修改原始奖杯数据。"
    endpoint="/trophy-sets"
    detail-base="/trophy-sets"
    :columns="columns"
    :filters="filters"
    ><template #detail-actions="{ row }"
      ><div class="flex gap-2">
        <NuxtLink :to="'/trophies/' + row.id" class="admin-button"
          >公开页面</NuxtLink
        ><NuxtLink
          :to="{
            path: '/admin/sync-failures',
            query: { np_communication_id: row.np_communication_id },
          }"
          class="admin-button"
          >同步异常</NuxtLink
        ><a
          :href="`${cardBase}/card/trophies/${row.id}.png`"
          target="_blank"
          rel="noopener"
          class="admin-button"
          >分享卡片</a
        >
      </div></template
    ></AdminCollection
  >
</template>
