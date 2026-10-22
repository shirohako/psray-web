<script setup lang="ts">
import { AlertTriangle, CircleCheck, Loader2, LogIn, MessageSquare, Pencil, Plus, RotateCw, Trash2 } from 'lucide'
import { useTips } from '~/services/tips'
import type { TrophyTip, TrophyTipPageMeta } from '~/types/tip'
import { ApiError } from '~/utils/ApiError'

const props = defineProps<{
  trophyId: number | string
  trophyName?: string
  open: boolean
}>()
const emit = defineEmits<{
  'update:open': [v: boolean]
  compose: [mode: 'create' | 'edit']
  closed: []
  count: [value: number]
}>()

const route = useRoute()
const { t } = useI18n()
const toast = useToast()
const { loggedIn, user } = useAuth()
const { forTrophy, remove } = useTips()
const page = ref(1)
const tips = ref<TrophyTip[]>([])
const meta = ref<TrophyTipPageMeta>()
const pending = ref(false)
const loadError = ref(false)

const totalPages = computed(() => meta.value?.total_pages ?? 1)
const loginTo = computed(() => ({
  path: '/auth/login',
  query: { redirect: route.fullPath },
}))
async function load() {
  pending.value = true
  loadError.value = false
  try {
    const res = await forTrophy(props.trophyId, { page: page.value })
    tips.value = res.data
    meta.value = res.meta
    emit('count', res.meta?.total ?? res.data.length)
  }
  catch {
    loadError.value = true
  }
  finally {
    pending.value = false
  }
}

// The viewer's own tip can be deleted from here, without opening the editor.
const confirmingDelete = ref(false)
const deleting = ref(false)

async function deleteMine() {
  if (deleting.value) return
  deleting.value = true
  try {
    await remove(props.trophyId)
    // The editor keeps a draft per trophy; it shouldn't come back after a delete.
    if (import.meta.client && user.value) localStorage.removeItem(tipDraftKey(user.value.id, props.trophyId))
    confirmingDelete.value = false
    toast.success({ title: t('trophy.tips.form.deleted') })
    if (page.value !== 1) page.value = 1
    await load()
  }
  catch (error) {
    toast.error({ title: t('trophy.tips.form.deleteFailed'), description: error instanceof ApiError ? error.message : undefined })
  }
  finally {
    deleting.value = false
  }
}

function setPage(value: number) {
  if (value === page.value) return
  page.value = value
  load()
}

watch(() => props.open, (value) => {
  if (!value) return
  confirmingDelete.value = false
  page.value = 1
  load()
}, { immediate: true })
</script>

<template>
  <Dialog :open="open" size="4xl" @update:open="emit('update:open', $event)" @closed="emit('closed')">
    <template #title>
      {{ $t('trophy.tips.title') }}
      <span v-if="trophyName" class="ml-1 font-normal text-slate-400">· {{ trophyName }}</span>
    </template>

    <section class="border-b border-slate-100 bg-slate-50/60 p-4 sm:p-5">
      <!-- Already posted: edit or delete it right here -->
      <div
        v-if="loggedIn && meta?.has_my_tip"
        class="flex flex-col gap-3 rounded-xl border bg-white px-4 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between"
        :class="confirmingDelete ? 'border-rose-200 bg-rose-50/60' : 'border-slate-200'"
      >
        <template v-if="!confirmingDelete">
          <p class="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <LucideIcon :icon="CircleCheck" class="size-4 shrink-0 text-emerald-500" />
            {{ $t('trophy.tips.minePosted') }}
          </p>
          <div class="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
              :disabled="pending"
              @click="emit('compose', 'edit')"
            >
              <LucideIcon :icon="Pencil" class="size-3.5" />
              {{ $t('common.edit') }}
            </button>
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
              :disabled="pending"
              @click="confirmingDelete = true"
            >
              <LucideIcon :icon="Trash2" class="size-3.5" />
              {{ $t('trophy.tips.form.delete') }}
            </button>
          </div>
        </template>
        <template v-else>
          <p class="text-sm font-medium text-rose-700">{{ $t('trophy.tips.form.deleteConfirm') }}</p>
          <div class="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              class="h-8 rounded-lg px-3 text-xs font-semibold text-slate-600 transition hover:bg-white/80"
              :disabled="deleting"
              @click="confirmingDelete = false"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              :disabled="deleting"
              @click="deleteMine"
            >
              <LucideIcon :icon="deleting ? Loader2 : Trash2" class="size-3.5" :class="{ 'animate-spin': deleting }" />
              {{ deleting ? $t('trophy.tips.form.deleting') : $t('trophy.tips.form.deleteConfirmAction') }}
            </button>
          </div>
        </template>
      </div>

      <button
        v-else-if="loggedIn"
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
        :disabled="pending"
        @click="emit('compose', 'create')"
      >
        <LucideIcon :icon="Plus" class="size-4" />
        {{ $t('trophy.tips.form.open') }}
      </button>

      <div v-else class="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-center sm:flex-row sm:text-left">
        <div>
          <p class="text-sm font-semibold text-slate-800">{{ $t('trophy.tips.form.loginTitle') }}</p>
          <p class="mt-0.5 text-xs text-slate-400">{{ $t('trophy.tips.form.loginHint') }}</p>
        </div>
        <NuxtLink :to="loginTo" class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          <LucideIcon :icon="LogIn" class="size-4" />
          {{ $t('nav.login') }}
        </NuxtLink>
      </div>
    </section>

    <div v-if="pending && !tips.length" class="space-y-4 p-5">
      <div v-for="i in 4" :key="i" class="flex gap-3">
        <div class="size-9 shrink-0 animate-pulse rounded-full bg-slate-200" />
        <div class="flex-1 space-y-2">
          <div class="h-3 w-1/4 animate-pulse rounded bg-slate-200" />
          <div class="h-3 w-full animate-pulse rounded bg-slate-200" />
          <div class="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </div>

    <div v-else-if="loadError && !tips.length" class="flex flex-col items-center gap-3 px-5 py-14 text-center">
      <LucideIcon :icon="AlertTriangle" class="size-8 text-rose-400" />
      <p class="text-sm text-slate-500">{{ $t('trophy.tips.loadFailed') }}</p>
      <button type="button" class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50" @click="load">
        <LucideIcon :icon="RotateCw" class="size-4" />
        {{ $t('common.retry') }}
      </button>
    </div>

    <div v-else-if="!tips.length" class="flex flex-col items-center gap-2 px-5 py-16 text-center text-slate-400">
      <LucideIcon :icon="MessageSquare" class="size-8" />
      <p class="text-sm">{{ $t('trophy.tips.empty') }}</p>
    </div>

    <ul v-else class="divide-y divide-slate-100 transition-opacity" :class="{ 'opacity-50': pending }">
      <li v-for="tip in tips" :key="tip.id">
        <TrophyTipCard :tip="tip" :mine="!!user && tip.user_id === user.id" />
      </li>
    </ul>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-slate-400">{{ $t('trophy.tips.total', { count: fmt(meta?.total) }) }}</span>
        <Pagination :page="page" :total-pages="totalPages" @update:page="setPage" />
      </div>
    </template>
  </Dialog>
</template>
