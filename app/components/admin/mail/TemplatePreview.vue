<script setup lang="ts">
import { TriangleAlert } from 'lucide'
import { adminMailPlaceholder } from '~/utils/admin'
import type { MailPreview } from '~/types/admin'
/**
 * Live preview of a template draft, rendered by the API with sample
 * variables (the same renderer that sends mail, so what you see is what goes
 * out). Re-renders 500 ms after the last change; a late response for an
 * older draft never replaces a newer one.
 */
const props = defineProps<{
  templateId: number
  locale: string
  draft: { subject: string; body: string } | undefined
}>()
const api = useAdminApi()
const preview = ref<MailPreview | null>(null),
  error = ref<any>(null),
  previewing = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let generation = 0
watch(
  () => [props.locale, props.draft?.subject, props.draft?.body, props.templateId],
  () => {
    clearTimeout(timer)
    timer = setTimeout(render, 500)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearTimeout(timer))
async function render() {
  const draft = props.draft
  if (!draft || (!draft.subject && !draft.body)) {
    preview.value = null
    return
  }
  const current = ++generation
  previewing.value = true
  try {
    const data = await api.write<MailPreview>(`/mail/templates/${props.templateId}/preview`, { locale: props.locale, subject: draft.subject, body: draft.body })
    if (current === generation) {
      preview.value = data
      error.value = null
    }
  } catch (e) {
    if (current === generation) error.value = e
  } finally {
    if (current === generation) previewing.value = false
  }
}
</script>
<template>
  <section class="admin-panel overflow-hidden">
    <header class="admin-panel-head">
      <h2 class="admin-panel-title">预览 <span class="font-normal text-slate-400">示例变量 · 未保存的修改也会显示</span></h2>
      <span v-if="previewing" class="text-xs text-slate-400">渲染中…</span>
    </header>
    <div class="space-y-3 p-4">
      <AdminError :error="error" />
      <p
        v-if="preview?.unknown_variables.length"
        class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900"
      >
        <LucideIcon :icon="TriangleAlert" class="mt-px size-4 shrink-0 text-amber-600" />
        这个模板不支持 {{ preview.unknown_variables.map(adminMailPlaceholder).join('、') }}，保存时会被拒绝。
      </p>
      <template v-if="preview">
        <p class="text-[13px]"><span class="text-slate-500">主题：</span><b class="font-medium text-slate-900">{{ preview.subject }}</b></p>
        <iframe :srcdoc="preview.html" sandbox="" title="邮件预览" class="h-[36rem] w-full rounded-lg border border-slate-200 bg-white" />
      </template>
      <p v-else-if="!error" class="py-10 text-center text-[13px] text-slate-400">填写主题或正文后显示预览。</p>
    </div>
  </section>
</template>
