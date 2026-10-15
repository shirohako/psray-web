<script setup lang="ts">
import { Send, Trash2 } from 'lucide'
import {
  adminDate,
  FEEDBACK_STATUS_OPTIONS,
  FEEDBACK_TYPE_OPTIONS,
  FEEDBACK_VISIBILITY_LABELS,
  type AdminFeedbackDetail,
} from '~/utils/admin'

/**
 * Drawer body for one feedback item: who sent it and from where, the text and
 * thread, moderation (approve / hide / restore, type, status, no reply needed,
 * delete) and the official reply box. Slots into AdminCollection's
 * `#detail-actions`; `detail` is the list row until the full item loads.
 */
const props = defineProps<{
  detail: AdminFeedbackDetail
  /** Reload the list and this item. */
  refresh: () => Promise<unknown>
  /** Reload the list only (after the item is gone). */
  reload: () => Promise<unknown>
  close: () => void
}>()
const emit = defineEmits<{ changed: [] }>()

const api = useAdminApi()
const busy = ref<string | null>(null)
const error = ref<any>(null)
const loaded = computed(() => Array.isArray(props.detail.replies))
const path = computed(() => `/feedback/${props.detail.id}`)
const pageUrl = computed(() => {
  const url = props.detail.context?.page_url
  return url && /^https?:\/\//.test(url) ? url : null
})

async function run(action: string, request: () => Promise<unknown>, after?: () => Promise<unknown> | void) {
  if (busy.value) return
  busy.value = action
  error.value = null
  try {
    await request()
    emit('changed')
    await (after ? after() : props.refresh())
  }
  catch (e) {
    error.value = e
  }
  finally {
    busy.value = null
  }
}

const update = (action: string, body: Record<string, unknown>) => run(action, () => api.write(path.value, body, 'patch'))

// ── Official reply ───────────────────────────────────────────────────────────

const reply = ref('')
const replyImages = ref('')
const replyStatus = ref('')
const replyNote = computed(() => [
  '回复会在前台以你的账号显示，并带「官方」标记。',
  props.detail.visibility === 'pending' ? '这条反馈还没通过审核，回复只有作者看得到。' : '',
  props.detail.notifies_author
    ? '提交后会给作者发邮件通知。'
    : props.detail.author === 'guest' ? '作者是访客，收不到邮件通知。' : '作者没有绑定邮箱，收不到邮件通知。',
].join(''))

function sendReply() {
  const images = replyImages.value.split(/\s+/).filter(Boolean)
  const body: Record<string, unknown> = { content: reply.value.trim() }
  if (images.length) body.image_urls = images
  if (replyStatus.value) body.status = replyStatus.value
  return run('reply', () => api.write(`${path.value}/replies`, body), () => {
    reply.value = ''
    replyImages.value = ''
    replyStatus.value = ''
    return props.refresh()
  })
}

// ── Deleting ─────────────────────────────────────────────────────────────────

const confirmingReply = ref<number | null>(null)
function deleteReply(id: number) {
  return run(`reply-${id}`, () => api.remove(`/feedback/replies/${id}`), () => {
    confirmingReply.value = null
    return props.refresh()
  })
}

const confirmDelete = ref(false)
function deleteFeedback() {
  return run('delete', () => api.remove(path.value), () => {
    confirmDelete.value = false
    props.close()
    return props.reload()
  })
}
</script>

<template>
  <div class="space-y-5">
    <AdminError :error="error" />

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">处理</h3>
        <span class="text-xs font-medium" :class="detail.visibility === 'public' ? 'text-emerald-700' : detail.visibility === 'pending' ? 'text-amber-700' : 'text-slate-500'">
          {{ FEEDBACK_VISIBILITY_LABELS[detail.visibility] }}<template v-if="detail.awaiting_reply && detail.visibility === 'public'"> · 待回复</template>
        </span>
      </header>
      <div class="flex flex-wrap items-center gap-2 p-4">
        <template v-if="detail.visibility === 'pending'">
          <button class="admin-button admin-primary" :disabled="!!busy" @click="update('approve', { visibility: 'public' })">通过并公开</button>
          <button class="admin-button" :disabled="!!busy" @click="update('hide', { visibility: 'hidden' })">不通过（隐藏）</button>
        </template>
        <button v-else-if="detail.visibility === 'public'" class="admin-button" :disabled="!!busy" @click="update('hide', { visibility: 'hidden' })">隐藏</button>
        <button v-else class="admin-button" :disabled="!!busy" @click="update('restore', { visibility: 'public' })">恢复公开</button>
        <button v-if="detail.awaiting_reply" class="admin-button" :disabled="!!busy" title="移出「待回复」，不发回复" @click="update('dismiss', { awaiting_reply: false })">无需回复</button>
        <label class="flex items-center gap-1.5 text-xs text-slate-500">
          类型
          <select
            class="admin-input w-auto"
            :value="detail.type"
            :disabled="!!busy"
            @change="update('type', { type: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="option in FEEDBACK_TYPE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="flex items-center gap-1.5 text-xs text-slate-500">
          状态
          <select
            class="admin-input w-auto"
            :value="detail.status"
            :disabled="!!busy"
            @change="update('status', { status: ($event.target as HTMLSelectElement).value })"
          >
            <option v-for="option in FEEDBACK_STATUS_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <button class="admin-button admin-danger ml-auto" :disabled="!!busy" @click="confirmDelete = true">
          <LucideIcon :icon="Trash2" class="size-3.5" />删除
        </button>
      </div>
    </section>

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">提交者</h3>
      </header>
      <dl class="grid gap-x-6 gap-y-3 p-4 text-[13px] sm:grid-cols-2">
        <div>
          <dt class="text-xs text-slate-400">作者</dt>
          <dd class="mt-0.5 text-slate-900">
            <template v-if="detail.author === 'user'">
              <NuxtLink v-if="detail.psnid" :to="`/p/${encodeURIComponent(detail.psnid)}`" target="_blank" class="font-medium hover:underline">{{ detail.psnid }}</NuxtLink>
              <span v-else class="text-slate-500">#{{ detail.user_id }}（账号已不存在）</span>
              <span class="ml-1.5 text-xs text-slate-400">登录用户</span>
            </template>
            <template v-else>
              {{ detail.guest_name || '（未填昵称）' }}<span class="ml-1.5 text-xs text-slate-400">访客</span>
            </template>
          </dd>
        </div>
        <div>
          <dt class="text-xs text-slate-400">提交时间</dt>
          <dd class="mt-0.5 tabular-nums text-slate-900">{{ adminDate(detail.created_at) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-400">IP</dt>
          <dd class="mt-0.5 font-mono text-xs text-slate-700">{{ detail.ip_address || '—' }}</dd>
        </div>
        <div v-if="detail.reviewed_by">
          <dt class="text-xs text-slate-400">最近审核</dt>
          <dd class="mt-0.5 text-slate-900">{{ detail.reviewed_by }} · <span class="tabular-nums">{{ adminDate(detail.reviewed_at) }}</span></dd>
        </div>
        <template v-if="loaded">
          <div class="sm:col-span-2">
            <dt class="text-xs text-slate-400">页面</dt>
            <dd class="mt-0.5 break-all">
              <a v-if="pageUrl" :href="pageUrl" target="_blank" rel="noopener noreferrer" class="text-sky-700 hover:underline">{{ pageUrl }}</a>
              <span v-else class="text-slate-400">—</span>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400">屏幕 / 视口</dt>
            <dd class="mt-0.5 font-mono text-xs text-slate-700">{{ detail.context?.screen || '—' }} / {{ detail.context?.viewport || '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400">界面语言 / 时区</dt>
            <dd class="mt-0.5 font-mono text-xs text-slate-700">{{ detail.context?.locale || '—' }} / {{ detail.context?.timezone || '—' }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-xs text-slate-400">User-Agent</dt>
            <dd class="mt-0.5 break-all font-mono text-xs text-slate-600">{{ detail.user_agent || '—' }}</dd>
          </div>
        </template>
      </dl>
    </section>

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">内容</h3>
      </header>
      <div class="space-y-3 p-4">
        <FeedbackText :text="detail.content" />
        <FeedbackImages :urls="detail.image_urls" />
      </div>
    </section>

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">回复 <span class="admin-count">{{ detail.replies?.length ?? detail.reply_count }}</span></h3>
      </header>
      <p v-if="!loaded" class="px-4 py-6 text-center text-xs text-slate-400">加载中…</p>
      <p v-else-if="!detail.replies?.length" class="px-4 py-6 text-center text-xs text-slate-400">还没有回复</p>
      <ol v-else class="divide-y divide-slate-100">
        <li v-for="item in detail.replies" :key="item.id" class="space-y-2 px-4 py-3" :class="item.is_staff ? 'bg-sky-50/60' : ''">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span v-if="item.is_staff" class="rounded bg-sky-100 px-1.5 py-px font-semibold text-sky-800">官方</span>
            <span v-else class="rounded bg-slate-100 px-1.5 py-px font-semibold text-slate-600">作者追问</span>
            <span class="font-medium text-slate-900">{{ item.psnid || (item.is_staff ? '（账号已不存在）' : detail.guest_name || '访客') }}</span>
            <span class="tabular-nums text-slate-400">{{ adminDate(item.created_at) }}</span>
            <span v-if="item.ip_address" class="font-mono text-slate-400">{{ item.ip_address }}</span>
            <span class="ml-auto flex items-center gap-2">
              <template v-if="confirmingReply === item.id">
                <button class="admin-link !text-red-600" :disabled="!!busy" @click="deleteReply(item.id)">{{ busy === `reply-${item.id}` ? '正在删除…' : '确认删除' }}</button>
                <button class="admin-link" @click="confirmingReply = null">取消</button>
              </template>
              <button v-else class="admin-link" :disabled="!!busy" @click="confirmingReply = item.id">
                <LucideIcon :icon="Trash2" class="size-3.5" />删除
              </button>
            </span>
          </div>
          <FeedbackText :text="item.content" />
          <FeedbackImages :urls="item.image_urls" />
        </li>
      </ol>
    </section>

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">官方回复</h3>
      </header>
      <form class="space-y-3 p-4" @submit.prevent="sendReply">
        <p class="text-xs leading-relaxed text-slate-500">{{ replyNote }}</p>
        <textarea
          v-model="reply"
          class="admin-input"
          rows="5"
          maxlength="5000"
          :disabled="!!busy"
          placeholder="回复内容（纯文本，网址会自动变成链接）"
        />
        <textarea
          v-model="replyImages"
          class="admin-input !min-h-16"
          rows="2"
          :disabled="!!busy"
          placeholder="图片链接（可选）：https 开头，每行一个，最多 4 个"
        />
        <div class="flex flex-wrap items-center justify-end gap-2">
          <label class="flex items-center gap-1.5 text-xs text-slate-500">
            同时把状态改为
            <select v-model="replyStatus" class="admin-input w-auto" :disabled="!!busy">
              <option value="">不修改</option>
              <option v-for="option in FEEDBACK_STATUS_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <button class="admin-button admin-primary" :disabled="!!busy || !reply.trim()">
            <LucideIcon :icon="Send" class="size-3.5" />{{ busy === 'reply' ? '正在发送…' : '发送回复' }}
          </button>
        </div>
      </form>
    </section>

    <Dialog v-model:open="confirmDelete" title="删除反馈" size="md">
      <p class="p-5 text-[13px] leading-relaxed text-slate-600">
        删除这条反馈及其全部回复，不可恢复。只是不想让它公开的话，用「隐藏」就够了。
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button class="admin-button" @click="confirmDelete = false">取消</button>
          <button class="admin-button admin-danger" :disabled="!!busy" @click="deleteFeedback">{{ busy === 'delete' ? '正在删除…' : '删除' }}</button>
        </div>
      </template>
    </Dialog>
  </div>
</template>
