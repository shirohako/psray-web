<script setup lang="ts">
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const list = ref<any>(null)
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'psnid', label: 'PSN ID' },
  { key: 'penalty_level', label: '处罚' },
  { key: 'reason_description', label: '理由' },
  { key: 'moderator_user_id', label: '执行人' },
  { key: 'created_at', label: '处罚时间' },
  { key: 'revoked_at', label: '撤销时间' },
  { key: 'data_purged_at', label: '清理完成' },
]
const filters = [
  { key: 'q', label: 'PSN ID / Account ID' },
  {
    key: 'penalty_level',
    label: '类型',
    options: [
      { value: 'ranking_ban', label: '排名处罚' },
      { value: 'termination', label: '永久封禁' },
    ],
  },
  {
    key: 'active',
    label: '有效状态',
    options: [
      { value: '1', label: '生效中' },
      { value: '0', label: '已撤销' },
    ],
  },
]
</script>
<template>
  <AdminCollection
    ref="list"
    title="处罚"
    description="永久处罚按 Account ID 生效。撤销排名处罚后，名次由下次排名任务恢复。"
    endpoint="/penalties"
    detail-base="/penalties"
    :columns="columns"
    :filters="filters"
    ><template #toolbar><AdminPenaltyForm @done="list?.refresh()" /></template
    ><template #detail-actions="{ detail, refresh }"
      ><div v-if="detail?.penalty" class="space-y-3">
        <div class="flex flex-wrap gap-2">
          <AdminAction
            v-if="
              detail.penalty.penalty_level === 'ranking_ban' &&
              !detail.penalty.revoked_at
            "
            :path="`/penalties/${detail.penalty.id}/revoke`"
            label="撤销排名处罚"
            description="只撤销这条处罚，其他有效处罚继续生效。"
            @done="refresh"
          /><AdminAction
            v-if="
              detail.penalty.penalty_level === 'termination' &&
              !detail.penalty.revoked_at &&
              !detail.penalty.data_purged_at &&
              !['queued', 'running'].includes(detail.operation?.status)
            "
            :path="`/penalties/${detail.penalty.id}/retry-cleanup`"
            label="重试数据清理"
            description="处罚保持生效，只重新执行尚未完成的数据清理。"
            @done="refresh"
          /><button class="admin-button" @click="refresh">刷新清理状态</button>
        </div>
        <p
          v-if="
            detail.penalty.penalty_level === 'termination' &&
            !detail.penalty.revoked_at
          "
          class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
        >
          永久封禁已生效。清理状态：<AdminStatus
            :value="
              detail.penalty.data_purged_at
                ? 'success'
                : detail.operation?.status || 'unknown'
            "
          />
        </p></div></template
  ></AdminCollection>
</template>
