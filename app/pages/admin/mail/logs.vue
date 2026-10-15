<script setup lang="ts">
import { Mail } from 'lucide'
import {
  MAIL_CATEGORIES,
  MAIL_CATEGORY_LABELS,
  MAIL_LOCALES,
  MAIL_STATUSES,
  type MailLogRecord,
} from '~/utils/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const columns = [
  { key: 'id', label: 'ID', mono: true },
  { key: 'status', label: '状态' },
  { key: 'to_email', label: '收件人' },
  { key: 'template_name', label: '模板' },
  { key: 'subject', label: '主题' },
  { key: 'category', label: '分类' },
  { key: 'locale', label: '语言' },
  { key: 'created_at', label: '时间' },
]
const filters = [
  { key: 'q', label: '收件邮箱 / 主题 / PSN ID' },
  { key: 'status', label: '状态', options: [...MAIL_STATUSES] },
  { key: 'category', label: '分类', options: MAIL_CATEGORIES.map((c) => ({ value: c.value, label: c.label })) },
  { key: 'from', label: '开始时间', type: 'datetime-local' },
  { key: 'to', label: '结束时间', type: 'datetime-local' },
]
const LOCALE_LABELS: Record<string, string> = Object.fromEntries(MAIL_LOCALES.map((l) => [l.value, l.label]))
const SKIP_REASONS: Record<string, string> = { unsubscribed: '收件人关闭了这一类邮件' }
</script>
<template>
  <AdminCollection
    :icon="Mail"
    title="邮件记录"
    description="每封邮件一行，新的在前。主题与正文是发送时实际渲染的内容，验证码已打码；正文 90 天后清空，记录 1 年后删除。「已发送」表示发信服务器已接收，之后的退信这里看不到。"
    endpoint="/mail/logs"
    detail-base="/mail/logs"
    :columns="columns"
    :filters="filters"
    :detail-omit="['body_html']"
    ><template #cell-to_email="{ row }"
      ><span class="block truncate text-slate-800">{{ row.to_email }}</span
      ><span v-if="row.psnid" class="block truncate text-xs text-slate-400">{{ row.psnid }}</span></template
    ><template #cell-template_name="{ row }"
      ><span class="block truncate text-slate-700">{{ row.template_name ?? row.template_key }}</span
      ><span v-if="row.campaign_id" class="block font-mono text-[11px] text-slate-400">群发 #{{ row.campaign_id }}</span></template
    ><template #cell-category="{ row }"
      ><span class="text-slate-600">{{ MAIL_CATEGORY_LABELS[row.category as keyof typeof MAIL_CATEGORY_LABELS] ?? row.category }}</span></template
    ><template #cell-locale="{ row }"
      ><span class="text-slate-600">{{ LOCALE_LABELS[row.locale] ?? row.locale }}</span></template
    ><template #detail-actions="{ detail }"
      ><div v-if="detail" class="space-y-3">
        <p
          v-if="(detail as MailLogRecord).status === 'skipped'"
          class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[13px] text-slate-700"
        >
          没有发送：{{ SKIP_REASONS[(detail as MailLogRecord).skip_reason ?? ''] ?? (detail as MailLogRecord).skip_reason }}。
        </p>
        <div
          v-if="(detail as MailLogRecord).error"
          class="rounded-lg border border-red-200 bg-red-50/60 p-3 text-[13px] text-red-900"
        >
          <p class="mb-1 font-medium">最近一次的错误（第 {{ (detail as MailLogRecord).attempts }} 次尝试）</p>
          <pre class="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">{{ (detail as MailLogRecord).error }}</pre>
        </div>
        <section v-if="(detail as MailLogRecord).body_html" class="overflow-hidden rounded-lg border border-slate-200">
          <h3 class="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            邮件正文（发送时的渲染结果，验证码已打码）
          </h3>
          <!-- sandbox without allow-scripts: the stored HTML can never run code here. -->
          <iframe
            :srcdoc="(detail as MailLogRecord).body_html ?? ''"
            sandbox=""
            referrerpolicy="no-referrer"
            title="邮件正文"
            class="h-[28rem] w-full bg-white"
          />
        </section>
        <p v-else-if="(detail as MailLogRecord).status === 'sent'" class="text-xs text-slate-400">
          正文已按保留期清空。
        </p>
      </div></template
  ></AdminCollection>
</template>
