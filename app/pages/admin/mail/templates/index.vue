<script setup lang="ts">
import { FileText, Lock, Plus } from 'lucide'
import {
  adminDate,
  MAIL_CATEGORIES,
  MAIL_CATEGORY_LABELS,
  MAIL_LOCALES,
  type MailTemplateDetail,
  type MailTemplateSummary,
} from '~/utils/admin'
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })
const api = useAdminApi()
const templates = ref<MailTemplateSummary[] | null>(null),
  error = ref<any>(null),
  busy = ref(false)
async function refresh() {
  busy.value = true
  error.value = null
  try {
    templates.value = await api.get<MailTemplateSummary[]>('/mail/templates')
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
onMounted(refresh)

// --- New campaign template -------------------------------------------------
const SUBSCRIBABLE = MAIL_CATEGORIES.filter((c) => c.value !== 'transactional')
const createOpen = ref(false),
  form = reactive({ key: '', name: '', category: 'important', description: '' }),
  creating = ref(false),
  createError = ref<any>(null)
function startCreate() {
  Object.assign(form, { key: '', name: '', category: 'important', description: '' })
  createError.value = null
  createOpen.value = true
}
async function create() {
  if (creating.value) return
  creating.value = true
  createError.value = null
  try {
    const created = await api.write<MailTemplateDetail>('/mail/templates', {
      key: form.key.trim(),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || null,
    })
    createOpen.value = false
    await navigateTo(`/admin/mail/templates/${created.id}`)
  } catch (e) {
    createError.value = e
  } finally {
    creating.value = false
  }
}
</script>
<template>
  <AdminPageHeader
    :icon="FileText"
    title="邮件模板"
    description="每个模板有五种语言的主题与正文；收件人的语言缺翻译时回落英语。系统模板（验证码、测试邮件）由站点自动发送，只能改文案；群发模板在这里新建，用于群发邮件。"
  >
    <AdminRefresh :busy="busy" @click="refresh" />
    <button type="button" class="admin-button admin-primary" @click="startCreate">
      <LucideIcon :icon="Plus" class="size-3.5" />新建群发模板
    </button>
  </AdminPageHeader>
  <AdminError :error="error" />
  <section v-if="templates" class="admin-panel overflow-hidden">
    <table class="w-full text-left text-[13px]">
      <thead class="border-b border-slate-200 bg-slate-50/70 text-xs text-slate-500">
        <tr>
          <th class="px-4 py-2.5 font-medium">模板</th>
          <th class="px-4 py-2.5 font-medium">分类</th>
          <th class="px-4 py-2.5 font-medium">语言</th>
          <th class="hidden px-4 py-2.5 font-medium md:table-cell">修改时间</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr
          v-for="t in templates"
          :key="t.id"
          class="cursor-pointer transition hover:bg-slate-50"
          @click="navigateTo(`/admin/mail/templates/${t.id}`)"
        >
          <td class="px-4 py-3">
            <NuxtLink :to="`/admin/mail/templates/${t.id}`" class="flex items-center gap-1.5 font-medium text-slate-900" @click.stop>
              <LucideIcon v-if="t.is_system" :icon="Lock" class="size-3.5 text-slate-400" />{{ t.name }}
            </NuxtLink>
            <p class="mt-0.5 font-mono text-[11px] text-slate-400">{{ t.key }}</p>
          </td>
          <td class="px-4 py-3 text-slate-600">{{ MAIL_CATEGORY_LABELS[t.category] }}</td>
          <td class="px-4 py-3">
            <span class="flex flex-wrap gap-1">
              <span
                v-for="l in MAIL_LOCALES"
                :key="l.value"
                class="rounded px-1.5 py-px text-[11px] ring-1 ring-inset"
                :class="t.locales.includes(l.value) ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-400 ring-slate-200'"
                :title="t.locales.includes(l.value) ? `${l.label}：已有文案` : `${l.label}：缺失，回落英语`"
                >{{ l.value }}</span
              >
            </span>
          </td>
          <td class="hidden px-4 py-3 text-slate-500 md:table-cell">{{ adminDate(t.updated_at) }}</td>
        </tr>
      </tbody>
    </table>
  </section>
  <Dialog v-model:open="createOpen" title="新建群发模板" size="md">
    <form id="admin-mail-template-create" class="space-y-4 p-5" @submit.prevent="create">
      <p class="text-[13px] text-slate-600">建好后进入编辑页填写各语言的主题与正文，再到「群发邮件」里选它发送。</p>
      <div>
        <label for="mt-name" class="mb-1.5 block text-xs font-medium text-slate-700">名称</label>
        <input id="mt-name" v-model="form.name" required maxlength="100" class="admin-input" placeholder="如：10 月服务器维护通知" />
      </div>
      <div>
        <label for="mt-key" class="mb-1.5 block text-xs font-medium text-slate-700">Key</label>
        <input
          id="mt-key"
          v-model="form.key"
          required
          maxlength="64"
          pattern="[a-z0-9][a-z0-9_.\-]*"
          spellcheck="false"
          class="admin-input font-mono"
          placeholder="notice.2026-10-maintenance"
        />
        <p class="mt-1 text-xs text-slate-500">小写字母、数字和 . _ -，创建后不能修改；auth. account. system. 开头的留给系统模板。</p>
      </div>
      <div>
        <label for="mt-category" class="mb-1.5 block text-xs font-medium text-slate-700">分类</label>
        <SelectMenu id="mt-category" v-model="form.category" :options="SUBSCRIBABLE" size="sm" class="w-full" />
        <p class="mt-1 text-xs text-slate-500">决定发给谁：只发给开启了这一类订阅的用户，邮件里带这一类的退订链接。</p>
      </div>
      <div>
        <label for="mt-desc" class="mb-1.5 block text-xs font-medium text-slate-700">说明 <span class="font-normal text-slate-400">可选</span></label>
        <input id="mt-desc" v-model="form.description" maxlength="255" class="admin-input" />
      </div>
      <AdminError :error="createError" />
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="createOpen = false">取消</button>
        <button form="admin-mail-template-create" class="admin-button admin-primary" :disabled="creating || !form.key.trim() || !form.name.trim()">
          {{ creating ? '正在创建…' : '创建并编辑' }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
