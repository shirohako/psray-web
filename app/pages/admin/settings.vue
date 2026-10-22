<script setup lang="ts">
import { Settings } from 'lucide'
import type { SystemSettingGroup, SystemSettingsResponse } from '~/types/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi()
const groups = ref<SystemSettingGroup[] | null>(null),
  error = ref<any>(null),
  busy = ref(false)
async function refresh() {
  busy.value = true
  error.value = null
  try {
    groups.value = (await api.get<SystemSettingsResponse>('/settings')).groups
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
onMounted(refresh)
</script>
<template>
  <AdminPageHeader
    :icon="Settings"
    title="系统设置"
    description="后台填写的值优先于服务器的环境变量；改回环境变量即删除后台的值。修改即时生效，不用重启队列。"
  >
    <AdminRefresh :busy="busy" @click="refresh" />
  </AdminPageHeader>
  <AdminError :error="error" />
  <div v-if="!groups && busy" class="admin-panel space-y-3 p-4" aria-busy="true">
    <div v-for="i in 3" :key="i" class="h-9 animate-pulse rounded-md bg-slate-100" />
  </div>
  <div v-else-if="groups" class="space-y-4">
    <AdminSettingsGroup
      v-for="group in groups"
      :key="group.key"
      :group="group"
      @saved="(result) => (groups = result.groups)"
    >
      <template v-if="group.key === 'mail'" #actions="{ dirty }">
        <AdminMailTestButton :unsaved="dirty" />
      </template>
    </AdminSettingsGroup>
  </div>
</template>
