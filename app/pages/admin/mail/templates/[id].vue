<script setup lang="ts">
import { ArrowLeft, CircleCheck, CircleX, FileText, Lock, Save, Send, Trash2 } from 'lucide'
import { MAIL_CAMPAIGN_CATEGORIES, MAIL_CATEGORY_LABELS, MAIL_LOCALES } from '~/utils/admin'
import type { MailLocale, MailTemplateDetail } from '~/types/admin'
/**
 * Edit one mail template: subject and Markdown body per language, with a
 * live preview rendered by the API (the same renderer that sends mail, so
 * what you see is what goes out). Campaign templates can also be renamed,
 * re-categorised and deleted; system templates only take copy changes.
 */
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi()
const route = useRoute()
const id = computed(() => Number(route.params.id))

const template = ref<MailTemplateDetail | null>(null),
  loadError = ref<any>(null),
  loading = ref(false)
const active = ref<MailLocale>('zh-Hans')
const drafts = reactive<Record<string, { subject: string; body: string }>>({})
const removed = ref<string[]>([])
const meta = reactive({ name: '', description: '', category: 'important' })

function seed(t: MailTemplateDetail) {
  for (const l of MAIL_LOCALES) {
    const saved = t.translations[l.value]
    drafts[l.value] = { subject: saved?.subject ?? '', body: saved?.body ?? '' }
  }
  removed.value = []
  Object.assign(meta, { name: t.name, description: t.description ?? '', category: t.category })
}
async function load() {
  loading.value = true
  loadError.value = null
  try {
    template.value = await api.get<MailTemplateDetail>(`/mail/templates/${id.value}`)
    seed(template.value)
  } catch (e) {
    loadError.value = e
  } finally {
    loading.value = false
  }
}
onMounted(load)

const saved = (locale: string) => template.value?.translations[locale]
const dirtyLocales = computed(() =>
  MAIL_LOCALES.map((l) => l.value).filter((l) => {
    if (removed.value.includes(l)) return !!saved(l)
    const d = drafts[l]
    const s = saved(l)
    if (!d) return false
    return s ? d.subject !== s.subject || d.body !== s.body : d.subject !== '' || d.body !== ''
  }),
)
const metaDirty = computed(
  () =>
    !!template.value &&
    !template.value.is_system &&
    (meta.name !== template.value.name || meta.description !== (template.value.description ?? '') || meta.category !== template.value.category),
)
const dirty = computed(() => dirtyLocales.value.length > 0 || metaDirty.value)
const incomplete = computed(() =>
  dirtyLocales.value.filter((l) => !removed.value.includes(l) && (!drafts[l]!.subject.trim() || !drafts[l]!.body.trim())),
)

// --- Save --------------------------------------------------------------------
const saving = ref(false),
  saveError = ref<any>(null),
  savedAt = ref<string | null>(null)
async function save() {
  if (!template.value || !dirty.value || saving.value || incomplete.value.length) return
  saving.value = true
  saveError.value = null
  const body: Record<string, unknown> = {}
  if (dirtyLocales.value.length) {
    body.translations = Object.fromEntries(
      dirtyLocales.value.map((l) => [l, removed.value.includes(l) ? null : { subject: drafts[l]!.subject, body: drafts[l]!.body }]),
    )
  }
  if (metaDirty.value) Object.assign(body, { name: meta.name.trim(), description: meta.description.trim() || null, category: meta.category })
  try {
    template.value = await api.write<MailTemplateDetail>(`/mail/templates/${id.value}`, body, 'put')
    seed(template.value)
    savedAt.value = new Date().toISOString()
  } catch (e) {
    saveError.value = e
  } finally {
    saving.value = false
  }
}
function toggleRemove(locale: string) {
  removed.value = removed.value.includes(locale) ? removed.value.filter((l) => l !== locale) : [...removed.value, locale]
}

onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm('有未保存的修改，确定离开吗？')) return false
})

// --- Test send -------------------------------------------------------------
const testOpen = ref(false)

// --- Delete (campaign templates) ----------------------------------------------
const deleteOpen = ref(false),
  deleting = ref(false),
  deleteError = ref<any>(null)
async function destroy() {
  deleting.value = true
  deleteError.value = null
  try {
    await api.remove(`/mail/templates/${id.value}`)
    removed.value = []
    template.value = null
    await navigateTo('/admin/mail/templates')
  } catch (e) {
    deleteError.value = e
  } finally {
    deleting.value = false
  }
}
</script>
<template>
  <AdminPageHeader
    :icon="FileText"
    :title="template?.name ?? '邮件模板'"
    :description="template ? `${template.key} · ${MAIL_CATEGORY_LABELS[template.category]}${template.is_system ? ' · 系统模板，只能改文案' : ''}` : undefined"
  >
    <NuxtLink to="/admin/mail/templates" class="admin-button"><LucideIcon :icon="ArrowLeft" class="size-3.5" />全部模板</NuxtLink>
    <template v-if="template">
      <button type="button" class="admin-button" @click="testOpen = true"><LucideIcon :icon="Send" class="size-3.5" />发送测试</button>
      <button v-if="!template.is_system" type="button" class="admin-button" @click="deleteOpen = true">
        <LucideIcon :icon="Trash2" class="size-3.5" />删除
      </button>
      <button type="button" class="admin-button admin-primary" :disabled="!dirty || saving || incomplete.length > 0" @click="save">
        <LucideIcon :icon="Save" class="size-3.5" />{{ saving ? '正在保存…' : '保存' }}
      </button>
    </template>
  </AdminPageHeader>
  <AdminError :error="loadError" />
  <div v-if="loading && !template" class="admin-panel space-y-3 p-4" aria-busy="true">
    <div v-for="i in 4" :key="i" class="h-9 animate-pulse rounded-md bg-slate-100" />
  </div>
  <template v-else-if="template">
    <AdminError :error="saveError" />
    <p v-if="incomplete.length" class="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900">
      {{ incomplete.join('、') }} 的主题和正文都要填写（或撤销这种语言的修改）才能保存。
    </p>
    <p v-else-if="savedAt && !dirty" class="flex items-center gap-1.5 text-xs text-emerald-700">
      <LucideIcon :icon="CircleCheck" class="size-3.5" />已保存，之后发出的邮件使用新文案。
    </p>

    <!-- Campaign template settings -->
    <section v-if="!template.is_system" class="admin-panel grid gap-3 p-4 md:grid-cols-[1fr_12rem_1fr]">
      <div>
        <label for="mt-name" class="mb-1.5 block text-xs font-medium text-slate-700">名称</label>
        <input id="mt-name" v-model="meta.name" maxlength="100" class="admin-input" />
      </div>
      <div>
        <label for="mt-category" class="mb-1.5 block text-xs font-medium text-slate-700">分类</label>
        <SelectMenu id="mt-category" v-model="meta.category" :options="MAIL_CAMPAIGN_CATEGORIES" size="sm" class="w-full" />
      </div>
      <div>
        <label for="mt-desc" class="mb-1.5 block text-xs font-medium text-slate-700">说明</label>
        <input id="mt-desc" v-model="meta.description" maxlength="255" class="admin-input" />
      </div>
    </section>

    <div class="grid gap-4 xl:grid-cols-2">
      <AdminMailTemplateEditor
        v-model:active="active"
        v-model:subject="drafts[active]!.subject"
        v-model:body="drafts[active]!.body"
        :template="template"
        :dirty-locales="dirtyLocales"
        :removing="removed.includes(active)"
        @toggle-remove="toggleRemove(active)"
      />
      <AdminMailTemplatePreview :template-id="template.id" :locale="active" :draft="drafts[active]" />
    </div>
  </template>

  <AdminMailTestDialog
    v-model:open="testOpen"
    title="发送测试"
    :endpoint="`/mail/templates/${id}/test`"
    form-id="mt-test"
    locale-label="语言"
    :locale="active"
  >
    <p class="text-[13px] text-slate-600">用<b class="font-medium text-slate-800">已保存</b>的文案和示例变量当场发一封（不经队列）。</p>
    <p v-if="dirty" class="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900">还有未保存的修改，测试用的是保存前的文案。</p>
    <template #result="{ result }">
      <LucideIcon :icon="result.ok ? CircleCheck : CircleX" class="mt-px size-4 shrink-0" />
      <div class="min-w-0">
        <p>{{ result.ok ? '发信服务器已接收。' : '发送失败。' }} 邮件记录 #{{ result.mail_log_id }}</p>
        <pre v-if="result.error" class="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">{{ result.error }}</pre>
      </div>
    </template>
  </AdminMailTestDialog>

  <Dialog v-model:open="deleteOpen" title="删除模板" size="md">
    <div class="space-y-3 p-5 text-[13px] text-slate-600">
      <p class="flex items-start gap-2">
        <LucideIcon :icon="Lock" class="mt-px size-4 shrink-0 text-slate-400" />
        删除后不能再用它群发；已经发出的群发记录仍能看到当时的内容。
      </p>
      <AdminError :error="deleteError" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="deleteOpen = false">取消</button>
        <button type="button" class="admin-button admin-danger" :disabled="deleting" @click="destroy">
          {{ deleting ? '正在删除…' : '确认删除' }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
