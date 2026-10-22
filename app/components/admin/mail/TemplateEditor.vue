<script setup lang="ts">
import { adminDate, adminMailPlaceholder, MAIL_LOCALES } from '~/utils/admin'
import type { MailLocale, MailTemplateDetail } from '~/types/admin'
/**
 * A template's copy, one language tab at a time: subject, Markdown body and
 * the variables it may use (click to insert at the cursor). `subject` and
 * `body` are the active language's draft. `removing` marks that language for
 * deletion on save; `toggleRemove` asks to mark or unmark it.
 */
const props = defineProps<{
  template: MailTemplateDetail
  /** Languages whose drafts differ from what is saved. */
  dirtyLocales: string[]
  removing: boolean
}>()
const active = defineModel<MailLocale>('active', { required: true })
const subject = defineModel<string>('subject', { required: true })
const body = defineModel<string>('body', { required: true })
defineEmits<{ toggleRemove: [] }>()

const saved = (locale: string) => props.template.translations[locale]
// English is what other languages fall back to, so a system template keeps it.
const canRemove = computed(
  () => !!saved(active.value) && !(props.template.is_system && active.value === 'en'),
)

// --- Insert a variable at the cursor ------------------------------------------
const bodyInput = ref<HTMLTextAreaElement | null>(null)
function insert(name: string, block: boolean) {
  if (props.removing) return
  const text = block ? `\n\n{{ ${name} }}\n\n` : `{{ ${name} }}`
  const el = bodyInput.value
  const start = el?.selectionStart ?? body.value.length
  const end = el?.selectionEnd ?? body.value.length
  body.value = body.value.slice(0, start) + text + body.value.slice(end)
  nextTick(() => {
    el?.focus()
    el?.setSelectionRange(start + text.length, start + text.length)
  })
}
</script>
<template>
  <section class="admin-panel overflow-hidden">
    <div class="admin-panel rounded-none border-0 border-b border-slate-200 px-4">
      <div class="admin-utabs" role="tablist" aria-label="语言">
        <button
          v-for="l in MAIL_LOCALES"
          :key="l.value"
          type="button"
          role="tab"
          class="admin-utab"
          :aria-selected="active === l.value"
          @click="active = l.value"
        >
          {{ l.label }}
          <span v-if="dirtyLocales.includes(l.value)" class="size-1.5 rounded-full bg-amber-500" title="未保存" />
          <span v-else-if="!saved(l.value)" class="text-[11px] font-normal text-slate-400">缺失</span>
        </button>
      </div>
    </div>
    <div class="space-y-3 p-4">
      <p v-if="removing" class="rounded-lg border border-red-200 bg-red-50/60 p-3 text-[13px] text-red-900">
        保存后删除这种语言的文案，这种语言的收件人改收英语版本。
        <button type="button" class="ml-1 font-medium underline" @click="$emit('toggleRemove')">撤销</button>
      </p>
      <p v-else-if="!saved(active) && !subject && !body" class="text-xs text-slate-500">
        还没有{{ MAIL_LOCALES.find((l) => l.value === active)?.label }}文案，这种语言的收件人会收到英语版本。直接在下面填写即可新增。
      </p>
      <div>
        <label for="mt-subject" class="mb-1.5 block text-xs font-medium text-slate-700">主题</label>
        <input
          id="mt-subject"
          v-model="subject"
          :disabled="removing"
          maxlength="255"
          class="admin-input"
        />
      </div>
      <div>
        <div class="mb-1.5 flex items-baseline justify-between">
          <label for="mt-body" class="text-xs font-medium text-slate-700">正文（Markdown）</label>
          <span class="text-[11px] text-slate-400">不能写 HTML；变量写作 {{ adminMailPlaceholder('name') }}</span>
        </div>
        <textarea
          id="mt-body"
          ref="bodyInput"
          v-model="body"
          :disabled="removing"
          rows="16"
          spellcheck="false"
          class="admin-input min-h-80 font-mono text-[12.5px] leading-relaxed"
        />
      </div>
      <div class="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
        <p class="mb-2 text-xs font-medium text-slate-700">可用变量（点击插入到光标处）</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="v in template.variables"
            :key="v.name"
            type="button"
            class="rounded-md border border-slate-200 bg-white px-2 py-1 text-left text-xs transition hover:border-slate-400"
            :title="`示例值：${v.sample}${v.sensitive ? '；不会写进邮件记录' : ''}`"
            :disabled="removing"
            @click="insert(v.name, v.block)"
          >
            <code class="font-mono text-slate-900">{{ adminMailPlaceholder(v.name) }}</code>
            <span class="ml-1 text-slate-500">{{ v.label }}</span>
            <span v-if="v.block" class="ml-1 text-[10px] text-sky-700">块</span>
            <span v-if="v.sensitive" class="ml-1 text-[10px] text-amber-700">敏感</span>
          </button>
        </div>
        <p class="mt-2 text-[11px] text-slate-500">
          「块」变量要单独成段；非账户与安全类邮件的页脚会自动加上退订与邮件设置链接，不用写进正文。
        </p>
      </div>
      <div v-if="saved(active)" class="flex items-center justify-between gap-3 text-xs text-slate-400">
        <span>
          最近修改 {{ adminDate(saved(active)!.updated_at) }}<template v-if="saved(active)!.updated_by"> · {{ saved(active)!.updated_by }}</template>
        </span>
        <button
          v-if="canRemove && !removing"
          type="button"
          class="admin-link text-red-600 hover:text-red-700"
          @click="$emit('toggleRemove')"
        >
          删除这种语言
        </button>
        <span v-else-if="template.is_system && active === 'en'" class="text-slate-400">英语文案用于回落，不能删除</span>
      </div>
    </div>
  </section>
</template>
