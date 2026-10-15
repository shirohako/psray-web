<script setup lang="ts">
import { ArrowLeft, CircleCheck, CircleX, FileText, Lock, Save, Send, Trash2, TriangleAlert } from 'lucide'
import {
  adminDate,
  MAIL_CATEGORIES,
  MAIL_CATEGORY_LABELS,
  MAIL_LOCALES,
  type MailPreview,
  type MailTemplateDetail,
} from '~/utils/admin'
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
const active = ref<string>('zh-Hans')
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
const canRemove = (locale: string) =>
  !!saved(locale) && !(template.value?.is_system && locale === 'en')

onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm('有未保存的修改，确定离开吗？')) return false
})

// --- Insert a variable at the cursor ------------------------------------------
const bodyInput = ref<HTMLTextAreaElement | null>(null)
function insert(name: string, block: boolean) {
  const d = drafts[active.value]
  if (!d || removed.value.includes(active.value)) return
  const text = block ? `\n\n{{ ${name} }}\n\n` : `{{ ${name} }}`
  const el = bodyInput.value
  const start = el?.selectionStart ?? d.body.length
  const end = el?.selectionEnd ?? d.body.length
  d.body = d.body.slice(0, start) + text + d.body.slice(end)
  nextTick(() => {
    el?.focus()
    el?.setSelectionRange(start + text.length, start + text.length)
  })
}

// --- Live preview (debounced, rendered by the API) -----------------------------
const preview = ref<MailPreview | null>(null),
  previewError = ref<any>(null),
  previewing = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let generation = 0
watch(
  () => [active.value, drafts[active.value]?.subject, drafts[active.value]?.body, template.value?.id],
  () => {
    clearTimeout(timer)
    timer = setTimeout(runPreview, 500)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearTimeout(timer))
async function runPreview() {
  const d = drafts[active.value]
  if (!template.value || !d || (!d.subject && !d.body)) {
    preview.value = null
    return
  }
  const current = ++generation
  previewing.value = true
  try {
    const data = await api.write<MailPreview>(`/mail/templates/${id.value}/preview`, { locale: active.value, subject: d.subject, body: d.body })
    if (current === generation) {
      preview.value = data
      previewError.value = null
    }
  } catch (e) {
    if (current === generation) previewError.value = e
  } finally {
    if (current === generation) previewing.value = false
  }
}

// --- Test send -------------------------------------------------------------
const { user } = useAuth()
const testOpen = ref(false),
  testEmail = ref(''),
  testLocale = ref('zh-Hans'),
  testing = ref(false),
  testResult = ref<{ ok: boolean; error: string | null; mail_log_id: number } | null>(null),
  testError = ref<any>(null)
function startTest() {
  testEmail.value = testEmail.value || user.value?.email || ''
  testLocale.value = active.value
  testResult.value = null
  testError.value = null
  testOpen.value = true
}
async function sendTest() {
  if (testing.value || !testEmail.value.trim()) return
  testing.value = true
  testResult.value = null
  testError.value = null
  try {
    testResult.value = await api.write(`/mail/templates/${id.value}/test`, { email: testEmail.value.trim(), locale: testLocale.value })
  } catch (e) {
    testError.value = e
  } finally {
    testing.value = false
  }
}

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
const SUBSCRIBABLE = MAIL_CATEGORIES.filter((c) => c.value !== 'transactional')
// `{{ name }}` spelled out in script: a literal one in the template would end the interpolation.
const placeholder = (name: string) => '{' + '{ ' + name + ' }' + '}'
</script>
<template>
  <AdminPageHeader
    :icon="FileText"
    :title="template?.name ?? '邮件模板'"
    :description="template ? `${template.key} · ${MAIL_CATEGORY_LABELS[template.category]}${template.is_system ? ' · 系统模板，只能改文案' : ''}` : undefined"
  >
    <NuxtLink to="/admin/mail/templates" class="admin-button"><LucideIcon :icon="ArrowLeft" class="size-3.5" />全部模板</NuxtLink>
    <template v-if="template">
      <button type="button" class="admin-button" @click="startTest"><LucideIcon :icon="Send" class="size-3.5" />发送测试</button>
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
        <select id="mt-category" v-model="meta.category" class="admin-input">
          <option v-for="c in SUBSCRIBABLE" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
      <div>
        <label for="mt-desc" class="mb-1.5 block text-xs font-medium text-slate-700">说明</label>
        <input id="mt-desc" v-model="meta.description" maxlength="255" class="admin-input" />
      </div>
    </section>

    <div class="grid gap-4 xl:grid-cols-2">
      <!-- Editor -->
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
          <p v-if="removed.includes(active)" class="rounded-lg border border-red-200 bg-red-50/60 p-3 text-[13px] text-red-900">
            保存后删除这种语言的文案，这种语言的收件人改收英语版本。
            <button type="button" class="ml-1 font-medium underline" @click="toggleRemove(active)">撤销</button>
          </p>
          <p v-else-if="!saved(active) && !drafts[active]?.subject && !drafts[active]?.body" class="text-xs text-slate-500">
            还没有{{ MAIL_LOCALES.find((l) => l.value === active)?.label }}文案，这种语言的收件人会收到英语版本。直接在下面填写即可新增。
          </p>
          <div>
            <label for="mt-subject" class="mb-1.5 block text-xs font-medium text-slate-700">主题</label>
            <input
              id="mt-subject"
              v-model="drafts[active]!.subject"
              :disabled="removed.includes(active)"
              maxlength="255"
              class="admin-input"
            />
          </div>
          <div>
            <div class="mb-1.5 flex items-baseline justify-between">
              <label for="mt-body" class="text-xs font-medium text-slate-700">正文（Markdown）</label>
              <span class="text-[11px] text-slate-400">不能写 HTML；变量写作 {{ placeholder('name') }}</span>
            </div>
            <textarea
              id="mt-body"
              ref="bodyInput"
              v-model="drafts[active]!.body"
              :disabled="removed.includes(active)"
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
                :disabled="removed.includes(active)"
                @click="insert(v.name, v.block)"
              >
                <code class="font-mono text-slate-900">{{ placeholder(v.name) }}</code>
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
              v-if="canRemove(active) && !removed.includes(active)"
              type="button"
              class="admin-link text-red-600 hover:text-red-700"
              @click="toggleRemove(active)"
            >
              删除这种语言
            </button>
            <span v-else-if="template.is_system && active === 'en'" class="text-slate-400">英语文案用于回落，不能删除</span>
          </div>
        </div>
      </section>

      <!-- Preview -->
      <section class="admin-panel overflow-hidden">
        <header class="admin-panel-head">
          <h2 class="admin-panel-title">预览 <span class="font-normal text-slate-400">示例变量 · 未保存的修改也会显示</span></h2>
          <span v-if="previewing" class="text-xs text-slate-400">渲染中…</span>
        </header>
        <div class="space-y-3 p-4">
          <AdminError :error="previewError" />
          <p
            v-if="preview?.unknown_variables.length"
            class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900"
          >
            <LucideIcon :icon="TriangleAlert" class="mt-px size-4 shrink-0 text-amber-600" />
            这个模板不支持 {{ preview.unknown_variables.map(placeholder).join('、') }}，保存时会被拒绝。
          </p>
          <template v-if="preview">
            <p class="text-[13px]"><span class="text-slate-500">主题：</span><b class="font-medium text-slate-900">{{ preview.subject }}</b></p>
            <iframe :srcdoc="preview.html" sandbox="" title="邮件预览" class="h-[36rem] w-full rounded-lg border border-slate-200 bg-white" />
          </template>
          <p v-else-if="!previewError" class="py-10 text-center text-[13px] text-slate-400">填写主题或正文后显示预览。</p>
        </div>
      </section>
    </div>
  </template>

  <Dialog v-model:open="testOpen" title="发送测试" size="md">
    <form id="mt-test" class="space-y-4 p-5" @submit.prevent="sendTest">
      <p class="text-[13px] text-slate-600">用<b class="font-medium text-slate-800">已保存</b>的文案和示例变量当场发一封（不经队列）。</p>
      <p v-if="dirty" class="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900">还有未保存的修改，测试用的是保存前的文案。</p>
      <div class="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <div>
          <label for="mt-test-email" class="mb-1.5 block text-xs font-medium text-slate-700">收件邮箱</label>
          <input id="mt-test-email" v-model="testEmail" type="email" required maxlength="255" class="admin-input" :disabled="testing" />
        </div>
        <div>
          <label for="mt-test-locale" class="mb-1.5 block text-xs font-medium text-slate-700">语言</label>
          <select id="mt-test-locale" v-model="testLocale" class="admin-input" :disabled="testing">
            <option v-for="l in MAIL_LOCALES" :key="l.value" :value="l.value">{{ l.label }}</option>
          </select>
        </div>
      </div>
      <AdminError :error="testError" />
      <div
        v-if="testResult"
        class="flex items-start gap-2.5 rounded-lg border p-3 text-[13px]"
        :class="testResult.ok ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900' : 'border-red-200 bg-red-50/60 text-red-900'"
      >
        <LucideIcon :icon="testResult.ok ? CircleCheck : CircleX" class="mt-px size-4 shrink-0" />
        <div class="min-w-0">
          <p>{{ testResult.ok ? '发信服务器已接收。' : '发送失败。' }} 邮件记录 #{{ testResult.mail_log_id }}</p>
          <pre v-if="testResult.error" class="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">{{ testResult.error }}</pre>
        </div>
      </div>
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="testOpen = false">关闭</button>
        <button form="mt-test" class="admin-button admin-primary" :disabled="testing || !testEmail.trim()">
          <LucideIcon :icon="Send" class="size-3.5" />{{ testing ? '正在发送…' : '发送' }}
        </button>
      </div>
    </template>
  </Dialog>

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
