<script setup lang="ts">
import { Clock, Inbox, List, MessagesSquare } from 'lucide'
import {
  FEEDBACK_STATUS_OPTIONS,
  FEEDBACK_TYPE_LABELS,
  FEEDBACK_TYPE_OPTIONS,
  FEEDBACK_VISIBILITY_LABELS,
  FEEDBACK_VISIBILITY_OPTIONS,
} from '~/utils/admin'
import type { AdminFilter } from '~/types/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const route = useRoute(),
  router = useRouter()
const { summary, refresh: refreshSummary } = useAdminFeedbackSummary()
onMounted(refreshSummary)
const tabs = [
  { id: 'pending', name: '待审核', icon: Inbox, count: 'pending' },
  { id: 'awaiting', name: '待回复', icon: Clock, count: 'awaiting' },
  { id: 'all', name: '全部反馈', icon: List, count: null },
] as const
const tab = computed(() =>
  tabs.some((item) => item.id === route.query.tab) ? String(route.query.tab) : 'pending',
)
const columns = [
  { key: 'id', label: 'ID', mono: true },
  { key: 'author', label: '作者' },
  { key: 'content', label: '内容' },
  { key: 'type', label: '类型' },
  { key: 'status', label: '状态' },
  { key: 'visibility', label: '可见性' },
  { key: 'reply_count', label: '回复' },
  { key: 'last_activity_at', label: '最后活动' },
]
const filters = computed<AdminFilter[]>(() => [
  { key: 'q', label: '搜索正文或访客昵称' },
  { key: 'psnid', label: 'PSN ID' },
  { key: 'type', label: '类型', options: FEEDBACK_TYPE_OPTIONS },
  { key: 'status', label: '状态', options: FEEDBACK_STATUS_OPTIONS },
  ...(tab.value === 'all' ? [{ key: 'visibility', label: '可见性', options: FEEDBACK_VISIBILITY_OPTIONS }] : []),
  { key: 'author', label: '作者', options: [{ value: 'user', label: '登录用户' }, { value: 'guest', label: '访客' }] },
  { key: 'from', label: '开始时间', type: 'datetime-local' },
  { key: 'to', label: '结束时间', type: 'datetime-local' },
])
// Rendered by the panel itself; the generic field list below it keeps the rest.
const detailOmit = ['content', 'image_urls', 'replies', 'context', 'user', 'user_agent', 'notifies_author', 'author', 'psnid', 'guest_name', 'ip_address', 'reviewed_by', 'reviewed_at']
const VISIBILITY_TONE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  public: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  hidden: 'bg-slate-100 text-slate-500 ring-slate-200',
}
</script>
<template>
  <AdminPageHeader
    :icon="MessagesSquare"
    title="用户反馈"
    description="访客的反馈要审核通过才公开，登录用户的直接公开。官方回复会以你的账号显示在前台，并给登录作者发邮件。"
  />
  <div>
    <div class="admin-panel rounded-b-none px-4">
      <div class="admin-utabs" role="tablist" aria-label="反馈视图">
        <button
          v-for="item in tabs"
          :key="item.id"
          role="tab"
          class="admin-utab"
          :aria-selected="tab === item.id"
          @click="router.replace({ query: { tab: item.id } })"
        >
          <LucideIcon :icon="item.icon" class="size-4" />{{ item.name }}
          <span v-if="item.count && summary" class="admin-count" :class="summary[item.count] ? '!bg-amber-100 !text-amber-800' : ''">{{ summary[item.count] }}</span>
        </button>
      </div>
    </div>
    <AdminCollection
      :key="tab"
      title="用户反馈"
      embedded
      :endpoint="`/feedback?view=${tab}`"
      detail-base="/feedback"
      :columns="columns"
      :filters="filters"
      :detail-omit="detailOmit"
      ><template #cell-author="{ row }"
        ><span v-if="row.author === 'user'" class="block max-w-40 truncate font-medium text-slate-900">{{ row.psnid ?? `#${row.user_id}` }}</span
        ><span v-else class="block max-w-40 truncate text-slate-700"
          >{{ row.guest_name || '访客' }}<span class="ml-1 rounded border border-dashed border-slate-300 px-1 text-[10px] font-semibold text-slate-500">访客</span></span
        ></template
      ><template #cell-content="{ row }"
        ><span class="line-clamp-2 min-w-48 max-w-md break-words text-slate-700" :title="row.content">{{ row.content }}</span></template
      ><template #cell-type="{ row }"
        ><span class="whitespace-nowrap text-slate-600">{{ FEEDBACK_TYPE_LABELS[row.type] ?? row.type }}</span></template
      ><template #cell-visibility="{ row }"
        ><span class="whitespace-nowrap rounded px-1.5 py-px text-[11px] font-semibold ring-1 ring-inset" :class="VISIBILITY_TONE[row.visibility]">{{
          FEEDBACK_VISIBILITY_LABELS[row.visibility] ?? row.visibility
        }}</span></template
      ><template #cell-reply_count="{ row }"
        ><span class="whitespace-nowrap tabular-nums text-slate-700"
          >{{ row.reply_count
          }}<span v-if="row.awaiting_reply && row.visibility === 'public'" class="ml-1.5 rounded bg-amber-50 px-1 text-[10px] font-semibold text-amber-700">待回复</span></span
        ></template
      ><template #detail-actions="{ detail, refresh, reload, close }"
        ><AdminFeedbackPanel :detail="detail" :refresh="refresh" :reload="reload" :close="close" @changed="refreshSummary" /></template
    ></AdminCollection>
  </div>
</template>
