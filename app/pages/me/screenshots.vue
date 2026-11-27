<script setup lang="ts">
import { Gamepad2, HardDrive, Images, Trash2 } from 'lucide'
import { useScreenshotApi, type OwnScreenshot, type ScreenshotPageMeta } from '~/services/screenshots'
import type { MyScreenshotsState, ScreenshotVisibility } from '~/utils/me'
import { ApiError } from '~/utils/ApiError'

/**
 * The signed-in user's game screenshots: storage used against the limits,
 * the upload card (both in a sticky sidebar), and the screenshots in a grid,
 * filterable by visibility and game. Each can be viewed, switched between
 * public and private, given a caption and game, linked to, or deleted.
 * Public ones appear on the profile's screenshot showcases.
 */
definePageMeta({ auth: true })

const { t } = useI18n()
useSeo({ title: () => t('seo.me.screenshots'), noindex: true })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const errorText = useApiErrorText()
const { user } = useAuth()
const api = useScreenshotApi()

// Filters and page live in the URL so Back/Forward and reloads restore the same list.
const state = computed(() => parseMyScreenshotsQuery(route.query))
const requestUrl = computed(() => {
  const query = new URLSearchParams(myScreenshotsRouteQuery(state.value)).toString()
  return query ? `/user/screenshots?${query}` : '/user/screenshots'
})
const { data: response, status, error, refresh } = await useApiFetchRaw<OwnScreenshot[], ScreenshotPageMeta>(() => requestUrl.value, { lazy: true })

const items = computed(() => response.value?.data ?? [])
const meta = computed(() => response.value?.meta)
const usage = computed(() => meta.value?.usage)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
const pending = useFetchPending(status)
const filtered = computed(() => state.value.visibility !== 'all' || state.value.game !== null)

function navigate(next: Partial<MyScreenshotsState>) {
  const location = localizeTo({ query: myScreenshotsRouteQuery({ ...state.value, page: 1, ...next }) })
  return next.page === undefined ? router.replace(location) : router.push(location)
}
function changePage(page: number) {
  navigate({ page })
  document.getElementById('screenshot-results')?.scrollIntoView({ block: 'start' })
}

const VISIBILITIES: ScreenshotVisibility[] = ['all', 'public', 'private']
const gameOptions = computed(() => [
  { value: 0, label: t('screenshots.filters.allGames') },
  ...(meta.value?.games ?? []).map(game => ({ value: game.id, label: game.name, hint: String(game.count) })),
])

// ── Usage ────────────────────────────────────────────────────────────────────

const usageRows = computed(() => {
  const u = usage.value
  if (!u) return []
  return [
    { key: 'count', icon: Images, label: t('screenshots.usage.count'), used: fmt(u.count), limit: u.max_count ? fmt(u.max_count) : null, share: usageShare(u.count, u.max_count) },
    { key: 'bytes', icon: HardDrive, label: t('screenshots.usage.storage'), used: formatStorage(u.bytes), limit: u.max_bytes ? formatStorage(u.max_bytes) : null, share: usageShare(u.bytes, u.max_bytes) },
  ]
})

// ── Uploads ──────────────────────────────────────────────────────────────────

const uploadPanel = ref<{ busy: boolean } | null>(null)
function onUploaded() {
  // Show new uploads at the top: back to the first page without filters that would hide them.
  if (state.value.page > 1 || filtered.value) return
  refresh()
}
function onFinished(count: number) {
  toast.success({ id: 'screenshot-upload', title: t('screenshots.upload.done', { count }) })
  // The list already refreshed after each upload unless it was filtered or paged away.
  if (state.value.page > 1 || filtered.value) navigate({ visibility: 'all', game: null })
}

onBeforeRouteLeave((to, from) => {
  if (to.path === from.path) return
  if (uploadPanel.value?.busy && !window.confirm(t('screenshots.upload.leaveConfirm'))) return false
})

// ── Viewer ───────────────────────────────────────────────────────────────────

const viewerOpen = ref(false)
const viewerIndex = ref(0)
function view(index: number) {
  viewerIndex.value = index
  viewerOpen.value = true
}

// ── Actions ──────────────────────────────────────────────────────────────────

const busyId = ref<number | null>(null)

function replace(updated: OwnScreenshot) {
  if (!response.value) return
  response.value.data = response.value.data.map(item => (item.id === updated.id ? updated : item))
}

async function toggleVisibility(shot: OwnScreenshot) {
  if (busyId.value) return
  busyId.value = shot.id
  try {
    const updated = await api.update(shot.id, { is_public: !shot.is_public })
    toast.success({ title: updated.is_public ? t('screenshots.toast.madePublic') : t('screenshots.toast.madePrivate') })
    // The visibility filter would now hide it: reload the page instead of patching it in place.
    if (state.value.visibility !== 'all') refresh()
    else replace(updated)
  }
  catch (err) {
    toast.error({ title: t('screenshots.toast.updateFailed'), description: errorText(err) })
  }
  finally {
    busyId.value = null
  }
}

const editing = ref<OwnScreenshot | null>(null)
const editOpen = ref(false)
function edit(shot: OwnScreenshot) {
  editing.value = shot
  editOpen.value = true
}
function onSaved(updated: OwnScreenshot) {
  if (filtered.value) refresh()
  else replace(updated)
}

async function copyLink(shot: OwnScreenshot) {
  try {
    await navigator.clipboard.writeText(shot.image.url)
    toast.success({ title: t('screenshots.toast.linkCopied'), description: shot.is_public ? undefined : t('screenshots.toast.linkCopiedPrivate') })
  }
  catch {
    toast.error({ title: t('screenshots.toast.copyFailed') })
  }
}

const deleting = ref<OwnScreenshot | null>(null)
const deleteOpen = ref(false)
const deleteBusy = ref(false)
function askDelete(shot: OwnScreenshot) {
  deleting.value = shot
  deleteOpen.value = true
}
async function confirmDelete() {
  const shot = deleting.value
  if (!shot || deleteBusy.value) return
  deleteBusy.value = true
  try {
    await api.remove(shot.id)
    deleteOpen.value = false
    toast.success({ title: t('screenshots.toast.deleted') })
    if (items.value.length === 1 && state.value.page > 1) navigate({ page: state.value.page - 1 })
    else refresh()
  }
  catch (err) {
    toast.error({ title: t('screenshots.toast.deleteFailed'), description: err instanceof ApiError ? errorText(err) : undefined })
  }
  finally {
    deleteBusy.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader :icon="Images" :title="$t('screenshots.title')" :description="$t('screenshots.description')" />

    <div class="grid items-start gap-5 lg:grid-cols-[18.5rem_minmax(0,1fr)]">
      <!-- Sidebar: usage and uploads -->
      <aside class="space-y-4 lg:sticky lg:top-20">
        <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
          <header class="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <LucideIcon :icon="HardDrive" class="size-4 text-slate-500" />
            <h2 class="text-sm font-semibold text-slate-900">{{ $t('screenshots.usage.title') }}</h2>
          </header>
          <div v-if="usageRows.length" class="space-y-3.5 p-4">
            <div v-for="row in usageRows" :key="row.key">
              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                  <LucideIcon :icon="row.icon" class="size-3.5 text-slate-400" />{{ row.label }}
                </span>
                <span class="tabular-nums text-slate-500">
                  <b class="font-bold text-slate-900">{{ row.used }}</b>
                  <template v-if="row.limit"> / {{ row.limit }}</template>
                </span>
              </div>
              <div v-if="row.share !== null" class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  :class="row.share >= 0.9 ? 'bg-amber-500' : 'bg-slate-900'"
                  :style="{ width: `${Math.max(row.share * 100, row.share > 0 ? 2 : 0)}%` }"
                />
              </div>
            </div>
          </div>
          <div v-else class="space-y-3.5 p-4" aria-hidden="true">
            <div v-for="i in 2" :key="i" class="space-y-2">
              <div class="skeleton h-3 w-full rounded" />
              <div class="skeleton skeleton-soft h-1.5 w-full rounded-full" />
            </div>
          </div>
        </section>

        <ScreenshotsUploadPanel
          v-if="user"
          ref="uploadPanel"
          :psnid="user.psnid"
          @uploaded="onUploaded"
          @finished="onFinished"
        />
      </aside>

      <!-- Screenshots -->
      <section id="screenshot-results" class="min-w-0 scroll-mt-20 space-y-4" :aria-label="$t('screenshots.title')" :aria-busy="pending">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex rounded-lg bg-slate-100 p-0.5" role="group" :aria-label="$t('screenshots.filters.visibility')">
              <button
                v-for="visibility in VISIBILITIES"
                :key="visibility"
                type="button"
                class="h-8 rounded-md px-3 text-xs font-semibold transition"
                :class="state.visibility === visibility ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
                :aria-pressed="state.visibility === visibility"
                @click="navigate({ visibility })"
              >
                {{ $t(`screenshots.filters.${visibility}`) }}
              </button>
            </div>
            <SelectMenu
              v-if="meta?.games.length || state.game"
              :model-value="state.game ?? 0"
              :options="gameOptions"
              :icon="Gamepad2"
              size="sm"
              searchable
              :highlight="state.game !== null"
              :panel-width="300"
              :aria-label="$t('screenshots.filters.game')"
              class="max-w-60"
              @update:model-value="navigate({ game: $event || null })"
            />
          </div>
          <p v-if="meta && items.length" role="status" class="text-[11px] tabular-nums text-slate-400">{{ $t('screenshots.count', { total: fmt(meta.total) }) }}</p>
        </div>

        <div v-if="error && !pending" class="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-400"><LucideIcon :icon="Images" class="size-5" /></span>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('screenshots.loadError') }}</h3>
          <button class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="refresh()">{{ $t('common.retry') }}</button>
        </div>

        <TransitionGroup
          v-else-if="items.length"
          tag="div"
          class="grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3"
          :class="pending ? 'opacity-55' : ''"
          enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
          enter-from-class="scale-95 opacity-0"
        >
          <ScreenshotsTile
            v-for="(shot, index) in items"
            :key="shot.id"
            :screenshot="shot"
            :busy="busyId === shot.id"
            @view="view(index)"
            @toggle-visibility="toggleVisibility(shot)"
            @edit="edit(shot)"
            @copy-link="copyLink(shot)"
            @delete="askDelete(shot)"
          />
        </TransitionGroup>

        <div v-else-if="pending" class="grid animate-skeleton-in gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          <div v-for="i in 6" :key="i" class="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div class="skeleton aspect-video w-full" />
            <div class="space-y-1.5 px-2.5 py-2.5">
              <div class="skeleton skeleton-soft h-2.5 w-2/3 rounded" />
            </div>
          </div>
        </div>

        <div v-else class="rounded-lg border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><LucideIcon :icon="Images" class="size-5" /></span>
          <template v-if="filtered">
            <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('screenshots.emptyFiltered') }}</h3>
            <button
              class="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              @click="navigate({ visibility: 'all', game: null })"
            >
              {{ $t('screenshots.filters.reset') }}
            </button>
          </template>
          <template v-else>
            <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('screenshots.empty') }}</h3>
            <p class="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">{{ $t('screenshots.emptyHint') }}</p>
          </template>
        </div>

        <div v-if="meta && !error && totalPages > 1" class="flex justify-center pt-2">
          <Pagination :page="state.page" :total-pages="totalPages" :siblings="2" @update:page="changePage" />
        </div>
      </section>
    </div>

    <ScreenshotLightbox v-model:open="viewerOpen" v-model:index="viewerIndex" :items="items" />

    <ScreenshotsEditDialog v-if="user" v-model:open="editOpen" :screenshot="editing" :psnid="user.psnid" @saved="onSaved" />

    <ConfirmDialog
      v-model:open="deleteOpen"
      :title="$t('screenshots.deleteTitle')"
      :icon="Trash2"
      :confirm-label="$t('screenshots.tile.delete')"
      :busy-label="$t('screenshots.deleting')"
      :busy="deleteBusy"
      :cancel-disabled="deleteBusy"
      @confirm="confirmDelete"
    >
      <div class="flex gap-3 p-4 sm:p-5">
        <img
          v-if="deleting"
          :src="deleting.image.url"
          :srcset="deleting.image.srcset ?? undefined"
          sizes="128px"
          alt=""
          class="aspect-video w-32 shrink-0 rounded-md object-cover ring-1 ring-slate-200"
        >
        <p class="text-sm leading-6 text-slate-600">{{ $t('screenshots.deleteBody') }}</p>
      </div>
    </ConfirmDialog>
  </div>
</template>
