<script setup lang="ts">
import { ArrowLeft, CircleCheck, ExternalLink, Gamepad2, ImageOff, Lock, RefreshCw, RotateCcw, Save, Trash2, TriangleAlert } from 'lucide'
import type { AdminGameDetail, AdminGameLockedField, AdminGameSummary, AdminPlatform } from '~/types/admin'
import { adminDate } from '~/utils/admin'
import {
  cancelRestore,
  draftFromGame,
  GAME_LANGUAGES,
  GAME_LOCK_LABELS,
  GAME_LOCKABLE,
  gameSavePayload,
  gameSignature,
  lockPlan,
  restoreFromIgdb,
  type GameDraft,
} from '~/utils/adminGame'

/**
 * Edit one game: names, cover, summary, aliases, releases and the first
 * release date, plus its trophy sets. Saved whole with the revision it was
 * loaded at (a concurrent save comes back as a conflict). Changing a field
 * IGDB refreshes locks it; "restore IGDB" hands it back
 * (docs/api/admin/games/README.md#人工修改优先).
 */
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })

const api = useAdminApi()
const route = useRoute()
const id = computed(() => Number(route.params.id))

const game = ref<AdminGameDetail | null>(null)
const draft = ref<GameDraft | null>(null)
const saved = ref<GameDraft | null>(null)
const savedSignature = ref('')
const loading = ref(false)
const loadError = ref<any>(null)
const platforms = ref<AdminPlatform[]>([])

function withLanguages(value: GameDraft): GameDraft {
  for (const language of GAME_LANGUAGES) value.translations[language.code] ??= { name: '', summary: null }
  return value
}
function seed(detail: AdminGameDetail) {
  game.value = detail
  draft.value = withLanguages(draftFromGame(detail))
  saved.value = withLanguages(draftFromGame(detail))
  savedSignature.value = gameSignature(saved.value, detail.locked_fields)
}

async function load() {
  loading.value = true
  loadError.value = null
  try {
    const [detail, catalog] = await Promise.all([
      api.get<AdminGameDetail>(`/games/${id.value}`),
      platforms.value.length ? Promise.resolve(platforms.value) : api.get<AdminPlatform[]>('/games/platforms'),
    ])
    platforms.value = catalog
    seed(detail)
  } catch (e) {
    loadError.value = e
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(id, load)

const locked = computed(() => game.value?.locked_fields ?? [])
const dirty = computed(() => !!draft.value && gameSignature(draft.value, locked.value) !== savedSignature.value)
const plan = computed(() => draft.value && saved.value
  ? lockPlan(saved.value, draft.value, locked.value)
  : { releases: 'free', first_release_date: 'free', summary: 'free', aliases: 'free' } as const)
const igdbSource = computed(() => game.value?.sources.find(s => s.source === 'igdb') ?? null)
const nameMissing = computed(() => !draft.value?.name.trim())
const canSave = computed(() => dirty.value && !saving.value && !nameMissing.value)
const languages = computed(() => {
  const extra = Object.keys(draft.value?.translations ?? {})
    .filter(code => !GAME_LANGUAGES.some(l => l.code === code))
    .sort()
    .map(code => ({ code, label: code }))
  return [...GAME_LANGUAGES, ...extra]
})
const pending = computed(() => GAME_LOCKABLE.filter(field => plan.value[field] === 'lock' || plan.value[field] === 'unlock'))
const summaryHint = computed(() => {
  const igdbSummary = game.value?.igdb?.summary
  if (!igdbSummary || plan.value.summary === 'free' || plan.value.summary === 'unlock') return null
  return igdbSummary.trim() === draft.value?.summary.trim() ? null : igdbSummary
})

function restore(field: AdminGameLockedField) {
  if (draft.value) draft.value = restoreFromIgdb(draft.value, field, game.value?.igdb ?? null)
}
function cancel(field: AdminGameLockedField) {
  if (draft.value && saved.value) draft.value = cancelRestore(draft.value, saved.value, field)
}
function discard() {
  if (game.value) seed(game.value)
}

const coverBroken = ref(false)
watch(() => draft.value?.coverUrl, () => { coverBroken.value = false })

// ── Save ────────────────────────────────────────────────────────────────────
const saving = ref(false)
const saveError = ref<any>(null)
const conflict = ref(false)
const savedNotice = ref<{ locked: AdminGameLockedField[], unlocked: AdminGameLockedField[] } | null>(null)
async function save() {
  if (!game.value || !draft.value || !canSave.value) return
  saving.value = true
  saveError.value = null
  conflict.value = false
  try {
    const result = await api.write<AdminGameDetail & { changes: { locked: AdminGameLockedField[], unlocked: AdminGameLockedField[] } }>(
      `/games/${id.value}`,
      gameSavePayload(game.value.revision, draft.value, locked.value),
      'put',
    )
    const { changes, ...detail } = result
    seed(detail)
    savedNotice.value = changes
  } catch (e: any) {
    if (e?.code === 'GAME_CONFLICT') conflict.value = true
    else saveError.value = e
  } finally {
    saving.value = false
  }
}

function onKey(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    save()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
onBeforeRouteLeave(() => {
  if (dirty.value && !window.confirm('有未保存的修改，确定离开吗？')) return false
})

// ── Refresh from IGDB, reload after trophy-set changes ──────────────────────
const busy = ref(false)
const actionError = ref<any>(null)
const refreshNotice = ref<{ releases: number, aliases: number, summary: boolean } | null>(null)
async function refreshFromIgdb() {
  if (dirty.value && !window.confirm('从 IGDB 刷新会重新加载编辑器，未保存的修改会丢失。继续吗？')) return
  busy.value = true
  actionError.value = null
  try {
    const result = await api.write<{ changes: { releases: number, aliases: number, summary: boolean }, game: AdminGameDetail }>(`/games/${id.value}/refresh`, {})
    seed(result.game)
    refreshNotice.value = result.changes
    savedNotice.value = null
  } catch (e) {
    actionError.value = e
  } finally {
    busy.value = false
  }
}
async function reloadTrophySets() {
  try {
    const detail = await api.get<AdminGameDetail>(`/games/${id.value}`)
    if (game.value) game.value = { ...game.value, trophy_sets: detail.trophy_sets }
  } catch (e) {
    actionError.value = e
  }
}

// ── Delete ──────────────────────────────────────────────────────────────────
const deleteOpen = ref(false)
const deleteError = ref<any>(null)
const moveMode = ref<'unlink' | 'move'>('unlink')
const moveTarget = ref<AdminGameSummary | null>(null)
const pickerOpen = ref(false)
function openDelete() {
  deleteOpen.value = true
  deleteError.value = null
  moveMode.value = 'unlink'
  moveTarget.value = null
}
function pickTarget(target: AdminGameSummary) {
  moveTarget.value = target
  moveMode.value = 'move'
  pickerOpen.value = false
}
async function destroy() {
  if (moveMode.value === 'move' && !moveTarget.value) return
  busy.value = true
  deleteError.value = null
  try {
    const query = moveMode.value === 'move' && moveTarget.value ? `?move_trophy_sets_to=${moveTarget.value.id}` : ''
    await api.remove(`/games/${id.value}${query}`)
    deleteOpen.value = false
    if (saved.value) draft.value = saved.value  // nothing left to lose
    await navigateTo(moveTarget.value && moveMode.value === 'move' ? `/admin/games/${moveTarget.value.id}` : '/admin/games')
  } catch (e) {
    deleteError.value = e
  } finally {
    busy.value = false
  }
}

const fieldTone = (state: string) => state === 'locked' || state === 'lock' ? 'border-amber-200 bg-amber-50/40' : ''
</script>

<template>
  <AdminPageHeader :icon="Gamepad2" :title="game?.name ?? '游戏'">
    <NuxtLink to="/admin/games" class="admin-button"><LucideIcon :icon="ArrowLeft" class="size-3.5" />全部游戏</NuxtLink>
    <template v-if="game">
      <a :href="`/games/${game.id}`" target="_blank" rel="noopener" class="admin-button"><LucideIcon :icon="ExternalLink" class="size-3.5" />前台</a>
      <button v-if="igdbSource" type="button" class="admin-button" :disabled="busy" title="立即拉取 IGDB 的最新数据，人工修改过的字段不动" @click="refreshFromIgdb">
        <LucideIcon :icon="RefreshCw" class="size-3.5" :class="busy ? 'animate-spin' : ''" />从 IGDB 刷新
      </button>
      <button type="button" class="admin-button" @click="openDelete"><LucideIcon :icon="Trash2" class="size-3.5" />删除</button>
      <button type="button" class="admin-button admin-primary" :disabled="!canSave" @click="save">
        <LucideIcon :icon="Save" class="size-3.5" />{{ saving ? '正在保存…' : '保存' }}
      </button>
    </template>
  </AdminPageHeader>

  <AdminError :error="loadError" />
  <div v-if="loading && !game" class="admin-panel space-y-3 p-4" aria-busy="true">
    <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded-md bg-slate-100" />
  </div>

  <template v-else-if="game && draft && saved">
    <!-- Identity tags -->
    <div class="-mt-2 flex flex-wrap items-center gap-1.5">
      <span class="admin-count">#{{ game.id }}</span>
      <a v-if="igdbSource" :href="igdbSource.url ?? `https://www.igdb.com/games/${igdbSource.external_id}`" target="_blank" rel="noopener" class="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-px text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
        <LucideIcon :icon="ExternalLink" class="size-3" />IGDB {{ igdbSource.external_id }}
      </a>
      <span v-if="igdbSource?.synced_at" class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-px text-[11px] font-semibold text-slate-600">
        <LucideIcon :icon="RefreshCw" class="size-3" />同步于 {{ adminDate(igdbSource.synced_at).slice(0, 10) }}
      </span>
      <span v-if="!igdbSource" class="rounded-full bg-slate-100 px-2 py-px text-[11px] font-semibold text-slate-600">手动创建</span>
      <span v-for="field in locked" :key="field" class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-px text-[11px] font-semibold text-amber-700">
        <LucideIcon :icon="Lock" class="size-3" />{{ GAME_LOCK_LABELS[field] }}
      </span>
    </div>

    <AdminError :error="actionError" />
    <AdminError :error="saveError" />
    <div v-if="conflict" class="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50/70 p-3 text-[13px] text-red-900">
      <LucideIcon :icon="TriangleAlert" class="size-4 shrink-0" />
      <span class="flex-1">这个游戏在你打开之后被保存过。重新加载后再改一次；你这次的修改不会被保存。</span>
      <button type="button" class="admin-button" @click="conflict = false; load()"><LucideIcon :icon="RefreshCw" class="size-3.5" />重新加载</button>
    </div>
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1">
      <div v-if="savedNotice && !dirty" class="flex flex-wrap items-center gap-2 text-xs text-emerald-700">
        <LucideIcon :icon="CircleCheck" class="size-3.5" />已保存
        <template v-if="savedNotice.locked.length">
          <span class="text-slate-500">锁定，IGDB 刷新不再覆盖：</span>
          <span v-for="field in savedNotice.locked" :key="field" class="rounded-full bg-amber-50 px-2 py-px font-semibold text-amber-700">{{ GAME_LOCK_LABELS[field] }}</span>
        </template>
        <template v-if="savedNotice.unlocked.length">
          <span class="text-slate-500">恢复跟随 IGDB：</span>
          <span v-for="field in savedNotice.unlocked" :key="field" class="rounded-full bg-slate-100 px-2 py-px font-semibold text-slate-600">{{ GAME_LOCK_LABELS[field] }}</span>
        </template>
      </div>
    </Transition>
    <div v-if="refreshNotice && !dirty" class="flex flex-wrap items-center gap-2 text-xs text-emerald-700">
      <LucideIcon :icon="CircleCheck" class="size-3.5" />已从 IGDB 刷新
      <span class="rounded-full bg-slate-100 px-2 py-px font-semibold text-slate-600">发售信息 {{ refreshNotice.releases }} 条</span>
      <span class="rounded-full bg-slate-100 px-2 py-px font-semibold text-slate-600">新增别名 {{ refreshNotice.aliases }} 个</span>
      <span v-if="refreshNotice.summary" class="rounded-full bg-slate-100 px-2 py-px font-semibold text-slate-600">补上了简介</span>
      <span v-if="locked.length" class="text-slate-500">人工修改过的字段没有变</span>
    </div>

    <!-- Basic info -->
    <section class="admin-panel">
      <header class="admin-panel-head"><h2 class="admin-panel-title">基本信息</h2></header>
      <div class="flex flex-col gap-4 p-4 sm:flex-row">
        <div class="flex shrink-0 flex-col items-center gap-1.5">
          <img v-if="draft.coverUrl && !coverBroken" :src="draft.coverUrl" alt="" class="h-32 w-24 rounded-lg bg-slate-100 object-cover ring-1 ring-slate-200" @error="coverBroken = true" />
          <span v-else class="grid h-32 w-24 place-items-center rounded-lg bg-slate-100 text-slate-400"><LucideIcon :icon="ImageOff" class="size-5" /></span>
          <span class="text-[11px] text-slate-400">封面</span>
        </div>
        <div class="grid min-w-0 flex-1 gap-4 lg:grid-cols-2">
          <div>
            <label for="game-name" class="mb-1.5 block text-xs font-medium text-slate-700">默认名称</label>
            <input id="game-name" v-model="draft.name" maxlength="255" class="admin-input" :class="nameMissing ? 'border-red-300' : ''" />
          </div>
          <div>
            <label for="game-cover" class="mb-1.5 block text-xs font-medium text-slate-700">封面地址</label>
            <input id="game-cover" v-model="draft.coverUrl" maxlength="512" class="admin-input" placeholder="https://" />
          </div>
          <div class="lg:col-span-2">
            <div class="mb-1.5 flex items-center justify-between gap-3">
              <label for="game-summary" class="text-xs font-medium text-slate-700">简介</label>
              <AdminLockState v-if="igdbSource" :state="plan.summary" source="IGDB" @restore="restore('summary')" @cancel="cancel('summary')" />
            </div>
            <textarea id="game-summary" v-model="draft.summary" maxlength="10000" class="admin-input min-h-20" :class="fieldTone(plan.summary)" placeholder="可选" />
            <p v-if="summaryHint" class="mt-1.5 line-clamp-2 text-xs text-slate-500"><span class="text-slate-400">IGDB 当前：</span>{{ summaryHint }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Names -->
    <section class="admin-panel">
      <header class="admin-panel-head">
        <h2 class="admin-panel-title">各语言名称</h2>
        <span class="text-xs text-slate-400">没填的语言显示默认名称</span>
      </header>
      <div class="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div v-for="language in languages" :key="language.code">
          <label :for="`game-name-${language.code}`" class="mb-1.5 block text-xs font-medium text-slate-700">{{ language.label }}</label>
          <input :id="`game-name-${language.code}`" v-model="draft.translations[language.code]!.name" maxlength="255" class="admin-input" :placeholder="draft.name" :lang="language.code" />
        </div>
      </div>
    </section>

    <!-- Aliases -->
    <section class="admin-panel">
      <header class="admin-panel-head">
        <h2 class="admin-panel-title">别名<span class="admin-count">{{ draft.aliases.length }}</span></h2>
        <AdminLockState v-if="igdbSource" :state="plan.aliases" source="IGDB" @restore="restore('aliases')" @cancel="cancel('aliases')" />
      </header>
      <div class="p-4">
        <AdminTagInput v-model="draft.aliases" placeholder="添加别名后回车" />
        <p class="mt-2 text-xs text-slate-400">用于搜索和自动匹配奖杯组。与默认名称、各语言名称相同的会被去掉。</p>
      </div>
    </section>

    <AdminGameReleases
      v-model:releases="draft.releases"
      v-model:first-mode="draft.firstMode"
      v-model:first-date="draft.firstDate"
      v-model:first-precision="draft.firstPrecision"
      :platforms="platforms"
      :releases-state="plan.releases"
      :first-state="plan.first_release_date"
      :igdb="game.igdb?.releases ?? null"
      :stored="{ date: game.first_release_date, precision: game.first_release_precision }"
      :has-igdb="!!igdbSource"
      @restore="restore"
      @cancel="cancel"
    />

    <AdminGameTrophySets :game-id="game.id" :sets="game.trophy_sets" @changed="reloadTrophySets" />

    <!-- Sticky save bar while there are changes -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-4 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div v-if="dirty" class="sticky bottom-4 z-20 mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur">
        <p class="flex flex-1 flex-wrap items-center gap-1.5 text-[13px] text-slate-700">
          <span>未保存的修改</span>
          <template v-for="field in pending" :key="field">
            <span v-if="plan[field] === 'lock'" class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-px text-[11px] font-semibold text-amber-700"><LucideIcon :icon="Lock" class="size-3" />{{ GAME_LOCK_LABELS[field] }}</span>
            <span v-else class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-px text-[11px] font-semibold text-slate-600"><LucideIcon :icon="RotateCcw" class="size-3" />{{ GAME_LOCK_LABELS[field] }}</span>
          </template>
          <span v-if="igdbSource && pending.some(f => plan[f] === 'lock')" class="text-xs text-amber-700">保存后锁定，IGDB 刷新不再覆盖</span>
          <span v-if="nameMissing" class="text-xs text-red-600">默认名称不能为空</span>
        </p>
        <span class="hidden text-[11px] text-slate-400 sm:inline"><kbd class="admin-kbd">Ctrl</kbd> + <kbd class="admin-kbd">S</kbd></span>
        <button type="button" class="admin-button" @click="discard"><LucideIcon :icon="RotateCcw" class="size-3.5" />撤销修改</button>
        <button type="button" class="admin-button admin-primary" :disabled="!canSave" @click="save">
          <LucideIcon :icon="Save" class="size-3.5" />{{ saving ? '正在保存…' : '保存' }}
        </button>
      </div>
    </Transition>
  </template>

  <Dialog v-model:open="deleteOpen" title="删除游戏" size="sm">
    <div class="space-y-3 p-5 text-[13px] text-slate-600">
      <p>删除后不能恢复。这个游戏的 IGDB 记录会被排除，奖杯组自动匹配不会再把它导回来。</p>
      <fieldset v-if="game?.trophy_sets.length" class="space-y-2">
        <legend class="mb-1 text-xs font-medium text-slate-700">它关联的 {{ game.trophy_sets.length }} 个奖杯组</legend>
        <label class="flex items-start gap-2">
          <input v-model="moveMode" type="radio" value="unlink" class="mt-0.5 accent-slate-900" />
          <span>取消关联（之后自动匹配也不会再关联它们）</span>
        </label>
        <label class="flex items-start gap-2">
          <input v-model="moveMode" type="radio" value="move" class="mt-0.5 accent-slate-900" />
          <span class="flex-1">
            移到另一个游戏（合并重复游戏）
            <span class="mt-1.5 flex flex-wrap items-center gap-2">
              <span v-if="moveTarget" class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-px text-xs font-semibold text-slate-700">#{{ moveTarget.id }} {{ moveTarget.name }}</span>
              <button type="button" class="admin-button" @click="pickerOpen = true">{{ moveTarget ? '更换' : '选择游戏' }}</button>
            </span>
          </span>
        </label>
      </fieldset>
      <AdminError :error="deleteError" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="deleteOpen = false">取消</button>
        <button type="button" class="admin-button admin-danger" :disabled="busy || (moveMode === 'move' && !moveTarget)" @click="destroy">{{ busy ? '正在删除…' : '删除' }}</button>
      </div>
    </template>
  </Dialog>
  <AdminGamePicker v-model:open="pickerOpen" title="把奖杯组移到" :exclude-id="game?.id" @pick="pickTarget" />
</template>
