<script setup lang="ts">
import { Check, ImagePlus, Loader2, Plus, Search, Trash2, Upload, X } from 'lucide'
import type { GameBrowseItem, GameBrowseMeta } from '~/services/games'
import { gameItemId, itemFromGame, itemFromUpload, uploadItemId } from '~/utils/tierList'
import { TROPHY_SEARCH_MIN_LENGTH } from '~/utils/trophyLibrary'
import type { TierLibraryImage } from '~/composables/useTierEditor'

/**
 * Where tiles come from: game search (the public `/games` endpoint) and the
 * images uploaded on this device. Click a result to put it in the pool, or
 * drag it straight onto a row.
 */
const editor = useTierEditor()
const { raw } = useApi()

const tab = ref<'search' | 'images'>('search')

// ---------- search ----------

const PAGE_SIZE = 24
const query = ref('')
const results = ref<GameBrowseItem[]>([])
const meta = ref<GameBrowseMeta | null>(null)
const status = ref<'idle' | 'loading' | 'done' | 'error'>('idle')
const loadingMore = ref(false)
const term = computed(() => query.value.trim().slice(0, 100))
const hasMore = computed(() => Boolean(meta.value && meta.value.page < meta.value.total_pages))

let timer = 0
let seq = 0

async function search(page = 1) {
  const q = term.value
  const id = ++seq
  if (q.length < TROPHY_SEARCH_MIN_LENGTH) {
    status.value = 'idle'
    results.value = []
    meta.value = null
    return
  }
  if (page === 1) status.value = 'loading'
  else loadingMore.value = true
  try {
    const response = await raw.get<GameBrowseItem[], GameBrowseMeta>('/games', { query: { q, per_page: PAGE_SIZE, page } })
    if (id !== seq) return
    results.value = page === 1 ? response.data : [...results.value, ...response.data]
    meta.value = response.meta ?? null
    status.value = 'done'
  }
  catch {
    if (id === seq && page === 1) status.value = 'error'
  }
  finally {
    if (id === seq) loadingMore.value = false
  }
}

watch(term, () => {
  window.clearTimeout(timer)
  timer = window.setTimeout(() => search(), 350)
})
onBeforeUnmount(() => window.clearTimeout(timer))

function submit() {
  window.clearTimeout(timer)
  search()
}

function dragGame(event: PointerEvent, game: GameBrowseItem) {
  const item = itemFromGame(game)
  editor.drag.start(event, { kind: 'new', item }, event.currentTarget as HTMLElement, { src: item.cover, color: item.color })
}

// ---------- images ----------

const fileInput = ref<HTMLInputElement | null>(null)
const dropActive = ref(false)
const deleting = ref<TierLibraryImage | null>(null)
const deleteOpen = computed({
  get: () => Boolean(deleting.value),
  set: (open) => { if (!open) deleting.value = null },
})

function onFiles(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.length) editor.upload([...input.files])
  input.value = ''
}

function onFileDrop(event: DragEvent) {
  dropActive.value = false
  const files = [...(event.dataTransfer?.files ?? [])]
  if (!files.length) return
  tab.value = 'images'
  editor.upload(files)
}

function dragImage(event: PointerEvent, image: TierLibraryImage) {
  editor.drag.start(event, { kind: 'new', item: itemFromUpload(image) }, event.currentTarget as HTMLElement, { src: image.url, color: null })
}

async function confirmDelete() {
  const image = deleting.value
  deleting.value = null
  if (image) await editor.deleteImage(image.id)
}

const tabClass = (active: boolean) => active
  ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/10'
  : 'text-slate-500 hover:text-slate-800'
</script>

<template>
  <aside class="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:max-h-[calc(100vh-6.5rem)]" :aria-label="$t('tierlist.source.title')">
    <div class="space-y-3 border-b border-slate-100 p-3">
      <h2 class="text-sm font-bold text-slate-900">{{ $t('tierlist.source.title') }}</h2>
      <div class="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-0.5" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'search'"
          class="flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition"
          :class="tabClass(tab === 'search')"
          @click="tab = 'search'"
        >
          <LucideIcon :icon="Search" class="size-3.5" />{{ $t('tierlist.source.searchTab') }}
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'images'"
          class="flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-md text-xs font-semibold transition"
          :class="tabClass(tab === 'images')"
          @click="tab = 'images'"
        >
          <LucideIcon :icon="ImagePlus" class="size-3.5" />{{ $t('tierlist.source.imagesTab') }}
          <span v-if="editor.images.length" class="text-[10px] font-medium text-slate-400 tabular-nums">{{ editor.images.length }}</span>
        </button>
      </div>

      <form v-if="tab === 'search'" role="search" class="relative" @submit.prevent="submit">
        <LucideIcon :icon="Search" class="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
        <input
          v-model="query"
          type="search"
          maxlength="100"
          :placeholder="$t('tierlist.source.searchPlaceholder')"
          :aria-label="$t('tierlist.source.searchTab')"
          class="h-8.5 w-full rounded-md border border-slate-200 bg-slate-50/60 pl-8 pr-8 text-xs outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100 [&::-webkit-search-cancel-button]:hidden"
        >
        <button
          v-if="query"
          type="button"
          class="absolute right-1.5 top-1.5 grid size-5.5 cursor-pointer place-items-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          :aria-label="$t('games.clearSearch')"
          @click="query = ''"
        >
          <LucideIcon :icon="X" class="size-3.5" />
        </button>
      </form>
    </div>

    <!-- Search results / image library -->
    <div class="max-h-[26rem] min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 lg:max-h-none">
      <template v-if="tab === 'search'">
        <p v-if="status === 'idle'" class="py-6 text-center text-xs leading-5 text-slate-400">{{ $t('tierlist.source.searchHint', { count: TROPHY_SEARCH_MIN_LENGTH }) }}</p>
        <div v-else-if="status === 'loading'" class="grid grid-cols-3 gap-x-2 gap-y-3" aria-hidden="true">
          <div v-for="index in 9" :key="index">
            <div class="skeleton aspect-3/4 rounded" />
            <div class="skeleton skeleton-soft mt-1.5 h-2.5 w-4/5 rounded" />
          </div>
        </div>
        <div v-else-if="status === 'error'" class="py-6 text-center">
          <p class="text-xs text-slate-500">{{ $t('tierlist.source.searchError') }}</p>
          <button type="button" class="mt-3 cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700" @click="submit">{{ $t('common.retry') }}</button>
        </div>
        <p v-else-if="!results.length" class="py-6 text-center text-xs text-slate-400">{{ $t('tierlist.source.searchEmpty') }}</p>
        <template v-else>
          <ul class="grid grid-cols-3 gap-x-2 gap-y-3">
            <li v-for="game in results" :key="game.id">
              <button
                type="button"
                class="group block w-full cursor-grab touch-manipulation select-none text-left [-webkit-touch-callout:none] focus:outline-none active:cursor-grabbing"
                :title="editor.has(gameItemId(game.id)) ? $t('tierlist.source.added') : game.localized_name"
                :aria-label="editor.has(gameItemId(game.id)) ? `${game.localized_name}: ${$t('tierlist.source.added')}` : $t('tierlist.source.add', { name: game.localized_name })"
                @pointerdown="dragGame($event, game)"
                @click="editor.addGame(game)"
              >
                <span class="relative block rounded group-focus-visible:ring-2 group-focus-visible:ring-slate-900 group-focus-visible:ring-offset-1">
                  <GameCover :image="game.cover" :alt="game.localized_name" :seed="game.id" sizes="96px" class="pointer-events-none transition" :class="editor.has(gameItemId(game.id)) ? 'opacity-45' : ''" />
                  <span v-if="editor.has(gameItemId(game.id))" class="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-emerald-600 text-white shadow-sm">
                    <LucideIcon :icon="Check" class="size-3" stroke-width="3" />
                  </span>
                  <span v-else class="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow-sm ring-1 ring-black/5 transition group-hover:opacity-100">
                    <LucideIcon :icon="Plus" class="size-3" stroke-width="2.5" />
                  </span>
                </span>
                <span class="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-600 group-hover:text-slate-900">{{ game.localized_name }}</span>
              </button>
            </li>
          </ul>
          <button
            v-if="hasMore"
            type="button"
            class="mt-4 flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60"
            :disabled="loadingMore"
            @click="search((meta?.page ?? 1) + 1)"
          >
            <LucideIcon v-if="loadingMore" :icon="Loader2" class="size-3.5 animate-spin" />{{ $t('tierlist.source.loadMore') }}
          </button>
        </template>
      </template>

      <template v-else>
        <p v-if="editor.imagesReady && !editor.images.length" class="py-6 text-center text-xs leading-5 text-slate-400">{{ $t('tierlist.source.imagesEmpty') }}</p>
        <ul v-else class="grid grid-cols-3 gap-2">
          <li v-for="image in editor.images" :key="image.id" class="group relative">
            <button
              type="button"
              class="block w-full cursor-grab touch-manipulation select-none overflow-hidden rounded ring-1 ring-black/5 [-webkit-touch-callout:none] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 active:cursor-grabbing"
              :title="image.name"
              :aria-label="editor.has(uploadItemId(image.id)) ? `${image.name}: ${$t('tierlist.source.added')}` : $t('tierlist.source.add', { name: image.name })"
              @pointerdown="dragImage($event, image)"
              @click="editor.addImage(image)"
            >
              <img :src="image.url" alt="" draggable="false" class="pointer-events-none aspect-3/4 w-full bg-slate-100 object-cover transition" :class="editor.has(uploadItemId(image.id)) ? 'opacity-45' : 'group-hover:opacity-90'">
            </button>
            <span v-if="editor.has(uploadItemId(image.id))" class="pointer-events-none absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-emerald-600 text-white shadow-sm">
              <LucideIcon :icon="Check" class="size-3" stroke-width="3" />
            </span>
            <button
              type="button"
              class="absolute left-1 top-1 grid size-6 cursor-pointer place-items-center rounded-md bg-white/90 text-slate-500 opacity-100 shadow-sm ring-1 ring-black/5 transition hover:text-rose-600 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              :aria-label="$t('tierlist.images.delete', { name: image.name })"
              :title="$t('tierlist.images.deleteShort')"
              @click="deleting = image"
            >
              <LucideIcon :icon="Trash2" class="size-3.5" />
            </button>
          </li>
        </ul>
      </template>
    </div>

    <div class="space-y-2.5 border-t border-slate-100 p-3">
      <p class="text-[11px] leading-4 text-slate-400">{{ $t('tierlist.source.hint') }}</p>
      <label
        class="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-3 py-4 text-center transition focus-within:ring-2 focus-within:ring-slate-900"
        :class="dropActive ? 'border-slate-900 bg-slate-100' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/70'"
        @dragover.prevent="dropActive = true"
        @dragleave="dropActive = false"
        @drop.prevent="onFileDrop"
      >
        <input ref="fileInput" type="file" accept="image/*" multiple class="sr-only" :disabled="editor.uploading" @change="onFiles">
        <LucideIcon :icon="editor.uploading ? Loader2 : Upload" class="size-4.5 text-slate-500" :class="editor.uploading ? 'animate-spin' : ''" />
        <span class="text-xs font-semibold text-slate-700">{{ editor.uploading ? $t('tierlist.source.uploading') : $t('tierlist.source.upload') }}</span>
        <span class="text-[11px] text-slate-400">{{ $t('tierlist.source.uploadHint') }}</span>
      </label>
    </div>

    <ConfirmDialog
      v-model:open="deleteOpen"
      :title="$t('tierlist.images.deleteTitle')"
      :icon="Trash2"
      :confirm-label="$t('tierlist.images.deleteConfirm')"
      @confirm="confirmDelete"
    >
      <p class="p-4 text-sm leading-6 text-slate-600 sm:p-5">{{ $t('tierlist.images.deleteBody') }}</p>
    </ConfirmDialog>
  </aside>
</template>
