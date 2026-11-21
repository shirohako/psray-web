<script setup lang="ts">
import { ArrowLeft, CircleCheck, EyeOff, ExternalLink, Funnel, Plus, RefreshCw, RotateCcw, Save, Search, Trophy } from 'lucide'
import type { AdminManualTranslation, AdminManualTranslationSummary, AdminTrophyGroupRow, AdminTrophyRow, AdminTrophySetDetail, AdminTrophySetOverrideResult, AdminTrophySetRefresh } from '~/types/admin'
import {
  adminLanguageName,
  combinedState,
  emptyNames,
  fieldState,
  formatRegion,
  isHttpsUrl,
  overrideChanges,
  overrideCounts,
  overrideFor,
  parseRegion,
  psnValue,
  sortRegion,
  textKey,
  textsFromDetail,
  TROPHY_TYPE_DOT,
  TROPHY_TYPE_LABEL,
  type TextKey,
} from '~/utils/adminTrophySet'

/**
 * Edit one trophy set's texts (per language) and icons, its region & edition
 * tags, and the game it belongs to. PSN data keeps syncing underneath: what an
 * admin changes is stored as an override and put back after every sync,
 * everything else follows PSN (docs/api/admin/trophy-sets/README.md#人工修改优先).
 * The region tags aren't PSN data; they are saved with the texts.
 * Languages PSN lacks can get a manual (unofficial) translation, edited in its
 * own tab (AdminTrophySetManualTranslation) against the default-language texts.
 * The platform is not editable.
 */
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })

const api = useAdminApi()
const route = useRoute()
const id = computed(() => Number(route.params.id))

const detail = ref<AdminTrophySetDetail | null>(null)
const saved = ref<Record<TextKey, string>>({} as Record<TextKey, string>)
const draft = ref<Record<TextKey, string>>({} as Record<TextKey, string>)
const savedRegion = ref<string[]>([])
const region = ref<string[]>([])
const language = ref('')
const loading = ref(false)
const loadError = ref<any>(null)

function seed(next: AdminTrophySetDetail) {
  detail.value = next
  language.value = next.language ?? ''
  saved.value = textsFromDetail(next)
  draft.value = { ...saved.value }
  savedRegion.value = sortRegion(parseRegion(next.region))
  region.value = [...savedRegion.value]
}
async function load(lang = language.value) {
  loading.value = true
  loadError.value = null
  try {
    seed(await api.get<AdminTrophySetDetail>(`/trophy-sets/${id.value}`, lang ? { language: lang } : undefined))
  } catch (e) {
    loadError.value = e
  } finally {
    loading.value = false
  }
}
onMounted(() => load(''))
watch(id, () => load(''))

const isDefault = computed(() => !language.value)
const isSquare = computed(() => detail.value?.platform.includes('PS5') ?? false)
const changes = computed(() => detail.value ? overrideChanges(detail.value, saved.value, draft.value) : [])
const regionDirty = computed(() => formatRegion(region.value) !== formatRegion(savedRegion.value))

// ── Manual (unofficial) translations ────────────────────────────────────────
// A manual tab edits its translation against the default-language texts, so the
// page stays on the default language (with no pending text edits) while one is open.
const manualLanguage = ref<string | null>(null)
const manualEditor = ref<{ dirty: boolean, canSave: boolean, problems: TextKey[], save: () => Promise<void>, discard: () => void } | null>(null)
const manualSummary = computed(() => detail.value?.manual_translations?.find(t => t.language_code === manualLanguage.value) ?? null)
const manualDirty = computed(() => !!manualSummary.value && !!manualEditor.value?.dirty)
const manualTabs = computed(() => (detail.value?.manual_translations ?? []).map(t => ({
  code: t.language_code,
  label: adminLanguageName(t.language_code),
  takenOver: t.taken_over,
})))
const addOpen = ref(false)
async function openManual(code: string) {
  if (code === manualLanguage.value) return
  if ((changes.value.length || manualDirty.value) && !window.confirm('切换会丢弃这个标签页里未保存的修改，继续吗？')) return
  draft.value = { ...saved.value }
  if (language.value) {
    const pendingRegion = region.value
    await load('')
    region.value = pendingRegion
  }
  manualLanguage.value = code
}
function setManualSummaries(summaries: AdminManualTranslationSummary[]) {
  if (detail.value) detail.value = { ...detail.value, manual_translations: summaries }
}
function onManualDeleted(summaries: AdminManualTranslationSummary[]) {
  setManualSummaries(summaries)
  manualLanguage.value = null
  savedNotice.value = null
}
function onTranslationCreated(translation: AdminManualTranslation) {
  setManualSummaries(translation.manual_translations ?? [])
  openManual(translation.language_code)
}

const dirty = computed(() => changes.value.length > 0 || regionDirty.value || manualDirty.value)
const changedKeys = computed(() => (Object.keys(draft.value) as TextKey[]).filter(key => draft.value[key] !== saved.value[key]))
const missingNames = computed(() => emptyNames(draft.value).filter(key => changedKeys.value.includes(key)))
const badIcons = computed(() => changes.value.filter(c => c.field === 'icon_url' && c.value !== null && !isHttpsUrl(c.value)).length)
const canSave = computed(() => dirty.value && !saving.value && !missingNames.value.length && !badIcons.value && (!manualDirty.value || !!manualEditor.value?.canSave))

const state = (key: TextKey) => detail.value ? fieldState(detail.value, saved.value, draft.value, key) : 'free'
const psn = (key: TextKey) => detail.value ? psnValue(detail.value, saved.value, key) : ''
function restoreKey(key: TextKey) {
  draft.value[key] = psn(key)
}
function cancelKey(key: TextKey) {
  draft.value[key] = saved.value[key] ?? ''
}

// ── Language tabs ───────────────────────────────────────────────────────────
const counts = computed(() => overrideCounts(detail.value?.overrides ?? []))
const tabs = computed(() => (detail.value?.languages ?? [{ language_code: '', psn_language: detail.value?.default_language ?? null, is_default: true }]).map(l => ({
  code: l.language_code,
  label: l.is_default ? `默认（${adminLanguageName(l.psn_language)}）` : adminLanguageName(l.language_code),
  count: counts.value[l.language_code] ?? 0,
})))
// Region tags don't depend on the language, so a pending change to them survives the switch.
async function switchLanguage(code: string) {
  if (code === language.value && !manualLanguage.value) return
  if ((changes.value.length || manualDirty.value) && !window.confirm('切换语言会丢弃这个语言下未保存的修改，继续吗？')) return
  manualLanguage.value = null
  if (code === language.value) return
  const pendingRegion = region.value
  await load(code)
  region.value = pendingRegion
}

// ── Rows ────────────────────────────────────────────────────────────────────
const onlyModified = ref(false)
const search = ref('')
const rowKeys = (target: 'group' | 'trophy', rowId: number) =>
  (['name', 'detail', 'icon_url'] as const).map(field => textKey(target, rowId, field)).filter(key => key in draft.value)
const rowState = (keys: TextKey[]) => combinedState(keys.map(state))
function restoreRow(keys: TextKey[]) {
  for (const key of keys) if (detail.value && overrideFor(detail.value, key)) restoreKey(key)
}
function cancelRow(keys: TextKey[]) {
  for (const key of keys) cancelKey(key)
}
const matches = (trophy: AdminTrophyRow) => {
  const q = search.value.trim().toLowerCase()
  if (!q) return true
  const name = draft.value[textKey('trophy', trophy.id, 'name')] ?? trophy.name ?? ''
  return name.toLowerCase().includes(q) || String(trophy.psn_trophy_id) === q.replace(/^#/, '')
}
const sections = computed(() => (detail.value?.groups ?? []).map((group: AdminTrophyGroupRow) => ({
  group,
  keys: rowKeys('group', group.id),
  trophies: (detail.value?.trophies ?? [])
    .filter(t => t.psn_group_id === group.psn_group_id)
    .filter(matches)
    .filter(t => !onlyModified.value || rowState(rowKeys('trophy', t.id)) !== 'free'),
  total: (detail.value?.trophies ?? []).filter(t => t.psn_group_id === group.psn_group_id).length,
})))
const visibleCount = computed(() => sections.value.reduce((n, s) => n + s.trophies.length, 0))
const rowAccent = (s: string) => s === 'locked' || s === 'lock' ? 'bg-amber-500' : s === 'unlock' ? 'bg-slate-300' : 'bg-transparent'
const inputTone = (key: TextKey) => {
  const s = state(key)
  return s === 'locked' || s === 'lock' ? 'border-amber-200 bg-amber-50/40' : ''
}
const differs = (key: TextKey) => ['locked', 'lock'].includes(state(key)) && psn(key).trim() !== (draft.value[key] ?? '').trim()

// The game link is saved on its own; only take over its fields, not the texts being edited.
function onGameChanged(next: AdminTrophySetDetail) {
  if (detail.value) detail.value = { ...detail.value, game_id: next.game_id, game_link_manual: next.game_link_manual, game: next.game }
}

// ── Icon dialog (default language only) ─────────────────────────────────────
const iconKey = ref<TextKey | null>(null)
const iconOpen = computed({ get: () => iconKey.value !== null, set: (v) => { if (!v) iconKey.value = null } })
const iconInvalid = (key: TextKey) => {
  const value = draft.value[key] ?? ''
  return value !== saved.value[key] && value.trim() !== psn(key).trim() && !isHttpsUrl(value)
}
function editIcon(key: TextKey) {
  if (isDefault.value && key in draft.value) iconKey.value = key
}

// ── Save ────────────────────────────────────────────────────────────────────
const saving = ref(false)
const saveError = ref<any>(null)
const savedNotice = ref<{ saved: number, reverted: number, region: boolean, manual: boolean } | null>(null)
// Region tags and texts are two requests; the region goes first and, once saved,
// stops counting as a change even if saving the texts then fails.
async function save() {
  if (!detail.value || !canSave.value) return
  saving.value = true
  saveError.value = null
  const notice = { saved: 0, reverted: 0, region: false, manual: false }
  try {
    if (regionDirty.value) {
      const next = await api.write<AdminTrophySetDetail>(`/trophy-sets/${id.value}/region`, { region: sortRegion(region.value) }, 'put')
      detail.value = { ...detail.value, region: next.region }
      savedRegion.value = sortRegion(parseRegion(next.region))
      region.value = [...savedRegion.value]
      notice.region = true
    }
    if (manualDirty.value) {
      await manualEditor.value!.save()
      notice.manual = true
    }
    if (changes.value.length) {
      const result = await api.write<AdminTrophySetOverrideResult>(
        `/trophy-sets/${id.value}/overrides`,
        { language: language.value || null, changes: changes.value },
        'put',
      )
      seed(result.trophy_set)
      notice.saved = result.saved
      notice.reverted = result.reverted
    }
    savedNotice.value = notice
    refreshResult.value = null
  } catch (e) {
    saveError.value = e
  } finally {
    saving.value = false
  }
}
function discard() {
  draft.value = { ...saved.value }
  region.value = [...savedRegion.value]
  manualEditor.value?.discard()
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

// ── Refresh from PSN ────────────────────────────────────────────────────────
const refreshing = ref(false)
const refreshError = ref<any>(null)
const refreshResult = ref<AdminTrophySetRefresh | null>(null)
async function refreshFromPsn() {
  if (dirty.value && !window.confirm('从 PSN 刷新会重新加载编辑器，未保存的修改会丢失。继续吗？')) return
  refreshing.value = true
  refreshError.value = null
  try {
    refreshResult.value = await api.write<AdminTrophySetRefresh>(`/trophy-sets/${id.value}/refresh`, {})
    savedNotice.value = null
    await load(language.value)
  } catch (e) {
    refreshError.value = e
  } finally {
    refreshing.value = false
  }
}
const refreshChanged = computed(() => {
  const c = refreshResult.value?.changes
  if (!c) return 0
  return c.trophy_set.length + c.groups.added + c.groups.updated + c.trophies.added + c.trophies.updated
})
</script>

<template>
  <AdminPageHeader :icon="Trophy" :title="detail?.name || '奖杯组'">
    <NuxtLink to="/admin/trophy-sets" class="admin-button"><LucideIcon :icon="ArrowLeft" class="size-3.5" />全部奖杯组</NuxtLink>
    <template v-if="detail">
      <a :href="`/trophies/${detail.id}`" target="_blank" rel="noopener" class="admin-button"><LucideIcon :icon="ExternalLink" class="size-3.5" />前台</a>
      <button type="button" class="admin-button" :disabled="refreshing" title="立即拉取 PSN 当前的定义，人工修改过的字段保留" @click="refreshFromPsn">
        <LucideIcon :icon="RefreshCw" class="size-3.5" :class="refreshing ? 'animate-spin' : ''" />从 PSN 刷新
      </button>
      <button type="button" class="admin-button admin-primary" :disabled="!canSave" @click="save">
        <LucideIcon :icon="Save" class="size-3.5" />{{ saving ? '正在保存…' : '保存' }}
      </button>
    </template>
  </AdminPageHeader>

  <AdminError :error="loadError" />
  <div v-if="loading && !detail" class="admin-panel space-y-3 p-4" aria-busy="true">
    <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded-md bg-slate-100" />
  </div>

  <template v-else-if="detail">
    <div class="-mt-2 flex flex-wrap items-center gap-1.5">
      <span class="admin-count font-mono">{{ detail.np_communication_id }}</span>
      <span v-for="platform in detail.platform" :key="platform" class="admin-count">{{ platform }}</span>
      <span class="admin-count">版本 {{ detail.version }}</span>
      <span class="admin-count">{{ detail.owners.toLocaleString() }} 名玩家</span>
      <span class="admin-count">{{ detail.trophies?.length ?? 0 }} 个奖杯</span>
      <span class="text-xs text-slate-400">平台、版本和奖杯构成跟随 PSN，不能修改</span>
    </div>

    <AdminError :error="saveError" />
    <AdminError :error="refreshError" />
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1">
      <p v-if="savedNotice && !dirty" class="flex flex-wrap items-center gap-2 text-xs text-emerald-700">
        <LucideIcon :icon="CircleCheck" class="size-3.5" />已保存
        <span v-if="savedNotice.saved" class="rounded-full bg-amber-50 px-2 py-px font-semibold text-amber-700">{{ savedNotice.saved }} 项人工修改</span>
        <span v-if="savedNotice.reverted" class="rounded-full bg-slate-100 px-2 py-px font-semibold text-slate-600">{{ savedNotice.reverted }} 项恢复跟随 PSN</span>
        <span v-if="savedNotice.region" class="rounded-full bg-slate-100 px-2 py-px font-semibold text-slate-600">地区与版本已更新</span>
        <span v-if="savedNotice.manual" class="rounded-full border border-dashed border-violet-200 bg-violet-50 px-2 py-px font-semibold text-violet-700">非官方翻译已保存</span>
        <span v-if="savedNotice.saved" class="text-slate-500">PSN 同步后会保留人工修改</span>
      </p>
    </Transition>
    <div v-if="refreshResult && !dirty" class="flex flex-wrap items-center gap-2 text-xs text-emerald-700">
      <LucideIcon :icon="CircleCheck" class="size-3.5" />已从 PSN 刷新
      <span class="rounded-full bg-slate-100 px-2 py-px font-semibold text-slate-600">{{ refreshChanged ? `${refreshChanged} 处更新` : '没有变化' }}</span>
      <span v-if="refreshResult.overridden?.length" class="rounded-full bg-amber-50 px-2 py-px font-semibold text-amber-700">{{ refreshResult.overridden.length }} 项 PSN 新值因人工修改未生效</span>
    </div>

    <AdminTrophySetGameLink :detail="detail" @changed="onGameChanged" />

    <section class="admin-panel">
      <!-- Language tabs -->
      <div class="border-b border-slate-200 px-4">
        <div class="admin-utabs" role="tablist" aria-label="语言">
          <button v-for="tab in tabs" :key="tab.code" type="button" role="tab" class="admin-utab" :aria-selected="!manualLanguage && tab.code === language" @click="switchLanguage(tab.code)">
            {{ tab.label }}
            <span v-if="tab.count" class="rounded-full bg-amber-50 px-1.5 py-px text-[11px] font-semibold text-amber-700">{{ tab.count }}</span>
          </button>
          <button v-for="tab in manualTabs" :key="`manual-${tab.code}`" type="button" role="tab" class="admin-utab" :aria-selected="manualLanguage === tab.code" @click="openManual(tab.code)">
            {{ tab.label }}
            <span v-if="tab.takenOver" class="rounded-full bg-slate-100 px-1.5 py-px text-[11px] font-semibold text-slate-500" title="PSN 已有官方翻译，前台不再使用这份">已被官方接管</span>
            <span v-else class="rounded-full border border-dashed border-violet-200 bg-violet-50 px-1.5 text-[11px] font-semibold text-violet-700">非官方</span>
          </button>
          <button type="button" class="my-1.5 inline-flex shrink-0 items-center gap-1 self-center rounded-md border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50" title="给 PSN 没有的语言加一份非官方翻译" @click="addOpen = true">
            <LucideIcon :icon="Plus" class="size-3" />添加翻译
          </button>
        </div>
      </div>
      <div v-if="loading" class="h-0.5 overflow-hidden bg-slate-100"><div class="animate-admin-progress h-full w-1/3 bg-slate-900" /></div>

      <AdminTrophySetManualTranslation
        v-if="manualLanguage && manualSummary"
        ref="manualEditor"
        :key="manualLanguage"
        :detail="detail"
        :language="manualLanguage"
        :summary="manualSummary"
        @saved="setManualSummaries"
        @deleted="onManualDeleted"
      />

      <template v-else>
        <!-- The set itself -->
        <div class="flex flex-col gap-4 p-4 sm:flex-row">
          <div class="flex shrink-0 flex-col items-center gap-1.5">
            <button type="button" class="rounded-lg transition hover:ring-2 hover:ring-slate-900/20 disabled:hover:ring-0" :disabled="!isDefault" :title="isDefault ? '修改图标地址' : '图标不分语言，在默认语言下修改'" @click="editIcon(textKey('set', 0, 'icon_url'))">
              <AdminCdnImage :key="draft[textKey('set', 0, 'icon_url')]" :src="isDefault ? draft[textKey('set', 0, 'icon_url')] || null : detail.icon_url" :class="isSquare ? 'size-24' : 'h-[88px] w-40'" />
            </button>
            <AdminLockState v-if="isDefault" :state="state(textKey('set', 0, 'icon_url'))" source="PSN" @restore="restoreKey(textKey('set', 0, 'icon_url'))" @cancel="cancelKey(textKey('set', 0, 'icon_url'))" />
          </div>
          <div class="grid min-w-0 flex-1 gap-4">
            <AdminTrophySetTextField
              id="set-name"
              v-model="draft[textKey('set', 0, 'name')]"
              label="标题"
              :state="state(textKey('set', 0, 'name'))"
              :psn="psn(textKey('set', 0, 'name'))"
              :invalid="missingNames.includes(textKey('set', 0, 'name'))"
              @restore="restoreKey(textKey('set', 0, 'name'))"
              @cancel="cancelKey(textKey('set', 0, 'name'))"
            />
            <AdminTrophySetTextField
              id="set-detail"
              v-model="draft[textKey('set', 0, 'detail')]"
              label="描述"
              multiline
              :maxlength="2048"
              :placeholder="detail.platform.includes('PS5') ? 'PS5 奖杯组在 PSN 上没有描述' : ''"
              :state="state(textKey('set', 0, 'detail'))"
              :psn="psn(textKey('set', 0, 'detail'))"
              @restore="restoreKey(textKey('set', 0, 'detail'))"
              @cancel="cancelKey(textKey('set', 0, 'detail'))"
            />
            <AdminTrophySetRegionField v-model="region" :saved="savedRegion" />
          </div>
        </div>

        <!-- Toolbar for the trophy list -->
        <div class="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-2.5">
          <label class="flex h-8 w-56 items-center gap-2 rounded-md border border-slate-200 px-2.5 focus-within:border-slate-900">
            <LucideIcon :icon="Search" class="size-3.5 text-slate-400" />
            <input v-model="search" class="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400" placeholder="奖杯名或 PSN 编号" />
          </label>
          <button type="button" class="admin-button" :class="onlyModified ? 'border-slate-900 text-slate-900' : ''" :aria-pressed="onlyModified" @click="onlyModified = !onlyModified">
            <LucideIcon :icon="Funnel" class="size-3.5" />只看已修改
          </button>
          <span class="ml-auto text-xs text-slate-400">{{ visibleCount }} 个奖杯<template v-if="isDefault">，点图标可以改图标地址</template></span>
        </div>

        <!-- Groups and their trophies -->
        <div v-for="section in sections" :key="section.group.id" class="border-t border-slate-200">
          <div class="flex flex-col gap-3 bg-slate-50/70 px-4 py-3 sm:flex-row">
            <button type="button" class="shrink-0 self-start rounded-md transition hover:ring-2 hover:ring-slate-900/20 disabled:hover:ring-0" :disabled="!isDefault" @click="editIcon(textKey('group', section.group.id, 'icon_url'))">
              <AdminCdnImage :key="draft[textKey('group', section.group.id, 'icon_url')]" :src="isDefault ? draft[textKey('group', section.group.id, 'icon_url')] || null : section.group.icon_url" :class="isSquare ? 'size-12' : 'h-12 w-[87px]'" />
            </button>
            <template v-if="section.keys.length">
              <div class="grid min-w-0 flex-1 gap-3 lg:grid-cols-2">
                <AdminTrophySetTextField
                  :id="`group-${section.group.id}-name`"
                  v-model="draft[textKey('group', section.group.id, 'name')]"
                  :label="section.group.psn_group_id === 'default' ? '本体' : `DLC 分组 ${section.group.psn_group_id}`"
                  :state="state(textKey('group', section.group.id, 'name'))"
                  :psn="psn(textKey('group', section.group.id, 'name'))"
                  :invalid="missingNames.includes(textKey('group', section.group.id, 'name'))"
                  @restore="restoreKey(textKey('group', section.group.id, 'name'))"
                  @cancel="cancelKey(textKey('group', section.group.id, 'name'))"
                />
                <AdminTrophySetTextField
                  :id="`group-${section.group.id}-detail`"
                  v-model="draft[textKey('group', section.group.id, 'detail')]"
                  label="分组描述"
                  :maxlength="2048"
                  :state="state(textKey('group', section.group.id, 'detail'))"
                  :psn="psn(textKey('group', section.group.id, 'detail'))"
                  @restore="restoreKey(textKey('group', section.group.id, 'detail'))"
                  @cancel="cancelKey(textKey('group', section.group.id, 'detail'))"
                />
              </div>
            </template>
            <p v-else class="flex-1 self-center text-xs text-slate-400">这个分组没有该语言的翻译</p>
            <div class="flex shrink-0 flex-wrap items-start gap-1.5 sm:w-28 sm:flex-col sm:items-end">
              <span class="admin-count font-mono">{{ section.group.psn_group_id }}</span>
              <span class="admin-count">{{ section.total }} 个奖杯</span>
              <AdminLockState v-if="isDefault" :state="state(textKey('group', section.group.id, 'icon_url'))" source="PSN" no-restore />
            </div>
          </div>

          <TransitionGroup tag="ul" enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-100 ease-in" leave-to-class="opacity-0">
            <li v-for="trophy in section.trophies" :key="trophy.id" class="flex gap-3 border-t border-slate-100 px-4 py-2.5 transition-colors" :class="rowState(rowKeys('trophy', trophy.id)) === 'free' ? '' : 'bg-amber-50/25'">
              <span class="w-1 shrink-0 self-stretch rounded-full transition-colors" :class="rowAccent(rowState(rowKeys('trophy', trophy.id)))" />
              <button type="button" class="shrink-0 self-start rounded-md transition hover:ring-2 hover:ring-slate-900/20 disabled:hover:ring-0" :disabled="!isDefault" :title="isDefault ? '修改图标地址' : ''" @click="editIcon(textKey('trophy', trophy.id, 'icon_url'))">
                <AdminCdnImage :key="draft[textKey('trophy', trophy.id, 'icon_url')]" :src="isDefault ? draft[textKey('trophy', trophy.id, 'icon_url')] || null : trophy.icon_url" class="size-10" />
              </button>
              <span class="mt-4 size-2 shrink-0 rounded-full" :class="TROPHY_TYPE_DOT[trophy.type] ?? 'bg-slate-300'" :title="TROPHY_TYPE_LABEL[trophy.type]" />
              <div v-if="textKey('trophy', trophy.id, 'name') in draft" class="grid min-w-0 flex-1 gap-1.5">
                <input v-model="draft[textKey('trophy', trophy.id, 'name')]" maxlength="255" class="admin-input font-medium" :class="[inputTone(textKey('trophy', trophy.id, 'name')), missingNames.includes(textKey('trophy', trophy.id, 'name')) ? 'border-red-300' : '']" :aria-label="`奖杯 ${trophy.psn_trophy_id} 名称`" />
                <input v-model="draft[textKey('trophy', trophy.id, 'detail')]" maxlength="2048" class="admin-input text-xs text-slate-600" :class="inputTone(textKey('trophy', trophy.id, 'detail'))" :aria-label="`奖杯 ${trophy.psn_trophy_id} 描述`" />
                <p v-if="differs(textKey('trophy', trophy.id, 'name'))" class="truncate text-xs text-slate-500"><span class="text-slate-400">PSN 名称：</span>{{ psn(textKey('trophy', trophy.id, 'name')) }}</p>
                <p v-if="differs(textKey('trophy', trophy.id, 'detail'))" class="truncate text-xs text-slate-500"><span class="text-slate-400">PSN 描述：</span>{{ psn(textKey('trophy', trophy.id, 'detail')) || '（空）' }}</p>
                <p v-if="isDefault && differs(textKey('trophy', trophy.id, 'icon_url'))" class="truncate text-xs text-slate-500"><span class="text-slate-400">PSN 图标：</span>{{ psn(textKey('trophy', trophy.id, 'icon_url')) }}</p>
              </div>
              <p v-else class="min-w-0 flex-1 self-center text-xs text-slate-400">没有该语言的翻译（显示默认语言的文字）</p>
              <div class="flex w-32 shrink-0 flex-col items-end gap-1.5">
                <span class="flex items-center gap-1">
                  <span v-if="trophy.is_hidden" class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-px text-[11px] font-semibold text-slate-500"><LucideIcon :icon="EyeOff" class="size-3" />隐藏</span>
                  <span class="admin-count font-mono">#{{ trophy.psn_trophy_id }}</span>
                </span>
                <AdminLockState :state="rowState(rowKeys('trophy', trophy.id))" source="PSN" show-free @restore="restoreRow(rowKeys('trophy', trophy.id))" @cancel="cancelRow(rowKeys('trophy', trophy.id))" />
              </div>
            </li>
          </TransitionGroup>
          <p v-if="!section.trophies.length" class="border-t border-slate-100 px-4 py-4 text-center text-xs text-slate-400">{{ onlyModified || search ? '没有符合条件的奖杯' : '这个分组没有奖杯' }}</p>
        </div>
      </template>
    </section>

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
          <span v-if="changes.length" class="rounded-full bg-slate-100 px-2 py-px text-[11px] font-semibold text-slate-600">{{ tabs.find(t => t.code === language)?.label }}</span>
          <span v-if="changes.some(c => c.value !== null)" class="rounded-full bg-amber-50 px-2 py-px text-[11px] font-semibold text-amber-700">{{ changes.filter(c => c.value !== null).length }} 项保存后锁定</span>
          <span v-if="changes.some(c => c.value === null)" class="rounded-full bg-slate-100 px-2 py-px text-[11px] font-semibold text-slate-600">{{ changes.filter(c => c.value === null).length }} 项恢复 PSN</span>
          <span v-if="regionDirty" class="rounded-full bg-slate-100 px-2 py-px text-[11px] font-semibold text-slate-600">地区与版本</span>
          <span v-if="manualDirty" class="rounded-full border border-dashed border-violet-200 bg-violet-50 px-2 py-px text-[11px] font-semibold text-violet-700">{{ adminLanguageName(manualLanguage) }}非官方翻译</span>
          <span v-if="manualDirty && manualEditor?.problems.length" class="text-xs text-red-600">{{ manualEditor.problems.includes(textKey('set', 0, 'name')) ? '标题不能为空' : '填了描述也要填名称' }}</span>
          <span v-if="missingNames.length" class="text-xs text-red-600">名称不能为空</span>
          <span v-if="badIcons" class="text-xs text-red-600">图标必须是 https 地址</span>
        </p>
        <span class="hidden text-[11px] text-slate-400 sm:inline"><kbd class="admin-kbd">Ctrl</kbd> + <kbd class="admin-kbd">S</kbd></span>
        <button type="button" class="admin-button" @click="discard"><LucideIcon :icon="RotateCcw" class="size-3.5" />撤销修改</button>
        <button type="button" class="admin-button admin-primary" :disabled="!canSave" @click="save">
          <LucideIcon :icon="Save" class="size-3.5" />{{ saving ? '正在保存…' : '保存' }}
        </button>
      </div>
    </Transition>

    <AdminTrophySetAddTranslation v-model:open="addOpen" :detail="detail" @created="onTranslationCreated" @existing="openManual" />

    <Dialog v-model:open="iconOpen" title="图标地址" size="sm">
      <div v-if="iconKey" class="space-y-3 p-5">
        <div class="flex justify-center rounded-lg bg-slate-50 p-4">
          <AdminCdnImage :key="draft[iconKey]" :src="draft[iconKey] || null" :class="iconKey.startsWith('trophy') ? 'size-20' : isSquare ? 'size-24' : 'h-[88px] w-40'" />
        </div>
        <AdminTrophySetTextField
          id="icon-url"
          v-model="draft[iconKey]"
          label="地址"
          :state="state(iconKey)"
          :psn="psn(iconKey)"
          :invalid="iconInvalid(iconKey)"
          @restore="restoreKey(iconKey)"
          @cancel="cancelKey(iconKey)"
        />
        <p class="text-xs leading-relaxed text-slate-500">人工设置的图标不会再被 PSN 刷新换掉。索尼 CDN 的地址会过期，最好用不会失效的地址；想重新跟随 PSN，点「恢复 PSN」。</p>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <button type="button" class="admin-button admin-primary" @click="iconKey = null">完成</button>
        </div>
      </template>
    </Dialog>
  </template>
</template>
