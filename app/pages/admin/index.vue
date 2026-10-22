<script setup lang="ts">
import type { AdminOverview } from '~/types/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi()
const data = ref<AdminOverview | null>(null)
const error = ref<any>(null),
  busy = ref(false)
async function refresh() {
  if (busy.value) return
  busy.value = true
  try {
    data.value = await api.get<AdminOverview>('/overview')
    error.value = null
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
onMounted(refresh)
useAdminPoll(refresh)
</script>
<template>
  <AdminError :error="error" />

  <div
    v-if="busy && !data"
    class="h-72 animate-pulse rounded-2xl bg-slate-100"
    aria-label="正在加载"
  />

  <template v-if="data">
    <AdminOverviewStatusHero :data="data" :busy="busy" @refresh="refresh" />

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <AdminOverviewQueueLoad :summary="data.queues" />
      <AdminOverviewQueueResults :counts="data.queue_results" />
    </div>

    <AdminOverviewRecentFailures :failures="data.recent_failures" />
  </template>
</template>
