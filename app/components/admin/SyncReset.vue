<script setup lang="ts">
import {
  CircleCheck,
  Database,
  ExternalLink,
  Loader,
  RotateCcw,
  Search,
  TriangleAlert,
} from 'lucide'
import {
  adminDate,
  type SyncResetPreview,
  type SyncResetResult,
} from '~/utils/admin'
/**
 * Reset any user's synced PSN data: look up a PSN ID with a dry run, review
 * the current stats and what will be deleted, then submit. Same flow as the
 * self-service reset in /settings/data, minus the cooldown. A panel of the
 * user-data page (`/admin/user-data`).
 */
const api = useAdminApi()
const lookup = ref(''),
  // The PSN ID the current preview was looked up with; it is also submitted.
  target = ref(''),
  preview = ref<SyncResetPreview | null>(null),
  loading = ref(false),
  loadError = ref<any>(null),
  busy = ref(false),
  submitError = ref<any>(null),
  result = ref<SyncResetResult | null>(null)
let generation = 0
const lookupStale = computed(() => lookup.value.trim() !== target.value)
const ready = computed(
  () =>
    !!preview.value &&
    !preview.value.syncing &&
    !lookupStale.value &&
    !loading.value &&
    !busy.value,
)
const blocker = computed(() => {
  if (!preview.value) return ''
  if (lookupStale.value) return 'PSN ID 已修改，请重新查询'
  if (preview.value.syncing) return '该用户正在同步，结束后重新查询'
  return ''
})
// Every refusal is decided before anything is deleted, so say so.
function hint(error: any) {
  switch (error?.code) {
    case 'USER_NOT_FOUND':
      return '本站没有这个 PSN ID 的用户。只能清空已同步过的用户，请核对大小写或先让对方同步一次。'
    case 'SYNC_IN_PROGRESS':
      return '该用户正在排队或同步中，或同一用户的清空正在处理。数据未被清空，等同步结束后重新查询。'
    case 'SYNC_WORKER_UNAVAILABLE':
      return 'Horizon 没有在运行，清空后无法重新同步，所以没有执行。数据未被清空。'
    case 'PSN_PROFILE_PRIVATE':
      return '对方的 PSN 奖杯未公开，无法重新同步，所以没有清空；已同步的数据按手动同步的规则被标为私密。'
    case 'PSN_PROFILE_FAILED':
      return 'PSN 资料拉取失败，数据未被清空，可稍后重试。'
    case 'LEVEL_BELOW_MINIMUM':
      return '对方的奖杯等级低于同步门槛，无法重新同步，数据未被清空。'
    case 'ACCOUNT_TERMINATED':
      return '该账号已被永久停用，不能同步。'
    default:
      return ''
  }
}
async function load() {
  const current = ++generation
  loading.value = true
  loadError.value = null
  try {
    const data = await api.write<SyncResetPreview>('/sync-resets', {
      psnid: target.value,
      dry_run: true,
    })
    if (current !== generation) return
    preview.value = data
  } catch (e) {
    if (current !== generation) return
    loadError.value = e
  } finally {
    if (current === generation) loading.value = false
  }
}
function find() {
  const psnid = lookup.value.trim()
  if (!psnid || loading.value || busy.value) return
  preview.value = null
  submitError.value = null
  result.value = null
  target.value = psnid
  load()
}
async function submit() {
  if (!ready.value) return
  busy.value = true
  submitError.value = null
  try {
    result.value = await api.write<SyncResetResult>('/sync-resets', {
      psnid: target.value,
    })
    preview.value = null
  } catch (e) {
    submitError.value = e
  } finally {
    busy.value = false
  }
}
function again() {
  result.value = null
  lookup.value = ''
  target.value = ''
}
const stats = (u: SyncResetPreview['user']) => [
  { label: '游戏数', value: u.played_game_count.toLocaleString() },
  { label: '奖杯数', value: u.trophy_count.toLocaleString() },
  { label: '积分', value: u.points.toLocaleString() },
  { label: '排名', value: u.rank ? `#${u.rank.toLocaleString()}` : '—' },
]
</script>
<template>
  <section class="admin-panel overflow-hidden">
    <header class="admin-panel-head py-3">
      <div class="min-w-0">
        <h2 class="admin-panel-title">
          <LucideIcon :icon="RotateCcw" class="size-4 text-slate-400" />清空同步数据
        </h2>
        <p class="mt-0.5 text-xs text-slate-500">
          清空已同步的 PSN 数据并从零全量同步，用于修复数据有误的用户。与用户自助清空同一流程，但可以清空任何人的、没有冷却。
        </p>
      </div>
    </header>
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
            已清空 {{ result.user.psnid }} 的同步数据
          </p>
          <p class="mt-0.5 text-slate-500">
            删除
            <span class="font-semibold tabular-nums text-slate-700">{{
              (result.purged.totals.sync ?? 0).toLocaleString()
            }}</span>
            条记录，积分与排名已归零，已排入全量同步（队列
            <span class="font-mono text-slate-700">#{{ result.queue_id }}</span
            >）。
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <a
          :href="`/sync?psnid=${encodeURIComponent(result.user.psnid)}`"
          target="_blank"
          rel="noopener"
          class="admin-button"
          ><LucideIcon :icon="ExternalLink" class="size-3.5" />查看同步进度</a
        >
        <a
          :href="`/p/${encodeURIComponent(result.user.psnid)}`"
          target="_blank"
          rel="noopener"
          class="admin-button"
          ><LucideIcon :icon="ExternalLink" class="size-3.5" />资料页</a
        >
        <button type="button" class="admin-button admin-primary" @click="again">
          继续清空其他用户
        </button>
      </div>
    </div>
    <template v-else>
      <!-- PSN ID lookup -->
      <form
        class="border-b border-slate-200 bg-slate-50/70 px-5 py-4"
        @submit.prevent="find"
      >
        <label
          for="admin-sync-reset-lookup"
          class="mb-1.5 block text-xs font-medium text-slate-700"
          >PSN ID</label
        >
        <div class="flex max-w-xl gap-2">
          <input
            id="admin-sync-reset-lookup"
            v-model="lookup"
            :disabled="busy"
            autocomplete="off"
            spellcheck="false"
            maxlength="64"
            placeholder="输入要清空的 PSN ID"
            class="admin-input font-mono"
          />
          <button
            class="admin-button shrink-0"
            :class="lookupStale && lookup.trim() ? 'admin-primary' : ''"
            :disabled="!lookup.trim() || loading || busy"
          >
            <LucideIcon :icon="Search" class="size-3.5" />查询
          </button>
        </div>
        <p class="mt-1.5 text-xs text-slate-500">
          只能是本站已同步过的用户。查询只做预览，不会改动任何数据。
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
          v-for="i in 3"
          :key="i"
          class="h-9 animate-pulse rounded-md bg-slate-100"
        />
      </div>
      <p v-else-if="!preview" class="p-5 text-[13px] text-slate-500">
        输入 PSN ID 并查询，确认该用户当前的数据与将删除的内容后再执行。
      </p>
      <!-- Preview -->
      <div v-else class="space-y-5 p-5">
        <p
          v-if="preview.syncing"
          class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900"
        >
          <LucideIcon
            :icon="Loader"
            class="mt-px size-4 shrink-0 text-amber-600"
          />
          该用户正在排队或同步中，不能清空。等这次同步结束后重新查询。
        </p>
        <div
          v-else
          class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/60 p-3 text-[13px] text-red-900"
        >
          <LucideIcon
            :icon="TriangleAlert"
            class="mt-px size-4 shrink-0 text-red-600"
          />
          <ul class="list-disc space-y-0.5 pl-4">
            <li>
              下方同步数据将被删除，积分、奖杯等级与排名立即归零，随后排入一次全量同步。
            </li>
            <li>
              账户、绑定邮箱、关注与奖杯攻略不受影响；不会改动对方自助清空的冷却。
            </li>
            <li>奖杯多的用户重新同步耗时较长，期间资料页数据不完整。</li>
          </ul>
        </div>
        <dl
          class="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-slate-200 p-4 text-[13px] sm:grid-cols-4"
        >
          <div>
            <dt class="text-xs text-slate-500">PSN ID</dt>
            <dd class="mt-0.5 truncate font-medium text-slate-950">
              <a
                :href="`/p/${encodeURIComponent(preview.user.psnid)}`"
                target="_blank"
                rel="noopener"
                class="hover:underline"
                >{{ preview.user.psnid }}</a
              >
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
            <dt class="text-xs text-slate-500">注册时间</dt>
            <dd class="mt-0.5 text-slate-700">
              {{
                preview.user.registered_at
                  ? adminDate(preview.user.registered_at)
                  : '未注册'
              }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-500">最近同步</dt>
            <dd class="mt-0.5 text-slate-700">
              {{
                preview.user.last_synced_at
                  ? adminDate(preview.user.last_synced_at)
                  : '—'
              }}
            </dd>
          </div>
          <div v-for="s in stats(preview.user)" :key="s.label">
            <dt class="text-xs text-slate-500">{{ s.label }}</dt>
            <dd class="mt-0.5 font-medium tabular-nums text-slate-950">
              {{ s.value }}
            </dd>
          </div>
        </dl>
        <section>
          <h3
            class="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-900"
          >
            <LucideIcon :icon="Database" class="size-4 text-slate-400" />将删除的数据
            <span class="font-normal tabular-nums text-slate-400"
              >{{ preview.purge.totals.sync.toLocaleString() }} 条</span
            >
          </h3>
          <ul
            class="divide-y divide-slate-100 rounded-lg border border-slate-200"
          >
            <li
              v-for="item in preview.purge.items"
              :key="item.key"
              class="flex items-center justify-between gap-4 px-3 py-2 text-[13px]"
              :class="item.count ? 'text-slate-800' : 'text-slate-400'"
            >
              <span
                >{{ item.label }}
                <span class="font-mono text-[11px] text-slate-400">{{
                  item.key
                }}</span></span
              >
              <span class="shrink-0 font-mono text-xs tabular-nums">{{
                item.count.toLocaleString()
              }}</span>
            </li>
          </ul>
        </section>
        <div v-if="submitError" class="space-y-1.5">
          <AdminError :error="submitError" />
          <p v-if="hint(submitError)" class="text-xs text-slate-600">
            {{ hint(submitError) }}
          </p>
        </div>
        <div
          class="-mx-5 -mb-5 flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3"
        >
          <span
            v-if="blocker"
            class="mr-auto hidden text-xs text-slate-400 sm:inline"
            >{{ blocker }}</span
          >
          <button
            v-if="preview.syncing"
            type="button"
            class="admin-button"
            :disabled="loading"
            @click="load"
          >
            重新查询
          </button>
          <button
            type="button"
            class="admin-button admin-danger"
            :disabled="!ready"
            @click="submit"
          >
            {{ busy ? '正在清空…' : '确认清空并重新同步' }}
          </button>
        </div>
      </div>
    </template>
  </section>
</template>
