<script setup lang="ts">
import { Database } from 'lucide'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
</script>
<template>
  <AdminPageHeader
    :icon="Database"
    title="用户数据"
    description="按 PSN ID 维护指定用户在本站的数据。每项操作先预览再执行。"
  />
  <AdminSyncReset />
</template>
