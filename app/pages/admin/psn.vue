<script setup lang="ts">
import { Plug, Plus } from 'lucide'
import type { AdminPsnAccount, AdminPsnOverview, AdminPsnSaved } from '~/types/admin'
/**
 * "PSN 连接": the service accounts the PSN bridge signs in with (npsso), and the
 * bridge's own state. npsso expires roughly every two months and is replaced
 * here; the bridge picks the change up at once. API: docs/api/admin/psn.
 */
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi()

const data = ref<AdminPsnOverview | null>(null),
  error = ref<any>(null),
  busy = ref(false),
  actionError = ref<any>(null),
  busyId = ref<number | null>(null),
  reloading = ref(false),
  notice = ref('')

async function refresh() {
  busy.value = true
  error.value = null
  try {
    data.value = await api.get<AdminPsnOverview>('/psn')
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
onMounted(refresh)

// Add / replace npsso
const dialogOpen = ref(false),
  dialogAccount = ref<AdminPsnAccount | null>(null)
function openDialog(account: AdminPsnAccount | null) {
  dialogAccount.value = account
  dialogOpen.value = true
}
function afterSave(result: AdminPsnSaved) {
  notice.value = result.bridge_reloaded ? '' : '已保存，但 bridge 当时不可达；定时检查会补发重新加载。'
  refresh()
}

async function run(account: AdminPsnAccount, action: () => Promise<unknown>) {
  busyId.value = account.id
  actionError.value = null
  try {
    await action()
    await refresh()
  } catch (e) {
    actionError.value = e
  } finally {
    busyId.value = null
  }
}
const verify = (account: AdminPsnAccount) =>
  run(account, () => api.write(`/psn/accounts/${account.id}/verify`, {}))
const toggle = (account: AdminPsnAccount) =>
  run(account, () => api.write(`/psn/accounts/${account.id}`, { is_enabled: !account.is_enabled }, 'patch'))

// Delete, after a confirmation
const removing = ref<AdminPsnAccount | null>(null)
const removeOpen = computed({
  get: () => removing.value !== null,
  set: (v: boolean) => { if (!v) removing.value = null },
})
async function confirmRemove() {
  const account = removing.value
  if (!account) return
  removing.value = null
  await run(account, () => api.remove(`/psn/accounts/${account.id}`))
}

async function reload() {
  reloading.value = true
  actionError.value = null
  try {
    const result = await api.write<{ bridge_reloaded: boolean; ready: boolean }>('/psn/reload', {})
    notice.value = result.bridge_reloaded ? '' : 'bridge 不可达，没有重新加载。'
    await refresh()
  } catch (e) {
    actionError.value = e
  } finally {
    reloading.value = false
  }
}
</script>
<template>
  <AdminPageHeader
    :icon="Plug"
    title="PSN 连接"
    description="bridge 用这些 PSN 账号访问 PSN。npsso 大约两个月失效，在这里更换，bridge 立刻改用新的；限流等参数在系统设置的「PSN 访问」。"
  >
    <AdminRefresh :busy="busy" @click="refresh" />
    <button type="button" class="admin-button admin-primary" @click="openDialog(null)">
      <LucideIcon :icon="Plus" class="size-3.5" />添加账号
    </button>
  </AdminPageHeader>
  <AdminError :error="error" />
  <AdminError :error="actionError" />
  <p v-if="notice" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{{ notice }}</p>

  <div v-if="!data && busy" class="admin-panel space-y-3 p-4" aria-busy="true">
    <div v-for="i in 3" :key="i" class="h-9 animate-pulse rounded-md bg-slate-100" />
  </div>
  <div v-else-if="data" class="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
    <div class="min-w-0 space-y-4">
      <section class="admin-panel overflow-hidden">
        <header class="admin-panel-head"><h2 class="admin-panel-title">服务账号</h2></header>
        <AdminPsnAccountsTable
          :accounts="data.accounts"
          :busy-id="busyId"
          @replace="openDialog"
          @verify="verify"
          @toggle="toggle"
          @remove="removing = $event"
        />
      </section>
      <AdminPsnRecentErrors :errors="data.bridge.recent_errors ?? []" />
    </div>
    <AdminPsnStatusPanel :bridge="data.bridge" :reloading="reloading" @reload="reload" />
  </div>

  <AdminPsnAccountDialog v-model:open="dialogOpen" :account="dialogAccount" @saved="afterSave" />

  <Dialog v-model:open="removeOpen" size="md">
    <template #title>删除 PSN 账号</template>
    <p class="text-sm text-slate-600">
      删除「{{ removing?.label }}」后 bridge 不再使用它，缓存的会话一并丢弃。其他账号照常工作。
    </p>
    <div class="mt-4 flex justify-end gap-2">
      <button type="button" class="admin-button" @click="removing = null">取消</button>
      <button type="button" class="admin-button admin-danger" @click="confirmRemove">删除</button>
    </div>
  </Dialog>
</template>
