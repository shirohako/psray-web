<script setup lang="ts">
import { CircleCheck, CircleX, Send } from 'lucide'
import { MAIL_LOCALES, type MailLocale } from '~/utils/admin'
/**
 * "发送测试邮件" on the mail settings panel: sends one mail right away (no
 * queue) with the saved settings and shows the mailer's own error, if any.
 * `unsaved` warns that edits still in the form are not what gets tested.
 */
defineProps<{ unsaved?: boolean }>()
const api = useAdminApi()
const { user } = useAuth()
const open = ref(false),
  email = ref(''),
  locale = ref<MailLocale>('zh-Hans'),
  busy = ref(false),
  error = ref<any>(null),
  result = ref<{ ok: boolean; error: string | null; mailer: string; mail_log_id: number } | null>(null)
function start() {
  email.value = email.value || user.value?.email || ''
  error.value = null
  result.value = null
  open.value = true
}
async function send() {
  if (!email.value.trim() || busy.value) return
  busy.value = true
  error.value = null
  result.value = null
  try {
    result.value = await api.write('/mail/test', { email: email.value.trim(), locale: locale.value })
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <button type="button" class="admin-button" @click="start">
    <LucideIcon :icon="Send" class="size-3.5" />发送测试邮件
  </button>
  <Dialog v-model:open="open" title="发送测试邮件" size="md">
    <form id="admin-mail-test" class="space-y-4 p-5" @submit.prevent="send">
      <p class="text-[13px] leading-relaxed text-slate-600">
        用<b class="font-medium text-slate-800">已保存</b>的发信设置当场发一封测试邮件（不经队列），发信服务器的报错会原样显示在这里，也会记进邮件记录。
      </p>
      <p
        v-if="unsaved"
        class="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900"
      >
        设置里还有未保存的修改，测试用的是修改前的值。
      </p>
      <div class="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <div>
          <label for="admin-mail-test-email" class="mb-1.5 block text-xs font-medium text-slate-700">收件邮箱</label>
          <input
            id="admin-mail-test-email"
            v-model="email"
            type="email"
            required
            maxlength="255"
            autocomplete="email"
            placeholder="you@example.com"
            class="admin-input"
            :disabled="busy"
          />
        </div>
        <div>
          <label for="admin-mail-test-locale" class="mb-1.5 block text-xs font-medium text-slate-700">邮件语言</label>
          <SelectMenu id="admin-mail-test-locale" v-model="locale" :options="MAIL_LOCALES" size="sm" class="w-full" :disabled="busy" />
        </div>
      </div>
      <AdminError :error="error" />
      <div
        v-if="result"
        class="flex items-start gap-2.5 rounded-lg border p-3 text-[13px]"
        :class="result.ok ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900' : 'border-red-200 bg-red-50/60 text-red-900'"
      >
        <LucideIcon
          :icon="result.ok ? CircleCheck : CircleX"
          class="mt-px size-4 shrink-0"
          :class="result.ok ? 'text-emerald-600' : 'text-red-600'"
        />
        <div class="min-w-0 space-y-1">
          <p v-if="result.ok">发信服务器已接收，请到 {{ email }} 查收（也看看垃圾邮件箱）。</p>
          <p v-else>发送失败，没有发出去。</p>
          <p class="text-xs opacity-80">发信方式：{{ result.mailer }} · 邮件记录 #{{ result.mail_log_id }}</p>
          <pre
            v-if="result.error"
            class="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-white/70 p-2 font-mono text-[11px] text-red-800"
          >{{ result.error }}</pre>
        </div>
      </div>
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="open = false">关闭</button>
        <button form="admin-mail-test" class="admin-button admin-primary" :disabled="busy || !email.trim()">
          <LucideIcon :icon="Send" class="size-3.5" />{{ busy ? '正在发送…' : '发送' }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
