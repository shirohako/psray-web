<script setup lang="ts">
import { Megaphone } from 'lucide'
import { adminCampaignFinished, MAIL_CATEGORY_LABELS } from '~/utils/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const columns = [
  { key: 'id', label: 'ID', mono: true },
  { key: 'name', label: '群发' },
  { key: 'status', label: '状态' },
  { key: 'progress', label: '进度' },
  { key: 'category', label: '分类' },
  { key: 'created_by', label: '发起人' },
  { key: 'started_at', label: '开始时间' },
]
</script>
<template>
  <AdminCollection
    :icon="Megaphone"
    title="群发邮件"
    description="把一个群发模板发给所有开着对应订阅的注册用户，按系统设置里的速率逐封发送，同一时间只能有一个群发在发送。每封的结果在邮件记录里。"
    endpoint="/mail/campaigns"
    :columns="columns"
    poll
    ><template #toolbar
      ><AdminMailCampaignCreate @started="(c) => navigateTo(`/admin/mail/campaigns/${c.id}`)" /></template
    ><template #cell-name="{ row }"
      ><NuxtLink :to="`/admin/mail/campaigns/${row.id}`" class="font-medium text-slate-900 hover:underline" @click.stop>{{ row.name }}</NuxtLink
      ><span class="block font-mono text-[11px] text-slate-400">{{ row.template_key }}</span></template
    ><template #cell-progress="{ row }"
      ><span class="block min-w-32">
        <span class="block h-1.5 overflow-hidden rounded-full bg-slate-100">
          <span
            class="block h-full rounded-full bg-slate-900 transition-[width]"
            :style="{ width: row.recipient_count ? `${Math.min(100, (adminCampaignFinished(row.progress) / row.recipient_count) * 100)}%` : '0%' }"
          />
        </span>
        <span class="mt-1 block text-xs tabular-nums text-slate-500"
          >{{ (row.progress.sent ?? 0).toLocaleString() }} / {{ row.recipient_count.toLocaleString() }} 已发送<template v-if="row.progress.failed"
            > · <span class="text-red-600">{{ row.progress.failed }} 失败</span></template
          ></span
        >
      </span></template
    ><template #cell-category="{ row }"
      ><span class="text-slate-600">{{ MAIL_CATEGORY_LABELS[row.category as keyof typeof MAIL_CATEGORY_LABELS] }}</span></template
    ><template #detail-actions="{ row }"
      ><NuxtLink :to="`/admin/mail/campaigns/${row.id}`" class="admin-button">打开进度页</NuxtLink></template
  ></AdminCollection>
</template>
