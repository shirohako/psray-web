<script setup lang="ts">
import { ArrowDownWideNarrow, MessageSquareText, Search, ThumbsUp, Trash2, X } from 'lucide'
import { useTips } from '~/services/tips'
import type { AuthoredTipSort, ProfileTip, TipPageMeta } from '~/types/tip'
import type { MyTipsState } from '~/utils/me'
import { ApiError } from '~/utils/ApiError'

/**
 * The signed-in user's own Tips across all trophies: search, sort, read in
 * full, jump to the trophy, edit in the usual composer, or delete.
 */
definePageMeta({ auth: true })

const { t } = useI18n()
useSeo({ title: () => t('seo.me.tips'), noindex: true })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user } = useAuth()
const { remove } = useTips()

// Search, sort and page live in the URL so Back/Forward and reloads restore the same list.
const state = computed(() => parseMyTipsQuery(route.query))
const requestUrl = computed(() => {
  const query = new URLSearchParams(myTipsRouteQuery(state.value)).toString()
  return query ? `/user/tips?${query}` : '/user/tips'
})
const { data: response, status, error, refresh } = await useApiFetchRaw<ProfileTip[], TipPageMeta>(() => requestUrl.value, { lazy: true })

const items = computed(() => response.value?.data ?? [])
const meta = computed(() => response.value?.meta)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
const pending = useFetchPending(status)
const rangeStart = computed(() => items.value.length ? ((meta.value?.page ?? 1) - 1) * (meta.value?.per_page ?? 20) + 1 : 0)
const rangeEnd = computed(() => items.value.length ? rangeStart.value + items.value.length - 1 : 0)

/** Search and sort changes replace the history entry and go back to page 1; page changes push one. */
function navigate(next: Partial<MyTipsState>) {
  const location = {
    query: {
      ...(route.query.lang ? { lang: route.query.lang } : {}),
      ...myTipsRouteQuery({ ...state.value, page: 1, ...next }),
    },
  }
  return next.page === undefined ? router.replace(location) : router.push(location)
}

function changePage(page: number) {
  navigate({ page })
  document.getElementById('tip-results')?.scrollIntoView({ block: 'start' })
}

// The search box follows the URL, and updates it once typing pauses.
const search = ref(state.value.q)
watch(() => state.value.q, (value) => { search.value = value })
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    const q = value.trim().slice(0, AUTHORED_TIP_SEARCH_MAX)
    if (q !== state.value.q) navigate({ q })
  }, 350)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

// ── Editing (the composer from the trophy page) ──────────────────────────────

const editing = ref<ProfileTip | null>(null)
const composerOpen = ref(false)
function edit(tip: ProfileTip) {
  editing.value = tip
  composerOpen.value = true
}

// ── Deleting ─────────────────────────────────────────────────────────────────

const deleting = ref<ProfileTip | null>(null)
const deleteOpen = ref(false)
const deleteBusy = ref(false)
function askDelete(tip: ProfileTip) {
  deleting.value = tip
  deleteOpen.value = true
}

async function confirmDelete() {
  const tip = deleting.value
  if (!tip || deleteBusy.value) return
  deleteBusy.value = true
  try {
    await remove(tip.trophy_id)
    deleteOpen.value = false
    toast.success({ title: t('trophy.tips.form.deleted') })
    afterDelete(tip)
  }
  catch (error) {
    toast.error({ title: t('trophy.tips.form.deleteFailed'), description: error instanceof ApiError ? error.message : undefined })
  }
  finally {
    deleteBusy.value = false
  }
}

/** Keep the header counts in step, and step back a page when the last row of a later page went. */
function afterDelete(tip: ProfileTip) {
  if (user.value) {
    user.value.tip_count = Math.max(0, user.value.tip_count - 1)
    user.value.tip_vote_count = Math.max(0, user.value.tip_vote_count - tip.vote_up_count)
  }
  if (items.value.length === 1 && state.value.page > 1) navigate({ page: state.value.page - 1 })
  else refresh()
}

const SORTS: { value: AuthoredTipSort; labelKey: string }[] = AUTHORED_TIP_SORTS.map(value => ({ value, labelKey: `me.tips.sorts.${value}` }))
</script>

<template>
  <div class="space-y-5">
    <PageHeader :icon="MessageSquareText" :title="$t('me.tips.title')" :description="$t('me.tips.description')">
      <dl v-if="user" class="grid shrink-0 grid-cols-2 divide-x divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm sm:min-w-72">
        <div class="flex items-center gap-3 px-4 py-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-inset ring-sky-100">
            <LucideIcon :icon="MessageSquareText" class="size-4" />
          </span>
          <div class="flex min-w-0 flex-col-reverse">
            <dt class="truncate text-[11px] font-medium text-slate-500">{{ $t('me.tips.statsTips') }}</dt>
            <dd class="text-xl font-bold leading-tight tabular-nums tracking-tight text-slate-900">{{ fmt(user.tip_count) }}</dd>
          </div>
        </div>
        <div class="flex items-center gap-3 px-4 py-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
            <LucideIcon :icon="ThumbsUp" class="size-4" />
          </span>
          <div class="flex min-w-0 flex-col-reverse">
            <dt class="truncate text-[11px] font-medium text-slate-500">{{ $t('me.tips.statsHelpful') }}</dt>
            <dd class="text-xl font-bold leading-tight tabular-nums tracking-tight text-slate-900">{{ fmt(user.tip_vote_count) }}</dd>
          </div>
        </div>
      </dl>
    </PageHeader>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center gap-2 border-b border-slate-200 p-3 sm:px-4">
        <!-- Search takes the rest of the row; sorting stays compact on the right -->
        <label class="relative min-w-0 flex-1">
          <span class="sr-only">{{ $t('me.tips.searchPlaceholder') }}</span>
          <LucideIcon :icon="Search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            v-model="search"
            type="search"
            :maxlength="AUTHORED_TIP_SEARCH_MAX"
            :placeholder="$t('me.tips.searchPlaceholder')"
            class="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm text-slate-800 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 [&::-webkit-search-cancel-button]:appearance-none"
          >
          <button
            v-if="search"
            type="button"
            class="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
            :aria-label="$t('me.tips.clearSearch')"
            @click="search = ''"
          >
            <LucideIcon :icon="X" class="size-3.5" />
          </button>
        </label>
        <SelectMenu
          :model-value="state.sort"
          :options="SORTS.map(option => ({ value: option.value, label: $t(option.labelKey) }))"
          :icon="ArrowDownWideNarrow"
          class="shrink-0"
          :aria-label="$t('me.tips.sort')"
          @update:model-value="navigate({ sort: $event })"
        />
      </div>

      <section id="tip-results" class="scroll-mt-20" :aria-label="$t('me.tips.title')" :aria-busy="pending">
        <div v-if="error && !pending" class="px-6 py-16 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-400"><LucideIcon :icon="MessageSquareText" class="size-5" /></span>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('me.tips.loadError') }}</h3>
          <button class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="refresh()">{{ $t('common.retry') }}</button>
        </div>

        <div v-else-if="items.length" class="divide-y divide-slate-100 transition-opacity" :class="pending ? 'opacity-55' : ''">
          <MeTipRow v-for="tip in items" :key="tip.id" :tip="tip" @edit="edit(tip)" @delete="askDelete(tip)" />
        </div>

        <div v-else-if="pending" class="animate-skeleton-in divide-y divide-slate-100" aria-hidden="true">
          <div v-for="i in 4" :key="i" class="flex gap-3 px-4 py-4 sm:px-5">
            <div class="skeleton size-12 shrink-0 rounded-lg" />
            <div class="min-w-0 flex-1 space-y-2.5">
              <div class="skeleton h-3.5 w-40 rounded" />
              <div class="skeleton skeleton-soft h-2.5 w-28 rounded" />
              <div class="skeleton skeleton-soft h-3 w-full rounded" />
              <div class="skeleton skeleton-soft h-3 w-2/3 rounded" />
            </div>
          </div>
        </div>

        <div v-else class="px-6 py-16 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><LucideIcon :icon="MessageSquareText" class="size-5" /></span>
          <template v-if="state.q">
            <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('me.tips.emptyFiltered') }}</h3>
            <button
              class="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              @click="navigate({ q: '' })"
            >
              {{ $t('me.tips.reset') }}
            </button>
          </template>
          <template v-else>
            <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('me.tips.empty') }}</h3>
            <p class="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">{{ $t('me.tips.emptyHint') }}</p>
            <NuxtLink to="/trophies" class="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700">
              {{ $t('me.tips.browseTrophies') }}
            </NuxtLink>
          </template>
        </div>

        <div v-if="meta && !error && items.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4">
          <p role="status" class="text-[11px] text-slate-400">{{ $t('me.tips.range', { start: rangeStart, end: rangeEnd, total: meta.total }) }}</p>
          <Pagination v-if="totalPages > 1" :page="state.page" :total-pages="totalPages" :siblings="2" @update:page="changePage" />
        </div>
      </section>
    </div>

    <TrophyTipComposerDialog
      v-if="editing"
      v-model:open="composerOpen"
      :trophy-id="editing.trophy_id"
      :trophy-name="editing.trophy?.name"
      :display-language="editing.language"
      editing
      @published="refresh()"
      @deleted="afterDelete(editing)"
    />

    <ConfirmDialog
      v-model:open="deleteOpen"
      :title="$t('me.tips.deleteTitle')"
      :icon="Trash2"
      :confirm-label="$t('trophy.tips.form.deleteConfirmAction')"
      :busy-label="$t('trophy.tips.form.deleting')"
      :busy="deleteBusy"
      :cancel-disabled="deleteBusy"
      @confirm="confirmDelete"
    >
      <p class="p-4 text-sm leading-6 text-slate-600 sm:p-5">
        {{ $t('me.tips.deleteBody', { trophy: deleting?.trophy?.name ?? $t('me.tips.trophyGone') }) }}
      </p>
    </ConfirmDialog>
  </div>
</template>
