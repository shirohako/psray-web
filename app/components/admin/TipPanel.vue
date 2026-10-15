<script setup lang="ts">
import { ExternalLink, Save, ThumbsDown, ThumbsUp, Trash2 } from 'lucide'
import { adminDate, adminTipChanges, TIP_LANGUAGE_OPTIONS, type AdminTipDetail, type AdminTipFields } from '~/utils/admin'

/**
 * Drawer body for one Tip: where it sits and who wrote it, the text as the
 * site renders it, an edit form (text, language, spoiler, missable) and
 * delete. Slots into AdminCollection's `#detail-actions`; `detail` is the list
 * row until the full item loads.
 */
const props = defineProps<{
  detail: AdminTipDetail
  /** Reload the list and this item. */
  refresh: () => Promise<unknown>
  /** Reload the list only (after the item is gone). */
  reload: () => Promise<unknown>
  close: () => void
}>()

const api = useAdminApi()
const busy = ref<string | null>(null)
const error = ref<any>(null)
const path = computed(() => `/tips/${props.detail.id}`)
const trophyPage = computed(() => tipTrophyLink(props.detail))
const edited = computed(() => props.detail.updated_at !== props.detail.created_at)

async function run(action: string, request: () => Promise<unknown>, after?: () => Promise<unknown> | void) {
  if (busy.value) return
  busy.value = action
  error.value = null
  try {
    await request()
    await (after ? after() : props.refresh())
  }
  catch (e) {
    error.value = e
  }
  finally {
    busy.value = null
  }
}

// ── Editing ──────────────────────────────────────────────────────────────────

const fields = (tip: AdminTipFields): AdminTipFields => ({
  content: tip.content,
  language: tip.language,
  has_spoiler: tip.has_spoiler,
  missable: tip.missable,
})
const form = reactive<AdminTipFields>(fields(props.detail))
const changes = computed(() => adminTipChanges(fields(props.detail), form))
// Follow another item, or this one after a save; a half-done edit survives a plain list refresh.
watch(() => [props.detail.id, props.detail.updated_at], ([id], [previousId]) => {
  if (id !== previousId || !Object.keys(changes.value).length) Object.assign(form, fields(props.detail))
})
const contentLength = computed(() => form.content.trim().length)
const canSave = computed(() => Object.keys(changes.value).length > 0 && contentLength.value > 0 && contentLength.value <= 20000)

function save() {
  if (!canSave.value) return
  return run('save', () => api.write(path.value, changes.value, 'patch'))
}

function revert() {
  Object.assign(form, fields(props.detail))
}

// ── Deleting ─────────────────────────────────────────────────────────────────

const confirmDelete = ref(false)
function deleteTip() {
  return run('delete', () => api.remove(path.value), () => {
    confirmDelete.value = false
    props.close()
    return props.reload()
  })
}

const MISSABLE_OPTIONS = [
  { value: null, label: '不标注' },
  { value: true, label: '可能错过' },
  { value: false, label: '不会错过' },
] as const
</script>

<template>
  <div class="space-y-5">
    <AdminError :error="error" />

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">位置与作者</h3>
        <span class="text-xs text-slate-500">
          发布于 <span class="tabular-nums">{{ adminDate(detail.created_at) }}</span>
          <template v-if="edited"> · 修改于 <span class="tabular-nums">{{ adminDate(detail.updated_at) }}</span></template>
        </span>
      </header>
      <dl class="grid gap-x-6 gap-y-3 p-4 text-[13px] sm:grid-cols-2">
        <div class="sm:col-span-2">
          <dt class="text-xs text-slate-400">奖杯</dt>
          <dd class="mt-1 flex items-center gap-2.5">
            <template v-if="detail.trophy">
              <img :src="detail.trophy.icon_url" alt="" class="size-9 shrink-0 rounded bg-slate-100 object-cover" />
              <span class="min-w-0">
                <span class="block truncate font-medium text-slate-900">{{ detail.trophy.name }}</span>
                <span class="block truncate text-xs text-slate-500">
                  {{ detail.trophy_set?.name ?? '—' }}<template v-if="detail.trophy_set?.platform.length"> · {{ detail.trophy_set.platform.join(' / ') }}</template>
                </span>
              </span>
              <NuxtLink v-if="trophyPage" :to="trophyPage" target="_blank" class="admin-link ml-auto shrink-0">
                <LucideIcon :icon="ExternalLink" class="size-3.5" />奖杯页
              </NuxtLink>
            </template>
            <span v-else class="text-slate-500">#{{ detail.trophy_id }}（奖杯已不存在，只能删除）</span>
          </dd>
        </div>
        <div>
          <dt class="text-xs text-slate-400">作者</dt>
          <dd class="mt-0.5 text-slate-900">
            <template v-if="detail.psnid">
              <NuxtLink :to="`/p/${encodeURIComponent(detail.psnid)}`" target="_blank" class="font-medium hover:underline">{{ detail.psnid }}</NuxtLink>
              <span v-if="detail.user" class="ml-1.5 text-xs text-slate-400">
                共 {{ detail.user.tip_count }} 条 · 累计有帮助 {{ detail.user.tip_vote_count }}
              </span>
            </template>
            <span v-else class="text-slate-500">#{{ detail.user_id }}（账号已不存在）</span>
          </dd>
        </div>
        <div>
          <dt class="text-xs text-slate-400">评价</dt>
          <dd class="mt-0.5 flex items-center gap-3 tabular-nums text-slate-900">
            <span class="inline-flex items-center gap-1"><LucideIcon :icon="ThumbsUp" class="size-3.5 text-slate-400" />{{ detail.vote_up_count }}</span>
            <span class="inline-flex items-center gap-1"><LucideIcon :icon="ThumbsDown" class="size-3.5 text-slate-400" />{{ detail.vote_down_count }}</span>
          </dd>
        </div>
      </dl>
    </section>

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">内容</h3>
        <span v-if="detail.has_spoiler" class="rounded bg-violet-50 px-1.5 py-px text-[11px] font-semibold text-violet-700">含剧透</span>
      </header>
      <div class="p-4">
        <RichContent :content="detail.content" :format="detail.content_type" />
      </div>
    </section>

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">修改</h3>
        <span class="text-xs text-slate-400">只提交改动的字段，不通知作者</span>
      </header>
      <form class="space-y-3 p-4" @submit.prevent="save">
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label class="flex items-center gap-1.5 text-xs text-slate-500">
            语言
            <select v-model="form.language" class="admin-input w-auto" :disabled="!!busy">
              <option v-for="option in TIP_LANGUAGE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <label class="flex items-center gap-1.5 text-xs text-slate-600">
            <input v-model="form.has_spoiler" type="checkbox" class="size-4 accent-slate-900" :disabled="!!busy" />
            含剧透（前台需点击后才显示）
          </label>
          <label class="flex items-center gap-1.5 text-xs text-slate-500">
            易错过
            <select v-model="form.missable" class="admin-input w-auto" :disabled="!!busy">
              <option v-for="option in MISSABLE_OPTIONS" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
        </div>
        <textarea v-model="form.content" class="admin-input font-mono text-xs leading-relaxed" rows="10" :disabled="!!busy" placeholder="Markdown 正文" />
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xs tabular-nums" :class="contentLength > 20000 || !contentLength ? 'font-semibold text-red-600' : 'text-slate-400'">
            {{ contentLength.toLocaleString() }} / 20,000
          </span>
          <div class="flex items-center gap-2">
            <button v-if="Object.keys(changes).length" type="button" class="admin-button" :disabled="!!busy" @click="revert">还原</button>
            <button class="admin-button admin-primary" :disabled="!!busy || !canSave">
              <LucideIcon :icon="Save" class="size-3.5" />{{ busy === 'save' ? '正在保存…' : '保存修改' }}
            </button>
          </div>
        </div>
      </form>
    </section>

    <section class="admin-panel">
      <header class="admin-panel-head">
        <h3 class="admin-panel-title">删除</h3>
      </header>
      <div class="flex flex-wrap items-center justify-between gap-3 p-4">
        <p class="text-xs leading-relaxed text-slate-500">删除后不可恢复，其他玩家的评价一并删除。应用日志里会留一份完整快照。</p>
        <button class="admin-button admin-danger" :disabled="!!busy" @click="confirmDelete = true">
          <LucideIcon :icon="Trash2" class="size-3.5" />删除
        </button>
      </div>
    </section>

    <Dialog v-model:open="confirmDelete" title="删除 Tip" size="md">
      <p class="p-5 text-[13px] leading-relaxed text-slate-600">
        删除 {{ detail.psnid ?? `#${detail.user_id}` }} 在「{{ detail.trophy?.name ?? `#${detail.trophy_id}` }}」下的 Tip 及其全部评价，不可恢复。
        作者的留言数和累计有帮助数、奖杯的留言数会同步扣减，不通知作者。
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button class="admin-button" @click="confirmDelete = false">取消</button>
          <button class="admin-button admin-danger" :disabled="!!busy" @click="deleteTip">{{ busy === 'delete' ? '正在删除…' : '删除' }}</button>
        </div>
      </template>
    </Dialog>
  </div>
</template>
