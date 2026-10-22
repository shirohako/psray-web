<script setup lang="ts">
import { Send } from 'lucide'
import { MAIL_LOCALES } from '~/utils/admin'
import type { MailLocale, MailTestResult } from '~/types/admin'
/**
 * "Send a test" dialog: one mail to an address of your choice, sent right
 * away (no queue), with the mailer's verdict shown in place. The default
 * slot says what gets sent; `#result` words the outcome (icon and text) in
 * the tinted result box. The address starts as your own, and `locale`, when
 * given, is preselected on every opening.
 */
const props = defineProps<{
  title: string
  /** POSTed `{ email, locale }`. */
  endpoint: string
  /** ID of the form; its fields get `-email` and `-locale` on top. */
  formId: string
  localeLabel: string
  /** Placeholder of the address field. */
  placeholder?: string
  locale?: MailLocale
}>()
const open = defineModel<boolean>('open', { required: true })
defineSlots<{
  default(): any
  result(props: { result: MailTestResult; email: string }): any
}>()
const api = useAdminApi()
const { user } = useAuth()
const email = ref(''),
  locale = ref<MailLocale>('zh-Hans'),
  busy = ref(false),
  error = ref<any>(null),
  result = ref<MailTestResult | null>(null)
watch(open, (value) => {
  if (!value) return
  email.value = email.value || user.value?.email || ''
  if (props.locale) locale.value = props.locale
  error.value = null
  result.value = null
})
async function send() {
  if (!email.value.trim() || busy.value) return
  busy.value = true
  error.value = null
  result.value = null
  try {
    result.value = await api.write<MailTestResult>(props.endpoint, { email: email.value.trim(), locale: locale.value })
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <Dialog v-model:open="open" :title="title" size="md">
    <form :id="formId" class="space-y-4 p-5" @submit.prevent="send">
      <slot />
      <div class="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <div>
          <label :for="`${formId}-email`" class="mb-1.5 block text-xs font-medium text-slate-700">收件邮箱</label>
          <input
            :id="`${formId}-email`"
            v-model="email"
            type="email"
            required
            maxlength="255"
            autocomplete="email"
            :placeholder="placeholder"
            class="admin-input"
            :disabled="busy"
          />
        </div>
        <div>
          <label :for="`${formId}-locale`" class="mb-1.5 block text-xs font-medium text-slate-700">{{ localeLabel }}</label>
          <SelectMenu :id="`${formId}-locale`" v-model="locale" :options="MAIL_LOCALES" size="sm" class="w-full" :disabled="busy" />
        </div>
      </div>
      <AdminError :error="error" />
      <div
        v-if="result"
        class="flex items-start gap-2.5 rounded-lg border p-3 text-[13px]"
        :class="result.ok ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900' : 'border-red-200 bg-red-50/60 text-red-900'"
      >
        <slot name="result" :result="result" :email="email" />
      </div>
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="open = false">关闭</button>
        <button :form="formId" class="admin-button admin-primary" :disabled="busy || !email.trim()">
          <LucideIcon :icon="Send" class="size-3.5" />{{ busy ? '正在发送…' : '发送' }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
