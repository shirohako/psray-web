<script setup lang="ts">
import type { AdminPreview, AdminOperation } from '~/utils/admin'
const props = defineProps<{ psnid?: string }>()
const emit = defineEmits<{ done: [] }>()
const api = useAdminApi()
const open = ref(false),
  busy = ref(false),
  error = ref<any>(null),
  preview = ref<AdminPreview | null>(null),
  result = ref<any>(null),
  operation = ref<AdminOperation | null>(null)
const form = reactive({
  psnid: '',
  penalty_level: 'ranking_ban',
  reason: '',
  confirmation: '',
  internal_note: '',
  evidence: '',
})
let key = ''
watch(form, () => {
  if (!busy.value) key = crypto.randomUUID()
})
function start() {
  Object.assign(form, {
    psnid: props.psnid || '',
    penalty_level: 'ranking_ban',
    reason: '',
    confirmation: '',
    internal_note: '',
    evidence: '',
  })
  preview.value = null
  result.value = null
  operation.value = null
  error.value = null
  key = crypto.randomUUID()
  open.value = true
}
async function inspect() {
  busy.value = true
  error.value = null
  try {
    preview.value = await api.write<AdminPreview>('/penalties/preview', {
      psnid: form.psnid,
    })
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
async function submit() {
  if (!preview.value) return
  busy.value = true
  error.value = null
  try {
    let evidence
    if (form.evidence.trim()) {
      try {
        evidence = JSON.parse(form.evidence)
      } catch {
        throw new Error('证据必须是有效 JSON。')
      }
    }
    result.value = await api.write(
      '/penalties',
      {
        preview_token: preview.value.preview_token,
        penalty_level: form.penalty_level,
        reason: form.reason,
        confirmation: form.confirmation,
        internal_note: form.internal_note,
        evidence,
      },
      'post',
      key,
    )
    emit('done')
    await check()
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}
async function check() {
  if (open.value && result.value?.operation_id) {
    try {
      operation.value = await api.get<AdminOperation>(
        '/operations/' + result.value.operation_id,
      )
    } catch (e) {
      error.value = e
    }
  }
}
useAdminPoll(check)
</script>
<template>
  <button class="admin-button admin-danger" @click="start">新增处罚</button>
  <Dialog v-model:open="open" title="用户处罚" size="lg"
    ><div class="space-y-5 p-5">
      <AdminError :error="error" />
      <div v-if="result" class="space-y-4">
        <p class="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          处罚已生效。处罚记录 #{{ result.penalty_id }}
        </p>
        <p v-if="result.operation_id" class="text-sm">
          个人数据清理：<AdminStatus
            :value="operation?.status || result.status"
          />
        </p>
        <p v-if="operation?.error" class="text-sm text-red-700">
          {{ operation.error }}。处罚仍有效，可在处罚详情重试清理。
        </p>
        <button class="admin-button" @click="open = false">关闭</button>
      </div>
      <form v-else-if="!preview" class="space-y-4" @submit.prevent="inspect">
        <p class="text-sm text-slate-500">
          支持本地用户及尚未入库的 PSN 账号。先核对账号身份，再选择处罚。
        </p>
        <label class="block text-sm"
          >PSN ID<input
            v-model="form.psnid"
            class="admin-input mt-2"
            required
            maxlength="64" /></label
        ><button class="admin-button admin-primary" :disabled="busy">
          {{ busy ? '正在解析身份…' : '预览身份与影响' }}
        </button>
      </form>
      <form v-else class="space-y-4" @submit.prevent="submit">
        <div class="rounded-lg bg-slate-50 p-4 text-sm">
          <p class="font-semibold">{{ preview.identity.psnid }}</p>
          <p class="mt-1 break-all text-slate-500">
            Account ID：{{ preview.identity.account_id }}
          </p>
          <p class="mt-1 text-slate-500">
            {{
              preview.identity.user_id
                ? `本地用户 #${preview.identity.user_id}`
                : '未入库账号'
            }}
            · {{ preview.penalties.length }} 条有效处罚
          </p>
        </div>
        <label class="block text-sm"
          >处罚类型<select
            v-model="form.penalty_level"
            class="admin-input mt-2"
          >
            <option value="ranking_ban">排名处罚</option>
            <option value="termination">永久封禁并清理个人奖杯数据</option>
          </select></label
        >
        <p
          class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          {{
            form.penalty_level === 'termination'
              ? preview.impact.termination
              : preview.impact.ranking_ban
          }}
        </p>
        <label class="block text-sm"
          >处罚理由<textarea
            v-model="form.reason"
            required
            class="admin-input mt-2"
          /><span class="mt-1 block text-xs text-slate-500"
            >UTF-8 最多 255 字节，内部备注另填。</span
          ></label
        ><label class="block text-sm"
          >内部备注（可选）<textarea
            v-model="form.internal_note"
            maxlength="10000"
            class="admin-input mt-2"
          /></label
        ><label class="block text-sm"
          >证据 JSON（可选）<textarea
            v-model="form.evidence"
            class="admin-input mt-2 font-mono"
            placeholder='{"links": ["https://..."]}'
          /></label
        ><label
          v-if="form.penalty_level === 'termination'"
          class="block text-sm text-red-700"
          >输入 {{ preview.identity.psnid }} 确认永久封禁<input
            v-model="form.confirmation"
            class="admin-input mt-2"
            required
        /></label>
        <div class="flex gap-2">
          <button
            class="admin-button admin-danger"
            :disabled="
              busy ||
              !form.reason.trim() ||
              (form.penalty_level === 'termination' &&
                form.confirmation !== preview.identity.psnid)
            "
          >
            {{ busy ? '正在提交…' : '确认处罚' }}</button
          ><button
            type="button"
            class="admin-button"
            :disabled="busy"
            @click="preview = null"
          >
            重新选择
          </button>
        </div>
      </form>
    </div></Dialog
  >
</template>
