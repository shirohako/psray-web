<script setup lang="ts">
import { CircleCheck, Eye, EyeOff, Lock, LockOpen, PencilLine } from 'lucide'
import type { AdminSeriesDetail, AdminSeriesSummary } from '~/types/admin'
import { SERIES_REVIEW_LABELS } from '~/utils/adminSeries'

/**
 * Quick actions in the series list's detail drawer: publish / take down,
 * freeze automatic updates, mark as reviewed, and open the full editor.
 * None of these count as editing the structure.
 */
const props = defineProps<{ detail: AdminSeriesDetail; refresh: () => Promise<void> }>()

const api = useAdminApi()
const busy = ref(false)
const error = ref<any>(null)

async function patch(body: Partial<Pick<AdminSeriesSummary, 'status' | 'auto_update' | 'needs_review'>>) {
  busy.value = true
  error.value = null
  try {
    await api.write(`/series/${props.detail.id}`, body, 'patch')
    await props.refresh()
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-2">
      <NuxtLink :to="`/admin/series/${detail.id}`" class="admin-button admin-primary">
        <LucideIcon :icon="PencilLine" class="size-3.5" />打开编辑器
      </NuxtLink>
      <button v-if="detail.status !== 'published'" type="button" class="admin-button" :disabled="busy" @click="patch({ status: 'published' })">
        <LucideIcon :icon="Eye" class="size-3.5" />发布
      </button>
      <button v-else type="button" class="admin-button" :disabled="busy" @click="patch({ status: 'hidden' })">
        <LucideIcon :icon="EyeOff" class="size-3.5" />下架
      </button>
      <button type="button" class="admin-button" :disabled="busy" @click="patch({ auto_update: !detail.auto_update })">
        <LucideIcon :icon="detail.auto_update ? Lock : LockOpen" class="size-3.5" />{{ detail.auto_update ? '冻结自动归类' : '恢复自动归类' }}
      </button>
      <button v-if="detail.needs_review" type="button" class="admin-button" :disabled="busy" @click="patch({ needs_review: false })">
        <LucideIcon :icon="CircleCheck" class="size-3.5" />标为已审核
      </button>
    </div>
    <p v-if="detail.needs_review && detail.review_reason" class="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
      待审核：{{ SERIES_REVIEW_LABELS[detail.review_reason] }}
    </p>
    <AdminError :error="error" />
  </div>
</template>
