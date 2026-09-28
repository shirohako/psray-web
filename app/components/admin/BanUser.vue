<script setup lang="ts">
import {
  Ban,
  CircleCheck,
  Database,
  ExternalLink,
  FileSearch,
  RotateCw,
  Search,
  TriangleAlert,
  ListX,
  UserX,
} from 'lucide'
import {
  adminDate,
  adminDuration,
  adminParseTrophySetIds,
  adminUtf8Bytes,
  BAN_EVIDENCE_MAX,
  PENALTY_LEVELS,
  type BanPreview,
  type BanResult,
  type PenaltyLevel,
  type PurgeCategory,
  type PurgeReport,
} from '~/utils/admin'
/**
 * Penalty flow: pick a level, look up a PSN ID with a dry run, review what
 * will happen and the evidence to keep, then submit. Accounts never synced
 * here are resolved through PSN and only get the penalty. With `psnid` it
 * resubmits that account's termination, which keeps the penalty and retries
 * an unfinished purge.
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
const CATEGORIES: { key: PurgeCategory; label: string; note: string }[] = [
  { key: 'account', label: '账户数据', note: '站内账户数据，删除后无法恢复' },
  { key: 'sync', label: '同步数据', note: '来自 PSN 同步' },
]
function groups(report: PurgeReport | null) {
  return CATEGORIES.map((c) => ({
    ...c,
    items: report?.items.filter((i) => i.category === c.key) ?? [],
    total: report?.totals[c.key] ?? 0,
  })).filter((g) => g.items.length)
}
const LEVEL_LABELS = Object.fromEntries(
  PENALTY_LEVELS.map((l) => [l.value, l.label]),
) as Record<PenaltyLevel, string>
function outcome(r: BanResult) {
  if (r.level === 'ranking_ban')
    return r.user.synced
      ? '已清空该用户的排名，之后不会再上榜；同步、登录与数据不受影响。'
      : '该账号尚未同步到本站，已按 PSN 账号 ID 写入处罚，之后同步进来也不会上榜。'
  return r.purged
    ? '该用户的资料与数据已删除，后续同步与登录都会被拦截。'
    : '该账号尚未同步到本站，已按 PSN 账号 ID 写入处罚，之后的同步与登录都会被拦截。'
}
// Nothing is stored locally for a never-synced account, so no evidence either.
const synced = computed(() => !!preview.value?.user.synced)
const parsed = computed(() => adminParseTrophySetIds(evidenceText.value))
const evidenceStale = computed(
  () => parsed.value.ids.join() !== previewIds.value.join(),
)
const evidenceTooMany = computed(
  () => parsed.value.ids.length > BAN_EVIDENCE_MAX,
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
    <!-- Done -->
    <div v-if="result" class="space-y-5 p-5">
      <div class="flex items-start gap-3">
        <span
          class="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"
        >
          <LucideIcon :icon="CircleCheck" class="size-5" />
        </span>
        <div class="min-w-0 text-[13px]">
          <p class="text-base font-semibold text-slate-950">
            已{{ LEVEL_LABELS[result.level] }} {{ result.user.psnid }}
          </p>
          <p class="mt-0.5 text-slate-500">
            处罚记录
            <span class="font-mono text-slate-700"
              >#{{ result.penalty_id }}</span
            >
            ·
            {{ outcome(result) }}
          </p>
        </div>
      </div>
      <div
        v-if="result.purged"
        class="grid grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200"
      >
        <div v-for="c in CATEGORIES" :key="c.key" class="px-4 py-3">
          <p class="text-xs text-slate-500">已删除{{ c.label }}</p>
          <p class="mt-1 text-xl font-semibold tabular-nums text-slate-950">
            {{ (result.purged.totals[c.key] ?? 0).toLocaleString() }}
            <span class="text-xs font-normal text-slate-400">条</span>
          </p>
        </div>
      </div>
      <p v-if="result.user.synced" class="text-[13px] text-slate-600">
        <template v-if="result.evidence.items.length"
          >已保存
          {{
            result.evidence.items.length
          }}
          个奖杯组的游玩记录作为证据。</template
        ><template v-else>本次未保存作弊证据。</template>
        <template v-if="result.evidence.skipped.length">
          忽略了没有记录的奖杯组：<span class="font-mono text-xs">{{
            result.evidence.skipped.join('、')
          }}</span></template
        >
      </p>
    </div>
    <template v-else>
      <!-- PSN ID lookup -->
      <form
        v-if="!psnid"
        class="border-b border-slate-200 bg-slate-50/70 px-5 py-4"
        @submit.prevent="find"
      >
        <fieldset class="mb-4">
          <legend class="mb-1.5 text-xs font-medium text-slate-700">
            处罚等级
          </legend>
          <div class="grid gap-2 sm:grid-cols-2">
            <label
              v-for="l in PENALTY_LEVELS"
              :key="l.value"
              class="flex cursor-pointer items-start gap-2.5 rounded-lg border bg-white p-3 text-[13px] transition has-disabled:cursor-not-allowed has-disabled:opacity-60"
              :class="
                level === l.value
                  ? l.value === 'termination'
                    ? 'border-red-400 ring-2 ring-red-500/15'
                    : 'border-slate-900 ring-2 ring-slate-900/10'
                  : 'border-slate-200 hover:border-slate-300'
              "
            >
              <input
                type="radio"
                name="admin-ban-level"
                :value="l.value"
                :checked="level === l.value"
                :disabled="busy || loading"
                class="mt-0.5 size-4"
                :class="
                  l.value === 'termination'
                    ? 'accent-red-600'
                    : 'accent-slate-900'
                "
                @change="pick(l.value)"
              />
              <span class="min-w-0">
                <span class="block font-medium text-slate-950">{{
                  l.label
                }}</span>
                <span class="mt-0.5 block text-xs text-slate-500">{{
                  l.effect
                }}</span>
              </span>
            </label>
          </div>
        </fieldset>
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
        <div
          class="flex items-start gap-3 rounded-lg border p-3 text-[13px]"
          :class="
            terminating
              ? 'border-red-200 bg-red-50/60 text-red-900'
              : 'border-amber-200 bg-amber-50/70 text-amber-900'
          "
        >
          <LucideIcon
            :icon="terminating ? UserX : ListX"
            class="mt-px size-4 shrink-0"
            :class="terminating ? 'text-red-600' : 'text-amber-600'"
          />
          <div class="space-y-1">
            <p>
              <b class="font-semibold">{{ LEVEL_LABELS[preview.level] }}</b> ·
              {{ preview.effect }}
            </p>
            <p v-if="!synced">
              该账号尚未同步到本站，将按 PSN 账号 ID
              预先写入处罚，不创建用户、不抓取奖杯。{{
                terminating
                  ? '之后任何人发起的同步都会被拦截。'
                  : '之后照常同步，但不会上榜。'
              }}
            </p>
          </div>
        </div>
        <dl
          class="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-slate-200 p-4 text-[13px] sm:grid-cols-4"
        >
          <div>
            <dt class="text-xs text-slate-500">PSN ID</dt>
            <dd class="mt-0.5 truncate font-medium text-slate-950">
              {{ preview.user.psnid }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">Account ID</dt>
            <dd
              class="mt-0.5 truncate font-mono text-xs text-slate-700"
              :title="preview.user.account_id"
            >
              {{ preview.user.account_id }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">用户 ID</dt>
            <dd class="mt-0.5 font-mono text-xs text-slate-700">
              {{ preview.user.id ?? '未同步' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">注册时间</dt>
            <dd class="mt-0.5 text-slate-700">
              {{
                preview.user.registered_at
                  ? adminDate(preview.user.registered_at)
                  : '未注册'
              }}
            </dd>
          </div>
        </dl>
        <p
          v-if="preview.already_applied"
          class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900"
        >
          <LucideIcon
            :icon="TriangleAlert"
            class="mt-px size-4 shrink-0 text-amber-600"
          />
          该账号已有生效中的{{ LEVEL_LABELS[preview.level] }}。再次提交会沿用原处罚{{
            terminating ? '，并重新执行数据清理' : ''
          }}。
        </p>
        <section v-if="terminating">
          <h3
            class="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-900"
          >
            <LucideIcon
              :icon="Database"
              class="size-4 text-slate-400"
            />将删除的数据
          </h3>
          <p v-if="!preview.purge" class="text-[13px] text-slate-500">
            本站没有该账号的数据，无需清理。
          </p>
          <div v-else class="space-y-3">
            <div
              v-for="group in groups(preview.purge)"
              :key="group.key"
              class="overflow-hidden rounded-lg border"
              :class="
                group.key === 'account' ? 'border-red-200' : 'border-slate-200'
              "
            >
              <div
                class="flex items-center justify-between gap-3 border-b px-3 py-2 text-xs"
                :class="
                  group.key === 'account'
                    ? 'border-red-200 bg-red-50/60 text-red-900'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                "
              >
                <span
                  ><b class="font-semibold">{{ group.label }}</b> ·
                  {{ group.note }}</span
                >
                <span class="font-semibold tabular-nums"
                  >{{ group.total.toLocaleString() }} 条</span
                >
              </div>
              <ul class="divide-y divide-slate-100">
                <li
                  v-for="item in group.items"
                  :key="item.key"
                  class="flex items-start justify-between gap-4 px-3 py-2 text-[13px]"
                  :class="item.count ? '' : 'text-slate-400'"
                >
                  <div class="min-w-0">
                    <p :class="item.count ? 'text-slate-800' : ''">
                      {{ item.label }}
                      <span class="font-mono text-[11px] text-slate-400">{{
                        item.key
                      }}</span>
                    </p>
                    <p
                      v-if="item.impact && item.count"
                      class="mt-0.5 text-xs text-slate-500"
                    >
                      {{ item.impact }}
                    </p>
                  </div>
                  <span class="shrink-0 font-mono text-xs tabular-nums">{{
                    item.count.toLocaleString()
                  }}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
        <section v-if="synced">
          <h3
            class="mb-1 flex items-center gap-2 text-[13px] font-semibold text-slate-900"
          >
            <LucideIcon
              :icon="FileSearch"
              class="size-4 text-slate-400"
            />保留作弊证据
            <span class="font-normal text-slate-400">可选</span>
          </h3>
          <p class="mb-2 text-xs text-slate-500">
            {{ terminating ? '删除前' : '' }}保存该用户在这些奖杯组的游玩记录（进度汇总与每个奖杯的获得时间）。填写奖杯组
            ID 或奖杯页链接，最多 {{ BAN_EVIDENCE_MAX }} 个。
          </p>
          <div class="flex gap-2">
            <input
              v-model="evidenceText"
              class="admin-input font-mono"
              placeholder="例如 7, 8 或 https://…/trophies/7"
              :disabled="busy"
              @keydown.enter.prevent="
                !evidenceTooMany && !parsed.invalid.length && load(parsed.ids)
              "
            />
            <button
              type="button"
              class="admin-button shrink-0"
              :class="evidenceStale ? 'admin-primary' : ''"
              :disabled="
                loading || busy || evidenceTooMany || !!parsed.invalid.length
              "
              @click="load(parsed.ids)"
            >
              <LucideIcon
                :icon="RotateCw"
                class="size-3.5"
                :class="loading ? 'animate-spin' : ''"
              />预览证据
            </button>
          </div>
          <p v-if="parsed.invalid.length" class="mt-1.5 text-xs text-red-600">
            无法识别：<span class="font-mono">{{
              parsed.invalid.join('、')
            }}</span>
          </p>
          <p v-else-if="evidenceTooMany" class="mt-1.5 text-xs text-red-600">
            最多 {{ BAN_EVIDENCE_MAX }} 个奖杯组，当前
            {{ parsed.ids.length }} 个。
          </p>
          <p v-else-if="evidenceStale" class="mt-1.5 text-xs text-amber-700">
            证据奖杯组已修改，预览后才会生效。
          </p>
          <AdminError
            v-if="evidenceError"
            :error="evidenceError"
            class="mt-2"
          />
          <ul
            v-if="preview.evidence.items.length"
            class="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200"
          >
            <li
              v-for="item in preview.evidence.items"
              :key="item.type + item.trophy_set_id"
              class="px-3 py-2.5 text-[13px]"
            >
              <div class="flex items-center justify-between gap-3">
                <a
                  :href="`/trophies/${item.trophy_set_id}`"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex min-w-0 items-center gap-1.5 font-medium text-slate-900 hover:underline"
                  ><span class="truncate">{{ item.trophy_set_name }}</span
                  ><LucideIcon
                    :icon="ExternalLink"
                    class="size-3 shrink-0 text-slate-400"
                /></a>
                <span class="shrink-0 font-mono text-[11px] text-slate-400"
                  >#{{ item.trophy_set_id }}
                  <template v-if="item.platform"
                    >· {{ item.platform }}</template
                  ></span
                >
              </div>
              <p class="mt-1 text-xs text-slate-500">
                <template v-if="item.summary?.earned"
                  >进度 {{ item.summary.progress }}% · 白金
                  {{ item.summary.earned.platinum }} / 金
                  {{ item.summary.earned.gold }} / 银
                  {{ item.summary.earned.silver }} / 铜
                  {{ item.summary.earned.bronze }} · 用时
                  {{ adminDuration(item.summary.duration_seconds * 1000) }} ·
                  {{ adminDate(item.summary.first_earned_at) }} →
                  {{ adminDate(item.summary.last_earned_at) }} · </template
                >{{ item.trophies.length }} 个奖杯的获得时间
              </p>
            </li>
          </ul>
          <p
            v-if="preview.evidence.skipped.length"
            class="mt-2 text-xs text-slate-500"
          >
            以下奖杯组不存在或该用户没有获得记录，将被忽略：<span
              class="font-mono"
              >{{ preview.evidence.skipped.join('、') }}</span
            >
          </p>
        </section>
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
            :placeholder="`留空使用${LEVEL_LABELS[preview.level]}的默认说明`"
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
                  : `确认${LEVEL_LABELS[preview.level]}`
            }}
          </button>
        </template>
      </div></template
    ></Dialog
  >
</template>
