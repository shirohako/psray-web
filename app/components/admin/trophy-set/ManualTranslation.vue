<script setup lang="ts">
import { CircleAlert, Funnel, Languages, Search, Trash2 } from 'lucide'
import type { AdminManualTranslation, AdminManualTranslationSummary, AdminTrophySetDetail } from '~/types/admin'
import {
  adminLanguageName,
  manualPayload,
  manualProblems,
  manualProgress,
  manualTexts,
  textKey,
  TROPHY_TYPE_DOT,
  TROPHY_TYPE_LABEL,
  type TextKey,
} from '~/utils/adminTrophySet'

/**
 * Editor for one manual (unofficial) translation, side by side: the original
 * (default language) on the left, the translation on the right. Untranslated
 * entries show the original on the front pages. Once PSN ships an official
 * translation in this language it takes over and this one is read-only, kept
 * only to look at or delete (docs/api/admin/trophy-sets/manual-translations.md).
 *
 * The page owns the save button: it reads `dirty` / `canSave` and calls
 * `save()` / `discard()` through a template ref.
 */
const props = defineProps<{
  /** The set in its default language: the originals. */
  detail: AdminTrophySetDetail
  language: string
  summary: AdminManualTranslationSummary
}>()
const emit = defineEmits<{
  saved: [summaries: AdminManualTranslationSummary[]]
  deleted: [summaries: AdminManualTranslationSummary[]]
}>()

const api = useAdminApi()
const translation = ref<AdminManualTranslation | null>(null)
const saved = ref<Record<TextKey, string>>({} as Record<TextKey, string>)
const draft = ref<Record<TextKey, string>>({} as Record<TextKey, string>)
const loading = ref(false)
const loadError = ref<any>(null)

function seed(next: AdminManualTranslation) {
  translation.value = next
  saved.value = manualTexts(props.detail, next)
  draft.value = { ...saved.value }
}
async function load() {
  loading.value = true
  loadError.value = null
  try {
    seed(await api.get<AdminManualTranslation>(`/trophy-sets/${props.detail.id}/manual-translations/${props.language}`))
  } catch (e) {
    loadError.value = e
  } finally {
    loading.value = false
  }
}
watch(() => [props.detail.id, props.language], load, { immediate: true })
// The originals reload after a PSN refresh; keep what has been typed, add any new trophies.
watch(() => props.detail, (next) => {
  if (!translation.value) return
  const fresh = manualTexts(next, translation.value)
  saved.value = fresh
  draft.value = { ...fresh, ...Object.fromEntries(Object.entries(draft.value).filter(([key]) => key in fresh)) }
})

const takenOver = computed(() => translation.value?.taken_over ?? props.summary.taken_over)
const languageName = computed(() => adminLanguageName(props.language))
const originalLanguage = computed(() => adminLanguageName(props.detail.default_language))
const progress = computed(() => manualProgress(props.detail, draft.value))
const problems = computed(() => manualProblems(draft.value))
const dirty = computed(() => !takenOver.value && (Object.keys(draft.value) as TextKey[]).some(key => (draft.value[key] ?? '').trim() !== (saved.value[key] ?? '').trim()))
const saving = ref(false)
const canSave = computed(() => dirty.value && !saving.value && !problems.value.length)

async function save() {
  if (!canSave.value) return
  saving.value = true
  try {
    const next = await api.write<AdminManualTranslation>(`/trophy-sets/${props.detail.id}/manual-translations/${props.language}`, manualPayload(props.detail, draft.value), 'put')
    seed(next)
    emit('saved', next.manual_translations ?? [])
  } finally {
    saving.value = false
  }
}
function discard() {
  draft.value = { ...saved.value }
}
defineExpose({ dirty, canSave, problems, save, discard })

const deleting = ref(false)
const deleteError = ref<any>(null)
async function remove() {
  if (!window.confirm(`删除这份${languageName.value}翻译？删除后前台不再显示，不能恢复。`)) return
  deleting.value = true
  deleteError.value = null
  try {
    const result = await api.remove<{ manual_translations: AdminManualTranslationSummary[] }>(`/trophy-sets/${props.detail.id}/manual-translations/${props.language}`)
    emit('deleted', result.manual_translations)
  } catch (e) {
    deleteError.value = e
  } finally {
    deleting.value = false
  }
}

// ── Rows ────────────────────────────────────────────────────────────────────
const search = ref('')
const onlyMissing = ref(false)
const isSquare = computed(() => props.detail.platform.includes('PS5'))
const filled = (key: TextKey) => !!(draft.value[key] ?? '').trim()
const sections = computed(() => (props.detail.groups ?? []).map(group => {
  const all = (props.detail.trophies ?? []).filter(t => t.psn_group_id === group.psn_group_id)
  const q = search.value.trim().toLowerCase()
  return {
    group,
    total: all.length,
    trophies: all
      .filter(t => !onlyMissing.value || !filled(textKey('trophy', t.id, 'name')))
      .filter(t => !q || t.name.toLowerCase().includes(q) || (draft.value[textKey('trophy', t.id, 'name')] ?? '').toLowerCase().includes(q) || String(t.psn_trophy_id) === q.replace(/^#/, '')),
  }
}))
const visibleCount = computed(() => sections.value.reduce((n, s) => n + s.trophies.length, 0))
const inputTone = (key: TextKey) => problems.value.includes(key)
  ? 'border-red-300'
  : filled(key) ? 'border-violet-200 bg-violet-50/30' : ''
</script>

<template>
  <div>
    <!-- Status: unofficial, progress, delete -->
    <div v-if="takenOver" class="flex flex-wrap items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3">
      <LucideIcon :icon="CircleAlert" class="mt-0.5 size-4 shrink-0 text-amber-700" />
      <div class="min-w-0 flex-1 text-xs leading-relaxed">
        <p class="text-[13px] font-semibold text-amber-800">PSN 已有官方{{ languageName }}翻译，前台改用官方的</p>
        <p class="text-slate-600">这份非官方翻译不再显示，只留在这里备查，不能再修改。想调整官方译文，到上面的「{{ languageName }}」标签页里改。</p>
      </div>
      <button type="button" class="admin-button text-red-700" :disabled="deleting" @click="remove"><LucideIcon :icon="Trash2" class="size-3.5" />删除这份翻译</button>
    </div>
    <div v-else class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-violet-50/40 px-4 py-2.5">
      <LucideIcon :icon="Languages" class="size-4 text-violet-600" />
      <span class="text-[13px] text-slate-700">非官方翻译</span>
      <span class="text-xs text-slate-500">PSN 没有{{ languageName }}时前台使用；PSN 以后出了官方翻译会自动接管</span>
      <span class="ml-auto flex items-center gap-2">
        <span class="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
          <span class="block h-full rounded-full bg-violet-600 transition-[width] duration-300 motion-reduce:transition-none" :style="{ width: `${(progress.translated / Math.max(progress.total, 1)) * 100}%` }" />
        </span>
        <span class="text-xs font-semibold tabular-nums text-slate-600">{{ progress.translated }} / {{ progress.total }}</span>
        <button type="button" class="admin-button text-red-700" :disabled="deleting" @click="remove"><LucideIcon :icon="Trash2" class="size-3.5" />删除这份翻译</button>
      </span>
    </div>
    <AdminError :error="loadError" class="m-4" />
    <AdminError :error="deleteError" class="m-4" />
    <div v-if="loading && !translation" class="space-y-3 p-4" aria-busy="true">
      <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-md bg-slate-100" />
    </div>

    <template v-else-if="translation">
      <!-- Column headings -->
      <div class="hidden border-b border-slate-200 text-xs font-semibold text-slate-500 lg:flex">
        <span class="w-[45%] shrink-0 bg-slate-50 px-4 py-2">原文（{{ originalLanguage }}）</span>
        <span class="flex flex-1 items-center gap-1.5 border-l border-slate-200 px-4 py-2">
          {{ languageName }}<span class="rounded-full border border-dashed border-violet-200 bg-violet-50 px-1.5 text-[11px] text-violet-700">非官方</span>
        </span>
      </div>

      <!-- The set's title -->
      <div class="flex flex-col border-b border-slate-100 lg:flex-row">
        <div class="flex gap-3 bg-slate-50 px-4 py-3 lg:w-[45%] lg:shrink-0">
          <AdminCdnImage :src="detail.icon_url" :class="isSquare ? 'size-12' : 'h-11 w-20'" class="shrink-0" />
          <div class="min-w-0">
            <p class="text-[11px] text-slate-400">奖杯组标题</p>
            <p class="text-[13px] font-semibold text-slate-900">{{ detail.name }}</p>
          </div>
        </div>
        <div class="flex-1 px-4 py-3 lg:border-l lg:border-slate-200">
          <label :for="`manual-${language}-title`" class="mb-1.5 block text-[11px] text-slate-400">标题（必填）</label>
          <input :id="`manual-${language}-title`" v-model="draft[textKey('set', 0, 'name')]" maxlength="255" class="admin-input" :class="inputTone(textKey('set', 0, 'name'))" :disabled="takenOver" />
        </div>
      </div>

      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5">
        <label class="flex h-8 w-56 items-center gap-2 rounded-md border border-slate-200 px-2.5 focus-within:border-slate-900">
          <LucideIcon :icon="Search" class="size-3.5 text-slate-400" />
          <input v-model="search" class="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-slate-400" placeholder="奖杯名或 PSN 编号" />
        </label>
        <button type="button" class="admin-button" :class="onlyMissing ? 'border-slate-900 text-slate-900' : ''" :aria-pressed="onlyMissing" @click="onlyMissing = !onlyMissing">
          <LucideIcon :icon="Funnel" class="size-3.5" />只看未翻译
        </button>
        <span class="ml-auto text-xs text-slate-400">{{ visibleCount }} 个奖杯，没翻的在前台显示原文</span>
      </div>

      <!-- Groups and their trophies -->
      <div v-for="section in sections" :key="section.group.id" class="border-b border-slate-200 last:border-b-0">
        <div class="flex flex-col lg:flex-row">
          <div class="flex gap-3 bg-slate-100/70 px-4 py-2.5 lg:w-[45%] lg:shrink-0">
            <AdminCdnImage :src="section.group.icon_url" :class="isSquare ? 'size-10' : 'h-[33px] w-15'" class="shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="text-[11px] text-slate-400">{{ section.group.psn_group_id === 'default' ? '本体' : `DLC 分组 ${section.group.psn_group_id}` }}</p>
              <p class="text-[13px] font-semibold text-slate-900">{{ section.group.name }}</p>
              <p v-if="section.group.detail" class="text-xs text-slate-500">{{ section.group.detail }}</p>
            </div>
            <span class="admin-count self-start">{{ section.total }} 个奖杯</span>
          </div>
          <div class="grid flex-1 gap-1.5 bg-slate-50/60 px-4 py-2.5 lg:border-l lg:border-slate-200">
            <input v-model="draft[textKey('group', section.group.id, 'name')]" maxlength="255" class="admin-input font-medium" :class="inputTone(textKey('group', section.group.id, 'name'))" placeholder="分组名称（未翻译）" :disabled="takenOver" :aria-label="`分组 ${section.group.psn_group_id} 名称`" />
            <input v-model="draft[textKey('group', section.group.id, 'detail')]" maxlength="2048" class="admin-input text-xs" :class="inputTone(textKey('group', section.group.id, 'detail'))" placeholder="分组描述（未翻译）" :disabled="takenOver" :aria-label="`分组 ${section.group.psn_group_id} 描述`" />
          </div>
        </div>

        <ul>
          <li v-for="trophy in section.trophies" :key="trophy.id" class="flex flex-col border-t border-slate-100 lg:flex-row">
            <div class="flex gap-3 bg-slate-50 px-4 py-2.5 lg:w-[45%] lg:shrink-0">
              <AdminCdnImage :src="trophy.icon_url" class="size-10 shrink-0" />
              <span class="mt-4 size-2 shrink-0 rounded-full" :class="TROPHY_TYPE_DOT[trophy.type] ?? 'bg-slate-300'" :title="TROPHY_TYPE_LABEL[trophy.type]" />
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-semibold text-slate-900">{{ trophy.name }}</p>
                <p class="text-xs text-slate-500">{{ trophy.detail }}</p>
              </div>
              <span class="admin-count self-start font-mono">#{{ trophy.psn_trophy_id }}</span>
            </div>
            <div class="flex flex-1 gap-3 px-4 py-2.5 lg:border-l lg:border-slate-200">
              <div class="grid min-w-0 flex-1 gap-1.5">
                <input v-model="draft[textKey('trophy', trophy.id, 'name')]" maxlength="255" class="admin-input font-medium" :class="inputTone(textKey('trophy', trophy.id, 'name'))" placeholder="未翻译" :disabled="takenOver" :aria-label="`奖杯 ${trophy.psn_trophy_id} 名称`" />
                <input v-model="draft[textKey('trophy', trophy.id, 'detail')]" maxlength="2048" class="admin-input text-xs" :class="inputTone(textKey('trophy', trophy.id, 'detail'))" placeholder="未翻译" :disabled="takenOver" :aria-label="`奖杯 ${trophy.psn_trophy_id} 描述`" />
                <p v-if="problems.includes(textKey('trophy', trophy.id, 'name'))" class="text-xs text-red-600">填了描述也要填名称</p>
              </div>
              <span class="mt-2 grid size-[18px] shrink-0 place-items-center rounded-full transition-colors" :class="filled(textKey('trophy', trophy.id, 'name')) ? 'bg-violet-600 text-white' : 'border-[1.5px] border-dashed border-slate-300'" :title="filled(textKey('trophy', trophy.id, 'name')) ? '已翻译' : '未翻译'">
                <svg v-if="filled(textKey('trophy', trophy.id, 'name'))" viewBox="0 0 24 24" class="size-3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
            </div>
          </li>
        </ul>
        <p v-if="!section.trophies.length" class="border-t border-slate-100 px-4 py-4 text-center text-xs text-slate-400">{{ onlyMissing || search ? '没有符合条件的奖杯' : '这个分组没有奖杯' }}</p>
      </div>
    </template>
  </div>
</template>
