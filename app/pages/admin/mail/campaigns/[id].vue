<script setup lang="ts">
import { ArrowLeft, Ban, Megaphone, ScrollText } from 'lucide'
import { adminDate, MAIL_CATEGORY_LABELS, MAIL_LOCALES, MAIL_STATUSES, type MailCampaign } from '~/utils/admin'
/**
 * One campaign's progress: mails per status, refreshed every 5 s while it is
 * still sending, the copy that went out (a snapshot taken at the start) and
 * a cancel button for the part not sent yet.
 */
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi()
const route = useRoute()
const id = computed(() => Number(route.params.id))
const campaign = ref<MailCampaign | null>(null),
  error = ref<any>(null),
  busy = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
async function refresh() {
  busy.value = true
  try {
    campaign.value = await api.get<MailCampaign>(`/mail/campaigns/${id.value}`)
    error.value = null
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
onMounted(async () => {
  await refresh()
  timer = setInterval(() => {
    if (campaign.value?.status === 'sending' && !document.hidden) refresh()
  }, 5000)
})
onBeforeUnmount(() => clearInterval(timer))

const LOCALE_LABELS: Record<string, string> = Object.fromEntries(MAIL_LOCALES.map((l) => [l.value, l.label]))
const total = computed(() => campaign.value?.recipient_count ?? 0)
const finished = computed(() => {
  const p = campaign.value?.progress ?? {}
  return (p.sent ?? 0) + (p.failed ?? 0) + (p.skipped ?? 0) + (p.cancelled ?? 0)
})
const percent = computed(() => (total.value ? Math.min(100, Math.round((finished.value / total.value) * 100)) : 0))
const remainingMinutes = computed(() =>
  campaign.value ? Math.ceil((campaign.value.progress.queued ?? 0) / Math.max(1, campaign.value.per_minute)) : 0,
)

const cancelOpen = ref(false),
  cancelling = ref(false),
  cancelError = ref<any>(null)
async function cancel() {
  cancelling.value = true
  cancelError.value = null
  try {
    campaign.value = await api.write<MailCampaign>(`/mail/campaigns/${id.value}/cancel`, {})
    cancelOpen.value = false
  } catch (e) {
    cancelError.value = e
  } finally {
    cancelling.value = false
  }
}
</script>
<template>
  <AdminPageHeader
    :icon="Megaphone"
    :title="campaign?.name ?? '群发'"
    :description="campaign ? `${campaign.template_key} · ${MAIL_CATEGORY_LABELS[campaign.category]} · 发起人 ${campaign.created_by ?? '—'}` : undefined"
  >
    <NuxtLink to="/admin/mail/campaigns" class="admin-button"><LucideIcon :icon="ArrowLeft" class="size-3.5" />全部群发</NuxtLink>
    <NuxtLink v-if="campaign" :to="{ path: '/admin/mail/logs', query: { campaign_id: campaign.id } }" class="admin-button">
      <LucideIcon :icon="ScrollText" class="size-3.5" />逐封记录
    </NuxtLink>
    <button v-if="campaign?.status === 'sending'" type="button" class="admin-button admin-danger" @click="cancelOpen = true">
      <LucideIcon :icon="Ban" class="size-3.5" />取消剩余
    </button>
    <AdminRefresh :busy="busy" :live="campaign?.status === 'sending'" @click="refresh" />
  </AdminPageHeader>
  <AdminError :error="error" />
  <template v-if="campaign">
    <section class="admin-panel space-y-4 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <AdminStatus :value="campaign.status" />
        <span class="text-xs text-slate-500">
          开始 {{ adminDate(campaign.started_at) }}
          <template v-if="campaign.finished_at"> · 结束 {{ adminDate(campaign.finished_at) }}</template>
          <template v-else-if="campaign.status === 'sending'"> · 预计还要约 {{ remainingMinutes }} 分钟（{{ campaign.per_minute }} 封 / 分钟）</template>
        </span>
      </div>
      <div>
        <div class="h-2 overflow-hidden rounded-full bg-slate-100">
          <div class="h-full rounded-full bg-slate-900 transition-[width] duration-500" :style="{ width: `${percent}%` }" />
        </div>
        <p class="mt-1.5 text-xs tabular-nums text-slate-500">
          {{ finished.toLocaleString() }} / {{ total.toLocaleString() }} 已处理（{{ percent }}%）
          <template v-if="!campaign.dispatched_at && campaign.status === 'sending'"> · 正在拆分收件人…</template>
        </p>
      </div>
      <dl class="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div v-for="s in MAIL_STATUSES" :key="s.value" class="rounded-lg border border-slate-200 px-3 py-2">
          <dt class="text-xs text-slate-500">{{ s.label }}</dt>
          <dd class="mt-0.5 text-lg font-semibold tabular-nums" :class="s.value === 'failed' && campaign.progress.failed ? 'text-red-600' : 'text-slate-950'">
            {{ (campaign.progress[s.value] ?? 0).toLocaleString() }}
          </dd>
        </div>
      </dl>
      <p class="text-xs text-slate-500">
        「已跳过」是发送前关掉了这一类订阅的用户；「已发送」表示发信服务器已接收，之后的退信这里看不到。
      </p>
    </section>
    <section v-if="campaign.content_snapshot" class="admin-panel overflow-hidden">
      <header class="admin-panel-head"><h2 class="admin-panel-title">发出的文案（开始发送时的快照）</h2></header>
      <ul class="divide-y divide-slate-100">
        <li v-for="(content, locale) in campaign.content_snapshot" :key="locale" class="px-4 py-3 text-[13px]">
          <p class="text-xs font-medium text-slate-500">{{ LOCALE_LABELS[locale] ?? locale }}</p>
          <p class="mt-0.5 font-medium text-slate-900">{{ content.subject }}</p>
          <pre class="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] text-slate-600">{{ content.body }}</pre>
        </li>
      </ul>
    </section>
  </template>
  <Dialog v-model:open="cancelOpen" title="取消剩余的发送" size="md">
    <div class="space-y-3 p-5 text-[13px] text-slate-600">
      <p>
        还在排队的 <b class="text-slate-900">{{ (campaign?.progress.queued ?? 0).toLocaleString() }}</b> 封不再发送，已发出的
        {{ (campaign?.progress.sent ?? 0).toLocaleString() }} 封收不回。
      </p>
      <AdminError :error="cancelError" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="cancelOpen = false">不取消</button>
        <button type="button" class="admin-button admin-danger" :disabled="cancelling" @click="cancel">
          {{ cancelling ? '正在取消…' : '确认取消' }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
