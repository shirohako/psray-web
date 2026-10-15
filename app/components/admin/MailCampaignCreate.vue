<script setup lang="ts">
import { CircleCheck, CircleX, Megaphone, RotateCw, Send, TriangleAlert } from 'lucide'
import {
  adminDuration,
  MAIL_CATEGORY_LABELS,
  MAIL_LOCALES,
  type MailCampaign,
  type MailCampaignPreview,
  type MailTemplateSummary,
} from '~/utils/admin'
/**
 * New campaign: pick a campaign template, look at who would get it (a dry
 * run: recipients, opt-outs, language split, who falls back to English),
 * send yourself a test, then confirm the count. Sent mail can't be recalled,
 * so the confirm box repeats the number.
 */
const emit = defineEmits<{ started: [campaign: MailCampaign] }>()
const api = useAdminApi()
const { user } = useAuth()
const open = ref(false),
  templates = ref<MailTemplateSummary[]>([]),
  templateId = ref<number | null>(null),
  preview = ref<MailCampaignPreview | null>(null),
  loading = ref(false),
  loadError = ref<any>(null),
  confirmed = ref(false),
  busy = ref(false),
  submitError = ref<any>(null)
const LOCALE_LABELS: Record<string, string> = Object.fromEntries(MAIL_LOCALES.map((l) => [l.value, l.label]))
const selected = computed(() => templates.value.find((t) => t.id === templateId.value) ?? null)

async function start() {
  open.value = true
  templateId.value = null
  preview.value = null
  confirmed.value = false
  submitError.value = null
  testResult.value = null
  loadError.value = null
  try {
    templates.value = (await api.get<MailTemplateSummary[]>('/mail/templates')).filter((t) => !t.is_system && t.locales.length)
  } catch (e) {
    loadError.value = e
  }
}
async function loadPreview() {
  if (!templateId.value) return
  loading.value = true
  loadError.value = null
  preview.value = null
  confirmed.value = false
  try {
    preview.value = await api.write<MailCampaignPreview>('/mail/campaigns', { template_id: templateId.value, dry_run: true })
  } catch (e) {
    loadError.value = e
  } finally {
    loading.value = false
  }
}
watch(templateId, loadPreview)

// --- Test send (uses the template's saved copy) --------------------------------
const testEmail = ref(''),
  testLocale = ref('zh-Hans'),
  testing = ref(false),
  testResult = ref<{ ok: boolean; error: string | null } | null>(null)
async function sendTest() {
  if (!templateId.value || testing.value) return
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await api.write(`/mail/templates/${templateId.value}/test`, {
      email: (testEmail.value || user.value?.email || '').trim(),
      locale: testLocale.value,
    })
  } catch (e: any) {
    testResult.value = { ok: false, error: e?.message ?? String(e) }
  } finally {
    testing.value = false
  }
}

async function submit() {
  if (!preview.value || !confirmed.value || busy.value) return
  busy.value = true
  submitError.value = null
  try {
    const campaign = await api.write<MailCampaign>('/mail/campaigns', { template_id: templateId.value, confirm: true })
    open.value = false
    emit('started', campaign)
  } catch (e) {
    submitError.value = e
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <button type="button" class="admin-button admin-primary" @click="start">
    <LucideIcon :icon="Megaphone" class="size-3.5" />新建群发
  </button>
  <Dialog v-model:open="open" title="新建群发" size="2xl">
    <div class="space-y-5 p-5">
      <div>
        <label for="mc-template" class="mb-1.5 block text-xs font-medium text-slate-700">群发模板</label>
        <select id="mc-template" v-model="templateId" class="admin-input" :disabled="busy">
          <option :value="null" disabled>选择一个群发模板</option>
          <option v-for="t in templates" :key="t.id" :value="t.id">
            {{ t.name }} · {{ MAIL_CATEGORY_LABELS[t.category] }} · {{ t.locales.join(' / ') }}
          </option>
        </select>
        <p class="mt-1.5 text-xs text-slate-500">
          只列出已有文案的群发模板。需要新内容先到
          <NuxtLink to="/admin/mail/templates" class="underline">邮件模板</NuxtLink> 新建；系统模板（验证码等）不能群发。
        </p>
      </div>
      <AdminError :error="loadError" />
      <div v-if="loading" class="h-0.5 overflow-hidden rounded-full bg-slate-100">
        <div class="animate-admin-progress h-full w-1/3 bg-slate-900" />
      </div>

      <template v-if="preview && selected">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-slate-200 p-4 text-[13px] sm:grid-cols-4">
          <div>
            <dt class="text-xs text-slate-500">会收到</dt>
            <dd class="mt-0.5 text-xl font-semibold tabular-nums text-slate-950">{{ preview.recipients.toLocaleString() }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">关闭了{{ MAIL_CATEGORY_LABELS[selected.category] }}</dt>
            <dd class="mt-0.5 text-xl font-semibold tabular-nums text-slate-500">{{ preview.unsubscribed.toLocaleString() }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">注册用户</dt>
            <dd class="mt-0.5 text-xl font-semibold tabular-nums text-slate-500">{{ preview.registered.toLocaleString() }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">预计耗时</dt>
            <dd class="mt-0.5 text-[13px] font-medium text-slate-800">
              约 {{ adminDuration(preview.estimated_minutes * 60_000) }}
              <span class="block text-xs font-normal text-slate-400">{{ preview.per_minute }} 封 / 分钟</span>
            </dd>
          </div>
        </dl>
        <table class="w-full text-left text-[13px]">
          <thead class="text-xs text-slate-500">
            <tr class="border-b border-slate-200">
              <th class="py-1.5 font-medium">收件人的语言</th>
              <th class="py-1.5 text-right font-medium">人数</th>
              <th class="py-1.5 pl-4 font-medium">收到的版本</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="l in preview.locales" :key="l.locale" :class="l.recipients ? '' : 'text-slate-400'">
              <td class="py-1.5">{{ LOCALE_LABELS[l.locale] }}</td>
              <td class="py-1.5 text-right tabular-nums">{{ l.recipients.toLocaleString() }}</td>
              <td class="py-1.5 pl-4">
                <span v-if="l.has_translation">{{ LOCALE_LABELS[l.locale] }}</span>
                <span v-else :class="l.recipients ? 'font-medium text-amber-700' : ''">缺翻译，收{{ LOCALE_LABELS[l.sent_in ?? ''] ?? '—' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="preview.fallback_recipients" class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900">
          <LucideIcon :icon="TriangleAlert" class="mt-px size-4 shrink-0 text-amber-600" />
          {{ preview.fallback_recipients.toLocaleString() }} 人的语言没有翻译，会收到回落的版本。需要的话先去模板补齐。
        </p>

        <section class="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <h3 class="mb-2 text-[13px] font-semibold text-slate-900">先给自己发一封看看</h3>
          <div class="flex flex-wrap gap-2">
            <input v-model="testEmail" type="email" :placeholder="user?.email ?? '收件邮箱'" class="admin-input w-56 flex-1" :disabled="testing" />
            <select v-model="testLocale" class="admin-input w-32" :disabled="testing">
              <option v-for="l in MAIL_LOCALES" :key="l.value" :value="l.value">{{ l.label }}</option>
            </select>
            <button type="button" class="admin-button" :disabled="testing || !(testEmail || user?.email)" @click="sendTest">
              <LucideIcon :icon="testing ? RotateCw : Send" class="size-3.5" :class="testing && 'animate-spin'" />发送测试
            </button>
          </div>
          <p v-if="testResult" class="mt-2 flex items-start gap-1.5 text-xs" :class="testResult.ok ? 'text-emerald-700' : 'text-red-700'">
            <LucideIcon :icon="testResult.ok ? CircleCheck : CircleX" class="mt-px size-3.5 shrink-0" />
            <span class="break-all">{{ testResult.ok ? '已发送，请查收。测试邮件没有收件用户，所以没有退订链接。' : `发送失败：${testResult.error}` }}</span>
          </p>
        </section>

        <label class="flex cursor-pointer items-start gap-2 rounded-lg border border-red-200 bg-red-50/40 p-4 text-[13px] text-slate-700">
          <input v-model="confirmed" type="checkbox" class="mt-0.5 size-4 accent-red-600" :disabled="busy || !preview.recipients" />
          <span>
            确认把「{{ selected.name }}」发给 <b class="text-red-700">{{ preview.recipients.toLocaleString() }}</b> 位用户。
            开始后可以取消还没发出的部分，已发出的收不回。同一时间只能有一个群发在发送。
          </span>
        </label>
        <AdminError :error="submitError" />
      </template>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="open = false">取消</button>
        <button type="button" class="admin-button admin-danger" :disabled="!confirmed || busy || !preview?.recipients" @click="submit">
          {{ busy ? '正在开始…' : `开始群发（${(preview?.recipients ?? 0).toLocaleString()} 人）` }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
