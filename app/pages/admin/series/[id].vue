<script setup lang="ts">
import { ArrowLeft, CircleCheck, ExternalLink, GitMerge, Layers, RefreshCw, RotateCcw, Save, Trash2, TriangleAlert, Wand2 } from 'lucide'
import type { AdminSeriesDetail, AdminSeriesSet } from '~/types/admin'
import {
  addSets,
  changeSummary,
  draftFromDetail,
  draftSignature,
  savePayload,
  SERIES_LANGUAGES,
  SERIES_STATUS_OPTIONS,
  type DraftMeta,
  type DraftStage,
} from '~/utils/adminSeries'

/**
 * Edit one series: names, status, and the stages with their trophy sets.
 * The whole series is saved at once with the revision it was loaded at, so a
 * concurrent save (another admin, or "re-detect") is caught as a conflict
 * instead of being overwritten. Once saved, automatic grouping only appends
 * to this series (docs/api/admin/series).
 */
definePageMeta({ layout: 'admin', auth: { roles: 'admin' } })

const api = useAdminApi()
const route = useRoute()
const id = computed(() => Number(route.params.id))

const series = ref<AdminSeriesDetail | null>(null)
const loading = ref(false)
const loadError = ref<any>(null)
const meta = ref<DraftMeta | null>(null)
const stages = ref<DraftStage[]>([])
const savedStages = ref<DraftStage[]>([])
const savedSignature = ref('')
const target = ref('new')

function seed(detail: AdminSeriesDetail) {
  series.value = detail
  const draft = draftFromDetail(detail)
  for (const language of SERIES_LANGUAGES) draft.meta.translations[language.code] ??= ''
  meta.value = draft.meta
  stages.value = draft.stages
  savedStages.value = draft.stages
  savedSignature.value = draftSignature(draft.meta, draft.stages)
  target.value = draft.stages[draft.stages.length - 1]?.key ?? 'new'
}

async function load() {
  loading.value = true
  loadError.value = null
  try {
    seed(await api.get<AdminSeriesDetail>(`/series/${id.value}`))
  } catch (e) {
    loadError.value = e
  } finally {
    loading.value = false
  }
}
onMounted(load)

const dirty = computed(() => !!meta.value && draftSignature(meta.value, stages.value) !== savedSignature.value)
const summary = computed(() => changeSummary(savedStages.value, stages.value))
const emptyStages = computed(() => stages.value.filter(stage => !stage.entries.length).length)
const nameMissing = computed(() => !meta.value?.name.trim())
const canSave = computed(() => dirty.value && !saving.value && !emptyStages.value && !nameMissing.value)
const sourceLabel = computed(() => {
  const s = series.value
  if (!s) return undefined
  const parts = [s.source === 'igdb' ? `IGDB collection #${s.igdb_collection_id}` : '手动创建']
  parts.push(`${s.stage_count} 个阶段`)
  if (s.side_count) parts.push(`${s.side_count} 部外传`)
  parts.push(`${s.trophy_set_count} 个奖杯组`)
  parts.push(s.admin_edited_at ? '管理员编辑过' : '未经人工编辑')
  return parts.join(' · ')
})

function addFromPanel(sets: AdminSeriesSet[], toKey: string) {
  const before = stages.value.length
  stages.value = addSets(stages.value, sets, toKey)
  if (stages.value.length > before) target.value = stages.value[stages.value.length - 1]!.key
}

function discard() {
  if (series.value) seed(series.value)
}

// ── Save ────────────────────────────────────────────────────────────────────
const saving = ref(false)
const saveError = ref<any>(null)
const conflict = ref(false)
const savedAt = ref<string | null>(null)
async function save() {
  if (!series.value || !meta.value || !canSave.value) return
  saving.value = true
  saveError.value = null
  conflict.value = false
  try {
    const detail = await api.write<AdminSeriesDetail>(`/series/${id.value}`, savePayload(series.value.revision, meta.value, stages.value), 'put')
    seed(detail)
    savedAt.value = new Date().toISOString()
  } catch (e: any) {
    if (e?.code === 'SERIES_CONFLICT') conflict.value = true
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

// ── Quick flags, re-detect, merge, delete ───────────────────────────────────
const busy = ref(false)
const actionError = ref<any>(null)
const detectLog = ref<string[] | null>(null)
async function markReviewed() {
  busy.value = true
  actionError.value = null
  try {
    await api.write(`/series/${id.value}`, { needs_review: false }, 'patch')
    if (series.value) series.value = { ...series.value, needs_review: false, review_reason: null }
  } catch (e) {
    actionError.value = e
  } finally {
    busy.value = false
  }
}
async function detect() {
  if (dirty.value && !window.confirm('重新归类会刷新编辑器，未保存的修改会丢失。继续吗？')) return
  busy.value = true
  actionError.value = null
  try {
    const result = await api.write<{ log: string[]; series: AdminSeriesDetail }>(`/series/${id.value}/detect`, {})
    detectLog.value = result.log.length ? result.log : ['没有需要补充的内容。']
    seed(result.series)
  } catch (e) {
    actionError.value = e
  } finally {
    busy.value = false
  }
}

const mergeOpen = ref(false)
const mergeInto = ref('')
const mergeError = ref<any>(null)
async function merge() {
  const into = Number(mergeInto.value)
  if (!into) return
  busy.value = true
  mergeError.value = null
  try {
    await api.write(`/series/${id.value}/merge`, { into_id: into })
    mergeOpen.value = false
    stages.value = savedStages.value
    await navigateTo(`/admin/series/${into}`)
  } catch (e) {
    mergeError.value = e
  } finally {
    busy.value = false
  }
}

const deleteOpen = ref(false)
const deleteError = ref<any>(null)
async function destroy() {
  busy.value = true
  deleteError.value = null
  try {
    const result = await api.remove<{ deleted: boolean }>(`/series/${id.value}`)
    deleteOpen.value = false
    if (result.deleted) {
      stages.value = savedStages.value
      await navigateTo('/admin/series')
    } else {
      await load()
    }
  } catch (e) {
    deleteError.value = e
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AdminPageHeader :icon="Layers" :title="series?.name ?? '系列'" :description="sourceLabel">
    <NuxtLink to="/admin/series" class="admin-button"><LucideIcon :icon="ArrowLeft" class="size-3.5" />全部系列</NuxtLink>
    <template v-if="series">
      <a :href="`/series/${series.id}`" target="_blank" rel="noopener" class="admin-button"><LucideIcon :icon="ExternalLink" class="size-3.5" />前台</a>
      <button v-if="series.igdb_collection_id" type="button" class="admin-button" :disabled="busy" title="按 IGDB 立即补充这个系列（遵守管理员优先规则）" @click="detect">
        <LucideIcon :icon="Wand2" class="size-3.5" />按 IGDB 重新归类
      </button>
      <button type="button" class="admin-button" @click="mergeOpen = true; mergeInto = ''"><LucideIcon :icon="GitMerge" class="size-3.5" />合并</button>
      <button type="button" class="admin-button" @click="deleteOpen = true"><LucideIcon :icon="Trash2" class="size-3.5" />{{ series.source === 'igdb' ? '删除（下架）' : '删除' }}</button>
      <button type="button" class="admin-button admin-primary" :disabled="!canSave" @click="save">
        <LucideIcon :icon="Save" class="size-3.5" />{{ saving ? '正在保存…' : '保存' }}
      </button>
    </template>
  </AdminPageHeader>

  <AdminError :error="loadError" />
  <div v-if="loading && !series" class="admin-panel space-y-3 p-4" aria-busy="true">
    <div v-for="i in 5" :key="i" class="h-10 animate-pulse rounded-md bg-slate-100" />
  </div>

  <template v-else-if="series && meta">
    <AdminError :error="actionError" />
    <AdminError :error="saveError" />
    <div v-if="conflict" class="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50/70 p-3 text-[13px] text-red-900">
      <LucideIcon :icon="TriangleAlert" class="size-4 shrink-0" />
      <span class="flex-1">这个系列在你打开之后被保存过（别的管理员，或自动归类）。重新加载后再改一次；你这次的修改不会被保存。</span>
      <button type="button" class="admin-button" @click="conflict = false; load()"><LucideIcon :icon="RefreshCw" class="size-3.5" />重新加载</button>
    </div>
    <div v-if="series.merged_into_id" class="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[13px] text-slate-700">
      这个系列已合并进 <NuxtLink :to="`/admin/series/${series.merged_into_id}`" class="font-medium underline">#{{ series.merged_into_id }}</NuxtLink>，已下架。
    </div>
    <AdminSeriesReviewNotice v-if="series.needs_review" :series="series">
      <button type="button" class="admin-button shrink-0" :disabled="busy" @click="markReviewed"><LucideIcon :icon="CircleCheck" class="size-3.5" />标为已审核</button>
    </AdminSeriesReviewNotice>
    <div v-if="detectLog" class="rounded-lg border border-slate-200 bg-white p-3 text-[13px] text-slate-700">
      <p class="mb-1 font-medium text-slate-900">按 IGDB 重新归类完成</p>
      <ul class="list-disc space-y-0.5 pl-5 text-xs text-slate-600"><li v-for="line in detectLog" :key="line">{{ line }}</li></ul>
    </div>
    <p v-if="savedAt && !dirty" class="flex items-center gap-1.5 text-xs text-emerald-700">
      <LucideIcon :icon="CircleCheck" class="size-3.5" />已保存。之后自动归类只往这个系列里追加，不会改动你的安排。
    </p>

    <section class="admin-panel grid gap-4 p-4 lg:grid-cols-[1fr_10rem_auto]">
      <div>
        <label for="series-name" class="mb-1.5 block text-xs font-medium text-slate-700">默认名称</label>
        <input id="series-name" v-model="meta.name" maxlength="255" class="admin-input" />
      </div>
      <div>
        <label for="series-status" class="mb-1.5 block text-xs font-medium text-slate-700">状态</label>
        <select id="series-status" v-model="meta.status" class="admin-input">
          <option v-for="option in SERIES_STATUS_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </div>
      <div>
        <span class="mb-1.5 block text-xs font-medium text-slate-700">自动归类</span>
        <label class="flex h-8 items-center gap-2 text-[13px] text-slate-700">
          <input v-model="meta.autoUpdate" type="checkbox" class="size-4 rounded border-slate-300" />
          {{ meta.autoUpdate ? '允许追加新作品和新版本' : '已冻结，完全跳过' }}
        </label>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-5">
        <div v-for="language in SERIES_LANGUAGES" :key="language.code">
          <label :for="`series-name-${language.code}`" class="mb-1.5 block text-xs font-medium text-slate-700">{{ language.label }}</label>
          <input :id="`series-name-${language.code}`" v-model="meta.translations[language.code]" maxlength="255" class="admin-input" :placeholder="meta.name" :lang="language.code" />
        </div>
      </div>
      <div class="lg:col-span-2">
        <label for="series-description" class="mb-1.5 block text-xs font-medium text-slate-700">简介</label>
        <textarea id="series-description" v-model="meta.description" maxlength="5000" class="admin-input min-h-16" placeholder="可选，显示在系列页底部" />
      </div>
      <div>
        <label for="series-cover" class="mb-1.5 block text-xs font-medium text-slate-700">封面地址</label>
        <input id="series-cover" v-model="meta.coverUrl" maxlength="512" class="admin-input" placeholder="留空用阶段图标" />
      </div>
    </section>

    <div class="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <AdminSeriesStageBoard v-model:stages="stages" v-model:target="target" />
      <AdminSeriesSourcePanel v-model:target="target" :series-id="series.id" :stages="stages" class="xl:sticky xl:top-4" @add="addFromPanel" />
    </div>

    <!-- Sticky save bar while there are changes -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-4 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div v-if="dirty" class="sticky bottom-4 z-20 mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur">
        <p class="flex-1 text-[13px] text-slate-700">
          未保存的修改<template v-if="summary.added || summary.removed">：</template>
          <span v-if="summary.added" class="text-emerald-700">+{{ summary.added }} 个奖杯组</span>
          <span v-if="summary.added && summary.removed"> · </span>
          <span v-if="summary.removed" class="text-red-700">−{{ summary.removed }} 个奖杯组（不会被自动加回）</span>
          <span v-if="!summary.added && !summary.removed && summary.restructured">阶段调整</span>
          <span v-if="emptyStages" class="ml-2 text-amber-700">有 {{ emptyStages }} 个空阶段，加入奖杯组或删除后才能保存</span>
          <span v-if="nameMissing" class="ml-2 text-amber-700">默认名称不能为空</span>
        </p>
        <span class="hidden text-[11px] text-slate-400 sm:inline"><kbd class="admin-kbd">Ctrl</kbd> + <kbd class="admin-kbd">S</kbd></span>
        <button type="button" class="admin-button" @click="discard"><LucideIcon :icon="RotateCcw" class="size-3.5" />撤销修改</button>
        <button type="button" class="admin-button admin-primary" :disabled="!canSave" @click="save">
          <LucideIcon :icon="Save" class="size-3.5" />{{ saving ? '正在保存…' : '保存' }}
        </button>
      </div>
    </Transition>
  </template>

  <Dialog v-model:open="mergeOpen" title="合并系列" size="sm">
    <form id="series-merge" class="space-y-3 p-5 text-[13px] text-slate-600" @submit.prevent="merge">
      <p>把这个系列的阶段依次追加到另一个系列末尾（那边已有的奖杯组跳过），这个系列随之下架。之后它的 IGDB collection 出了新作品，会补进合并后的系列。</p>
      <label for="series-merge-into" class="block text-xs font-medium text-slate-700">合并进系列 ID</label>
      <input id="series-merge-into" v-model="mergeInto" inputmode="numeric" class="admin-input" placeholder="如 482" />
      <p v-if="dirty" class="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-xs text-amber-900">合并按已保存的内容进行，这里未保存的修改会丢失。</p>
      <AdminError :error="mergeError" />
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="mergeOpen = false">取消</button>
        <button type="submit" form="series-merge" class="admin-button admin-primary" :disabled="busy || !Number(mergeInto)">{{ busy ? '正在合并…' : '合并' }}</button>
      </div>
    </template>
  </Dialog>

  <Dialog v-model:open="deleteOpen" :title="series?.source === 'igdb' ? '删除（下架）系列' : '删除系列'" size="sm">
    <div class="space-y-3 p-5 text-[13px] text-slate-600">
      <p v-if="series?.source === 'igdb'">自动生成的系列不会真的删掉，只是下架，留作记录，免得下次自动归类又生成一个。以后可以在列表里重新发布。</p>
      <p v-else>手动系列会连同阶段、译名一起删除，不能恢复。</p>
      <AdminError :error="deleteError" />
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button type="button" class="admin-button" @click="deleteOpen = false">取消</button>
        <button type="button" class="admin-button admin-danger" :disabled="busy" @click="destroy">{{ busy ? '正在处理…' : '确认' }}</button>
      </div>
    </template>
  </Dialog>
</template>
