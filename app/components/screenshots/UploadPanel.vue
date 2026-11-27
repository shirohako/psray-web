<script setup lang="ts">
import { AlertCircle, Check, Gamepad2, Globe, ImageUp, Info, Link2, Loader2, RotateCw, Stamp, X } from 'lucide'
import type { ShowcaseGame } from '~/services/profile'
import { useScreenshotApi, type OwnScreenshot } from '~/services/screenshots'
import { ApiError } from '~/utils/ApiError'

/**
 * The upload card on /me/screenshots: a drop zone (or file picker, several at
 * once), the choices for this batch, and the queue. Files go up one at a
 * time; each is shrunk in the browser first when the API would shrink it
 * anyway. Once a file is sent it shows as processing until the API has
 * resized and stored it. Visibility and watermarks are remembered on this
 * device; the watermarks are drawn into the picture and can't change later.
 */
const props = defineProps<{ psnid: string, disabled?: boolean }>()
const emit = defineEmits<{ uploaded: [screenshot: OwnScreenshot], finished: [count: number] }>()
const { t } = useI18n()
const errorText = useApiErrorText()
const api = useScreenshotApi()

// ── Choices for the batch ────────────────────────────────────────────────────

const choices = reactive({ ...SCREENSHOT_DEFAULTS })
const game = ref<ShowcaseGame | null>(null)
const gamePickerOpen = ref(false)

onMounted(() => {
  Object.assign(choices, parseUploadDefaults(localStorage.getItem(SCREENSHOT_DEFAULTS_KEY)))
  watch(choices, value => localStorage.setItem(SCREENSHOT_DEFAULTS_KEY, JSON.stringify(value)), { deep: true })
})

// ── Queue ────────────────────────────────────────────────────────────────────

type Status = 'waiting' | 'preparing' | 'uploading' | 'processing' | 'done' | 'failed'
interface QueueItem {
  key: number
  file: File
  preview: string
  status: Status
  progress: number
  error: string | null
}

let nextKey = 0
const queue = ref<QueueItem[]>([])
const busy = ref(false)
const controller = shallowRef<AbortController | null>(null)
const failedCount = computed(() => queue.value.filter(item => item.status === 'failed').length)
const doneCount = computed(() => queue.value.filter(item => item.status === 'done').length)

function add(files: Iterable<File>) {
  for (const file of files) {
    queue.value.push({ key: nextKey++, file, preview: URL.createObjectURL(file), status: 'waiting', progress: 0, error: null })
  }
  run()
}

/** Uploads waiting files one by one; stops the rest when the limit or rate limit is hit. */
async function run() {
  if (busy.value) return
  busy.value = true
  let uploaded = 0
  try {
    let item: QueueItem | undefined
    while ((item = queue.value.find(entry => entry.status === 'waiting'))) {
      const stop = await uploadOne(item)
      if (item.status === 'done') uploaded++
      if (stop) {
        for (const rest of queue.value) {
          if (rest.status === 'waiting') Object.assign(rest, { status: 'failed', error: stop })
        }
        break
      }
    }
  }
  finally {
    busy.value = false
    controller.value = null
    if (uploaded) emit('finished', uploaded)
  }
}

/** Returns a message when the remaining files shouldn't be tried now. */
async function uploadOne(item: QueueItem): Promise<string | null> {
  item.status = 'preparing'
  item.error = null
  item.progress = 0
  let blob: Blob
  try {
    blob = await prepareScreenshot(item.file)
  }
  catch (error) {
    item.status = 'failed'
    item.error = error instanceof ScreenshotFileError
      ? t(`screenshots.upload.errors.${error.reason}`, { min: SCREENSHOT_RULE.minSize.join('×') })
      : t('screenshots.upload.errors.notImage')
    return null
  }

  item.status = 'uploading'
  controller.value = new AbortController()
  try {
    const screenshot = await api.upload(blob, {
      is_public: choices.isPublic,
      watermark_psn: choices.watermarkPsn,
      watermark_profile: choices.watermarkProfile,
      trophy_set_id: game.value?.id ?? null,
    }, {
      filename: uploadName(item.file.name, blob.type),
      onProgress: (fraction) => { item.progress = fraction },
      onSent: () => { item.status = 'processing' },
      signal: controller.value.signal,
    })
    item.status = 'done'
    item.progress = 1
    emit('uploaded', screenshot)
    return null
  }
  catch (error) {
    item.status = 'failed'
    if (error instanceof DOMException && error.name === 'AbortError') {
      item.error = t('screenshots.upload.errors.cancelled')
      return item.error
    }
    const field = error instanceof ApiError && error.isValidation ? Object.values(error.fieldErrors())[0] : undefined
    item.error = field ?? errorText(error) ?? t('errors.title')
    const code = error instanceof ApiError ? error.code : null
    return code === 'SCREENSHOT_QUOTA_EXCEEDED' || code === 'TOO_MANY_REQUESTS' ? item.error : null
  }
}

/** The original name, with the extension of what is actually sent. */
function uploadName(name: string, type: string) {
  const base = name.replace(/\.[^.]+$/, '') || 'screenshot'
  return `${base}.${type === 'image/jpeg' ? 'jpg' : type.replace('image/', '') || 'webp'}`
}

function retryFailed() {
  for (const item of queue.value) {
    if (item.status === 'failed') Object.assign(item, { status: 'waiting', error: null, progress: 0 })
  }
  run()
}

function clearFinished() {
  queue.value = queue.value.filter((item) => {
    const keep = item.status !== 'done' && item.status !== 'failed'
    if (!keep) URL.revokeObjectURL(item.preview)
    return keep
  })
}

/**
 * Stops the waiting files. A file still being sent is aborted; one already
 * sent is left to finish, since the API saves it anyway.
 */
function cancel() {
  for (const item of queue.value) {
    if (item.status === 'waiting') Object.assign(item, { status: 'failed', error: t('screenshots.upload.errors.cancelled') })
  }
  if (!queue.value.some(item => item.status === 'processing')) controller.value?.abort()
}

onBeforeUnmount(() => {
  controller.value?.abort()
  for (const item of queue.value) URL.revokeObjectURL(item.preview)
})
defineExpose({ busy })

// ── Picking and dropping ─────────────────────────────────────────────────────

const input = ref<HTMLInputElement | null>(null)
const dropActive = ref(false)

function onPick(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) add(target.files)
  target.value = ''
}
function onDrop(event: DragEvent) {
  dropActive.value = false
  if (props.disabled) return
  const files = [...(event.dataTransfer?.files ?? [])]
  if (files.length) add(files)
}

const options = computed(() => [
  { key: 'isPublic' as const, icon: Globe, label: t('screenshots.upload.public'), hint: t('screenshots.upload.publicHint') },
  { key: 'watermarkPsn' as const, icon: Stamp, label: t('screenshots.upload.watermarkPsn'), hint: t('screenshots.upload.watermarkPsnHint', { psnid: props.psnid }) },
  { key: 'watermarkProfile' as const, icon: Link2, label: t('screenshots.upload.watermarkProfile'), hint: t('screenshots.upload.watermarkProfileHint') },
])
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <header class="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
      <LucideIcon :icon="ImageUp" class="size-4 text-slate-500" />
      <h2 class="text-sm font-semibold text-slate-900">{{ $t('screenshots.upload.title') }}</h2>
    </header>

    <div class="space-y-4 p-4">
      <!-- Drop zone -->
      <button
        type="button"
        class="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed px-4 py-7 text-center transition disabled:cursor-not-allowed disabled:opacity-60"
        :class="dropActive ? 'border-slate-500 bg-slate-100' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/70'"
        :disabled="disabled"
        @click="input?.click()"
        @dragenter.prevent="dropActive = true"
        @dragover.prevent="dropActive = true"
        @dragleave.prevent="dropActive = false"
        @drop.prevent="onDrop"
      >
        <span class="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition" :class="{ 'scale-110': dropActive }">
          <LucideIcon :icon="ImageUp" class="size-4.5" />
        </span>
        <span class="text-[13px] font-semibold text-slate-800">{{ $t('screenshots.upload.drop') }}</span>
        <span class="text-[11px] leading-4 text-slate-400">{{ $t('screenshots.upload.formats') }}</span>
      </button>
      <input ref="input" type="file" accept="image/*" multiple class="hidden" @change="onPick">

      <!-- Choices for this batch -->
      <div class="divide-y divide-slate-100">
        <div v-for="option in options" :key="option.key" class="flex items-center justify-between gap-3 py-2.5">
          <div class="flex min-w-0 items-start gap-2.5">
            <LucideIcon :icon="option.icon" class="mt-0.5 size-4 shrink-0 text-slate-500" />
            <div class="min-w-0">
              <p class="text-[13px] font-semibold text-slate-800">{{ option.label }}</p>
              <p class="mt-0.5 text-[11px] leading-4 text-slate-400">{{ option.hint }}</p>
            </div>
          </div>
          <SettingsSwitch v-model="choices[option.key]" :label="option.label" :disabled="busy" />
        </div>
      </div>
      <p class="flex items-start gap-1.5 text-[11px] leading-4 text-slate-400">
        <LucideIcon :icon="Info" class="mt-px size-3.5 shrink-0" />{{ $t('screenshots.upload.watermarkFinal') }}
      </p>

      <!-- Game -->
      <div>
        <p class="mb-1.5 text-[11px] font-bold text-slate-500">{{ $t('screenshots.upload.game') }}</p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-[13px] transition hover:border-slate-300 disabled:opacity-60"
            :disabled="busy"
            @click="gamePickerOpen = true"
          >
            <img v-if="game" :src="game.icon_url" alt="" class="size-5 shrink-0 rounded object-cover">
            <LucideIcon v-else :icon="Gamepad2" class="size-4 shrink-0 text-slate-400" />
            <span v-if="game" class="truncate font-medium text-slate-800" :lang="contentLang(game.display_language, game.name)">{{ game.name }}</span>
            <span v-else class="truncate text-slate-400">{{ $t('screenshots.upload.noGame') }}</span>
          </button>
          <button
            v-if="game"
            type="button"
            class="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            :aria-label="$t('screenshots.upload.clearGame')"
            :disabled="busy"
            @click="game = null"
          >
            <LucideIcon :icon="X" class="size-4" />
          </button>
        </div>
      </div>

      <!-- Queue -->
      <div v-if="queue.length" class="space-y-2.5 border-t border-slate-100 pt-3.5">
        <TransitionGroup
          tag="ul"
          class="space-y-2"
          enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
          enter-from-class="-translate-y-1 opacity-0"
        >
          <li v-for="item in queue" :key="item.key" class="flex items-center gap-2.5">
            <img :src="item.preview" alt="" class="h-7 w-12 shrink-0 rounded object-cover ring-1 ring-slate-200">
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2 text-[11px]">
                <span class="truncate font-semibold text-slate-700">{{ item.file.name }}</span>
                <span class="shrink-0 tabular-nums" :class="item.status === 'failed' ? 'text-rose-600' : 'text-slate-400'">
                  <LucideIcon v-if="item.status === 'done'" :icon="Check" class="size-3.5 text-emerald-600" />
                  <LucideIcon v-else-if="item.status === 'failed'" :icon="AlertCircle" class="size-3.5" />
                  <LucideIcon v-else-if="item.status === 'preparing'" :icon="Loader2" class="size-3.5 animate-spin" />
                  <template v-else-if="item.status === 'uploading'">{{ Math.round(item.progress * 100) }}%</template>
                  <span v-else-if="item.status === 'processing'" class="inline-flex items-center gap-1">
                    <LucideIcon :icon="Loader2" class="size-3.5 animate-spin" />{{ $t('screenshots.upload.processing') }}
                  </span>
                  <template v-else>{{ $t('screenshots.upload.waiting') }}</template>
                </span>
              </div>
              <p v-if="item.error" class="mt-0.5 line-clamp-2 text-[11px] leading-4 text-rose-600">{{ item.error }}</p>
              <div v-else class="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none"
                  :class="item.status === 'done' ? 'bg-emerald-500' : item.status === 'processing' ? 'animate-pulse bg-slate-900 motion-reduce:animate-none' : 'bg-slate-900'"
                  :style="{ width: `${Math.round(item.progress * 100)}%` }"
                />
              </div>
            </div>
          </li>
        </TransitionGroup>

        <div class="flex flex-wrap items-center justify-end gap-1.5">
          <button
            v-if="busy"
            type="button"
            class="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            @click="cancel"
          >
            {{ $t('common.cancel') }}
          </button>
          <template v-else>
            <button
              v-if="failedCount"
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              @click="retryFailed"
            >
              <LucideIcon :icon="RotateCw" class="size-3" />{{ $t('screenshots.upload.retry', { count: failedCount }) }}
            </button>
            <button
              v-if="doneCount || failedCount"
              type="button"
              class="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              @click="clearFinished"
            >
              {{ $t('screenshots.upload.clear') }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <ScreenshotsGamePicker v-model:open="gamePickerOpen" :psnid="psnid" @select="game = $event" />
  </section>
</template>
