<script setup lang="ts">
import { Ban, RotateCw, Search } from 'lucide'
import {
  adminParseTrophySetIds,
  adminUtf8Bytes,
  PENALTY_LEVEL_LABELS,
} from '~/utils/admin'
import type { BanPreview, BanResult, PenaltyLevel } from '~/types/admin'
/**
 * Penalty flow: pick a level, look up a PSN ID with a dry run, review what
 * will happen and the evidence to keep, then submit. Accounts never synced
 * here are resolved through PSN and only get the penalty. With `psnid` it
 * resubmits that account's termination, which keeps the penalty and retries
 * an unfinished purge. The flow's state lives here; the sections it shows
 * are in `./ban/`.
 */
const props = defineProps<{ psnid?: string }>()
const emit = defineEmits<{ done: [result: BanResult] }>()
const api = useAdminApi()
const open = ref(false),
  // No default: the wrong level can delete an account.
  level = ref<PenaltyLevel | null>(null),
  lookup = ref(''),
  // The PSN ID the current preview was looked up with; it is also submitted.
  target = ref(''),
  preview = ref<BanPreview | null>(null),
  loading = ref(false),
  loadError = ref<any>(null),
  evidenceError = ref<any>(null),
  evidenceText = ref(''),
  // The IDs the current preview was built from; only these are submitted.
  previewIds = ref<number[]>([]),
  reason = ref(''),
  confirmPurge = ref(false),
  busy = ref(false),
  submitError = ref<any>(null),
  result = ref<BanResult | null>(null)
let generation = 0
// Nothing is stored locally for a never-synced account, so no evidence either.
const synced = computed(() => !!preview.value?.user.synced)
const parsed = computed(() => adminParseTrophySetIds(evidenceText.value))
const evidenceStale = computed(
  () => parsed.value.ids.join() !== previewIds.value.join(),
)
const lookupStale = computed(
  () => !props.psnid && lookup.value.trim() !== target.value,
)
const terminating = computed(() => preview.value?.level === 'termination')
const reasonBytes = computed(() => adminUtf8Bytes(reason.value.trim()))
const ready = computed(
  () =>
    !!preview.value &&
    (!preview.value.requires_account_confirmation || confirmPurge.value) &&
    reasonBytes.value <= 255 &&
    !lookupStale.value &&
    !evidenceStale.value &&
    !parsed.value.invalid.length &&
    !loading.value &&
    !busy.value,
)
const blocker = computed(() => {
  if (!preview.value || result.value) return ''
  if (lookupStale.value) return 'PSN ID 已修改，请重新查询'
  if (parsed.value.invalid.length) return '证据奖杯组有无法识别的内容'
  if (evidenceStale.value) return '证据奖杯组已修改，请先重新预览'
  if (reasonBytes.value > 255) return '处罚理由超过 255 字节'
  if (preview.value.requires_account_confirmation && !confirmPurge.value)
    return '勾选确认删除账户数据'
  return ''
})
function hint(error: any, submitting = false) {
  switch (error?.status) {
    case 400:
      return '该账号已被永久停用，无需再禁止排名。'
    case 403:
      return '管理员与版主不能被处罚，需先撤销其角色。'
    case 404:
      return 'PSN 上找不到该用户，请核对 PSN ID。未写入处罚。'
    case 409:
      return '该账号正在被处理，请稍后重试。'
    case 429:
      return '操作过于频繁，请稍后再试。'
    case 500:
      if (error.code === 'PSN_PROFILE_FAILED')
        return 'PSN 资料查询失败，未写入处罚，可稍后重试。'
      return submitting
        ? '处罚已经生效，但数据清理未完成。排查后再次提交即可重试清理。'
        : ''
    default:
      return ''
  }
}
async function load(ids: number[]) {
  const current = ++generation
  loading.value = true
  evidenceError.value = null
  const body: Record<string, unknown> = {
    psnid: target.value,
    level: level.value,
    dry_run: true,
  }
  if (ids.length) body.evidence_trophy_set_ids = ids
  try {
    const data = await api.write<BanPreview>('/bans', body)
    if (current !== generation) return
    preview.value = data
    previewIds.value = ids
    loadError.value = null
  } catch (e) {
    if (current !== generation) return
    if (preview.value) evidenceError.value = e
    else loadError.value = e
  } finally {
    if (current === generation) loading.value = false
  }
}
function reset() {
  preview.value = null
  loadError.value = null
  evidenceError.value = null
  evidenceText.value = ''
  previewIds.value = []
  confirmPurge.value = false
  submitError.value = null
  result.value = null
}
function start() {
  reset()
  reason.value = ''
  level.value = props.psnid ? 'termination' : null
  lookup.value = props.psnid ?? ''
  target.value = props.psnid ?? ''
  open.value = true
  if (props.psnid) load([])
}
function find() {
  const psnid = lookup.value.trim()
  if (!psnid || !level.value || loading.value || busy.value) return
  reset()
  target.value = psnid
  load([])
}
async function submit() {
  if (!ready.value || !preview.value) return
  busy.value = true
  submitError.value = null
  const body: Record<string, unknown> = {
    psnid: target.value,
    level: preview.value.level,
  }
  if (preview.value.requires_account_confirmation)
    body.confirm_account_purge = true
  if (reason.value.trim()) body.reason = reason.value.trim()
  if (previewIds.value.length) body.evidence_trophy_set_ids = previewIds.value
  try {
    result.value = await api.write<BanResult>('/bans', body)
  } catch (e) {
    submitError.value = e
  } finally {
    busy.value = false
  }
}
// A new level changes the whole preview; evidence carries over.
function pick(value: PenaltyLevel) {
  level.value = value
  if (!target.value || busy.value || result.value) return
  preview.value = null
  loadError.value = null
  submitError.value = null
  confirmPurge.value = false
  load(previewIds.value)
}
// The list reloads once the dialog shuts, so the admin sees the result first.
watch(open, (value) => {
  if (!value && result.value) emit('done', result.value)
})
</script>
<template>
  <button
    type="button"
    class="admin-button"
    :class="psnid ? '' : 'admin-danger'"
    @click="start"
  >
    <LucideIcon :icon="psnid ? RotateCw : Ban" class="size-3.5" />{{
      psnid ? '重新清理' : '处罚用户'
    }}</button
  ><Dialog v-model:open="open" size="2xl"
    ><template #title
      >{{ psnid ? '重新清理' : '处罚用户' }}
      <span
        v-if="psnid"
        class="ml-1 font-mono text-xs font-normal text-slate-400"
        >{{ psnid }}</span
      ></template
    >
    <AdminBanResult v-if="result" :result="result" />
    <template v-else>
      <!-- PSN ID lookup -->
      <form
        v-if="!psnid"
        class="border-b border-slate-200 bg-slate-50/70 px-5 py-4"
        @submit.prevent="find"
      >
        <AdminBanLevelPicker
          :model-value="level"
          :disabled="busy || loading"
          @update:model-value="pick"
        />
        <label
          for="admin-ban-lookup"
          class="mb-1.5 block text-xs font-medium text-slate-700"
          >PSN ID</label
        >
        <div class="flex gap-2">
          <input
            id="admin-ban-lookup"
            v-model="lookup"
            :disabled="busy"
            autocomplete="off"
            spellcheck="false"
            maxlength="64"
            placeholder="输入要处罚的 PSN ID"
            class="admin-input font-mono"
          />
          <button
            class="admin-button shrink-0"
            :class="lookupStale && lookup.trim() ? 'admin-primary' : ''"
            :disabled="!level || !lookup.trim() || loading || busy"
            :title="level ? undefined : '先选择处罚等级'"
          >
            <LucideIcon :icon="Search" class="size-3.5" />查询
          </button>
        </div>
        <p class="mt-1.5 text-xs text-slate-500">
          支持尚未同步到本站的账号：本地没有时经 PSN
          资料解析身份，只写入处罚，不创建用户、不抓取奖杯。
        </p>
      </form>
      <!-- Preview unavailable -->
      <div v-if="loadError" class="space-y-3 p-5">
        <AdminError :error="loadError" />
        <p v-if="hint(loadError)" class="text-[13px] text-slate-600">
          {{ hint(loadError) }}
        </p>
      </div>
      <div
        v-else-if="!preview && loading"
        class="space-y-3 p-5"
        aria-busy="true"
      >
        <div class="h-0.5 overflow-hidden rounded-full bg-slate-100">
          <div class="animate-admin-progress h-full w-1/3 bg-slate-900" />
        </div>
        <div
          v-for="i in 4"
          :key="i"
          class="h-9 animate-pulse rounded-md bg-slate-100"
        />
      </div>
      <!-- Form -->
      <form
        v-else-if="preview"
        id="admin-ban-form"
        class="space-y-5 p-5"
        @submit.prevent="submit"
      >
        <AdminBanSummary :preview="preview" />
        <AdminBanPurgeReport v-if="terminating" :report="preview.purge" />
        <AdminBanEvidence
          v-if="synced"
          v-model="evidenceText"
          :preview="preview"
          :parsed="parsed"
          :stale="evidenceStale"
          :error="evidenceError"
          :loading="loading"
          :busy="busy"
          @load="load"
        />
        <div>
          <div class="mb-1.5 flex items-baseline justify-between">
            <label
              for="admin-ban-reason"
              class="text-xs font-medium text-slate-700"
              >处罚理由
              <span class="font-normal text-slate-400">可选</span></label
            >
            <span
              class="text-[11px] tabular-nums"
              :class="reasonBytes > 255 ? 'text-red-600' : 'text-slate-400'"
              >{{ reasonBytes }} / 255 字节</span
            >
          </div>
          <textarea
            id="admin-ban-reason"
            v-model="reason"
            :disabled="busy"
            :placeholder="`留空使用${PENALTY_LEVEL_LABELS[preview.level]}的默认说明`"
            class="admin-input"
          />
        </div>
        <label
          v-if="preview.requires_account_confirmation"
          class="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-[13px] text-slate-700"
        >
          <input
            v-model="confirmPurge"
            type="checkbox"
            :disabled="busy"
            class="mt-0.5 size-4 accent-red-600"
          />
          <span
            >确认删除账户数据：该用户已在本站注册，上方「账户数据」各项将被永久删除，<b
              class="text-red-700"
              >无法恢复</b
            >。</span
          >
        </label>
        <div v-if="submitError" class="space-y-1.5">
          <AdminError :error="submitError" />
          <p v-if="hint(submitError, true)" class="text-xs text-slate-600">
            {{ hint(submitError, true) }}
          </p>
        </div>
      </form>
    </template>
    <template #footer
      ><div class="flex items-center justify-end gap-2">
        <template v-if="result">
          <button
            type="button"
            class="admin-button admin-primary"
            @click="open = false"
          >
            完成
          </button>
        </template>
        <template v-else>
          <span
            v-if="blocker"
            class="mr-auto hidden text-xs text-slate-400 sm:inline"
            >{{ blocker }}</span
          >
          <button type="button" class="admin-button" @click="open = false">
            取消
          </button>
          <button
            v-if="preview"
            form="admin-ban-form"
            class="admin-button"
            :class="terminating ? 'admin-danger' : 'admin-primary'"
            :disabled="!ready"
          >
            {{
              busy
                ? '正在提交…'
                : preview.already_applied && terminating
                  ? '重新清理'
                  : `确认${PENALTY_LEVEL_LABELS[preview.level]}`
            }}
          </button>
        </template>
      </div></template
    ></Dialog
  >
</template>
