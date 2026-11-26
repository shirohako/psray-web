<script setup lang="ts">
import { AlertTriangle, Check, Crop, ImagePlus, Loader2, ZoomIn, ZoomOut } from 'lucide'
import type { UploadedMedia } from '~/services/media'
import { useMediaApi } from '~/services/media'
import type { CropBounds, CropState, UserMediaPurpose } from '~/utils/media'
import {
  MEDIA_RULES,
  MEDIA_SOURCE_MAX_BYTES,
  cropBackgroundStyle,
  cropBounds,
  cropOutputSize,
  cropRect,
  drawCrop,
  encodeCrop,
  formatFileSize,
  initialCrop,
  loadImageFile,
  sliderToZoom,
  zoomCrop,
  zoomToSlider,
} from '~/utils/media'

/**
 * Pick, crop and upload a banner or avatar. Call `choose(purpose)` from a
 * click: it opens the file picker, and the dialog once a file is picked.
 * The left side crops; the right shows the profile header with the crop in
 * place. Confirming crops and scales in the browser, uploads to `POST /media`
 * and emits the stored picture. Attaching it is the caller's job.
 */
defineProps<{
  psnid: string
  country?: string | null
  /** What the header preview shows for the part not being changed. */
  bannerUrl: string
  avatarUrl: string | null
}>()

const emit = defineEmits<{ uploaded: [media: UploadedMedia, purpose: UserMediaPurpose] }>()

const { t } = useI18n()
const errorText = useApiErrorText()
const mediaApi = useMediaApi()

const open = ref(false)
const purpose = ref<UserMediaPurpose>('banner')
const rule = computed(() => MEDIA_RULES[purpose.value])
const input = ref<HTMLInputElement | null>(null)

type Loaded = { image: HTMLImageElement, url: string, bounds: CropBounds, name: string }
const loaded = shallowRef<Loaded | null>(null)
const loading = ref(false)
const loadError = ref<string | null>(null)
const crop = ref<CropState>({ zoom: 1, x: 0, y: 0 })

const status = ref<'idle' | 'working' | 'failed'>('idle')
const progress = ref(0)
const uploadBytes = ref(0)
const uploadError = ref<string | null>(null)
let abort: AbortController | null = null

defineExpose({ choose })

/** Opens the file picker for this purpose. Must run inside a click. */
function choose(next: UserMediaPurpose) {
  purpose.value = next
  if (input.value) {
    input.value.value = ''
    input.value.click()
  }
}

function onPicked(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) void load(file)
}

function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file && !busy.value) void load(file)
}

async function load(file: File) {
  open.value = true
  resetUpload()
  release()
  loadError.value = null
  if (!file.type.startsWith('image/') && file.type !== '') {
    loadError.value = t('settings.profile.crop.errors.notImage')
    return
  }
  if (file.size > MEDIA_SOURCE_MAX_BYTES) {
    loadError.value = t('settings.profile.crop.errors.tooLarge', { max: formatFileSize(MEDIA_SOURCE_MAX_BYTES) })
    return
  }

  loading.value = true
  try {
    const { image, url } = await loadImageFile(file)
    const bounds = cropBounds(image.naturalWidth, image.naturalHeight, rule.value)
    if (!bounds) {
      URL.revokeObjectURL(url)
      loadError.value = t('settings.profile.crop.errors.tooSmall', {
        min: `${rule.value.minSize[0]} × ${rule.value.minSize[1]}`,
        size: `${image.naturalWidth} × ${image.naturalHeight}`,
      })
      return
    }
    loaded.value = { image, url, bounds, name: file.name }
    crop.value = initialCrop(bounds)
  }
  catch {
    loadError.value = t('settings.profile.crop.errors.unreadable')
  }
  finally {
    loading.value = false
  }
}

/** Frees the picture once the dialog has finished closing. */
function release() {
  if (loaded.value) URL.revokeObjectURL(loaded.value.url)
  loaded.value = null
}

function onClosed() {
  release()
  loadError.value = null
  resetUpload()
}

function resetUpload() {
  abort?.abort()
  abort = null
  status.value = 'idle'
  progress.value = 0
  uploadBytes.value = 0
  uploadError.value = null
}

// Closing mid-upload cancels it.
watch(open, (value) => {
  if (!value && status.value === 'working') resetUpload()
})

const busy = computed(() => status.value === 'working')

const rect = computed(() => (loaded.value ? cropRect(crop.value, loaded.value.bounds) : null))
const output = computed(() => (rect.value ? cropOutputSize(rect.value.width, rule.value) : null))
const cropStyle = computed(() => (loaded.value && rect.value
  ? cropBackgroundStyle(rect.value, loaded.value.bounds.imageWidth, loaded.value.bounds.imageHeight, loaded.value.url)
  : {}))

const slider = computed({
  get: () => (loaded.value ? zoomToSlider(crop.value.zoom, loaded.value.bounds) : 0),
  set: (value: number) => {
    if (loaded.value) crop.value = zoomCrop(crop.value, loaded.value.bounds, sliderToZoom(value, loaded.value.bounds))
  },
})
const canZoom = computed(() => (loaded.value?.bounds.maxZoom ?? 1) > 1.01)
function nudgeZoom(direction: 1 | -1) {
  if (loaded.value) crop.value = zoomCrop(crop.value, loaded.value.bounds, crop.value.zoom * (direction > 0 ? 1.25 : 0.8))
}

async function confirm() {
  if (!loaded.value || !rect.value || !output.value || busy.value) return
  resetUpload()
  status.value = 'working'
  const controller = new AbortController()
  abort = controller
  try {
    const canvas = drawCrop(loaded.value.image, rect.value, output.value.width, output.value.height)
    const blob = await encodeCrop(canvas, rule.value.maxBytes)
    if (controller.signal.aborted) return
    uploadBytes.value = blob.size
    const media = await mediaApi.upload(blob, purpose.value, {
      filename: loaded.value.name,
      signal: controller.signal,
      onProgress: (fraction) => { progress.value = fraction },
    })
    emit('uploaded', media, purpose.value)
    status.value = 'idle'
    open.value = false
  }
  catch (error) {
    if (controller.signal.aborted) return
    status.value = 'failed'
    uploadError.value = errorText(error) ?? t('settings.profile.crop.errors.uploadFailed')
  }
}

const title = computed(() => t(purpose.value === 'banner' ? 'settings.profile.crop.titleBanner' : 'settings.profile.crop.titleAvatar'))
const ratioLabel = computed(() => rule.value.aspect.join(':'))
const percent = computed(() => Math.round(progress.value * 100))

const appConfig = useAppConfig()
</script>

<template>
  <input
    ref="input"
    type="file"
    accept="image/*"
    class="hidden"
    tabindex="-1"
    aria-hidden="true"
    @change="onPicked"
  />

  <Dialog v-model:open="open" :title="title" size="4xl" @closed="onClosed">
    <div class="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <!-- Crop -->
      <div class="min-w-0">
        <p class="mb-3 text-sm text-slate-500">{{ $t('settings.profile.crop.hint') }}</p>

        <div
          v-if="loading || loadError || !loaded"
          class="grid h-64 place-items-center rounded-lg border border-dashed px-6 text-center sm:h-80"
          :class="loadError ? 'border-rose-200 bg-rose-50/60' : 'border-slate-200 bg-slate-50'"
          @dragover.prevent
          @drop.prevent="onDrop"
        >
          <p v-if="loadError" class="flex max-w-sm flex-col items-center gap-2 text-sm font-medium text-rose-700">
            <LucideIcon :icon="AlertTriangle" class="size-5" />
            {{ loadError }}
          </p>
          <p v-else class="flex items-center gap-2 text-sm text-slate-500">
            <LucideIcon :icon="Loader2" class="size-4 animate-spin" />
            {{ $t('settings.profile.crop.loading') }}
          </p>
        </div>

        <template v-else>
          <MediaCropStage
            v-model="crop"
            :src="loaded.url"
            :bounds="loaded.bounds"
            :shape="purpose === 'avatar' ? 'rounded' : 'rect'"
            :label="$t('settings.profile.crop.stageLabel')"
            :disabled="busy"
            class="h-64 sm:h-80"
            @dragover.prevent
            @drop.prevent="onDrop"
          />

          <div class="mt-3 flex items-center gap-3">
            <button
              type="button"
              class="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
              :aria-label="$t('settings.profile.crop.zoomOut')"
              :disabled="busy || !canZoom"
              @click="nudgeZoom(-1)"
            >
              <LucideIcon :icon="ZoomOut" class="size-4.5" />
            </button>
            <input
              v-model.number="slider"
              type="range"
              min="0"
              max="1"
              step="0.001"
              :disabled="busy || !canZoom"
              :aria-label="$t('settings.profile.crop.zoom')"
              class="h-1.5 min-w-0 flex-1 cursor-pointer accent-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            />
            <button
              type="button"
              class="grid size-8 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 disabled:hover:bg-transparent"
              :aria-label="$t('settings.profile.crop.zoomIn')"
              :disabled="busy || !canZoom"
              @click="nudgeZoom(1)"
            >
              <LucideIcon :icon="ZoomIn" class="size-4.5" />
            </button>
          </div>

          <ul class="mt-3 flex flex-wrap gap-2 text-xs">
            <li class="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 tabular-nums">
              {{ $t('settings.profile.crop.source', { size: `${loaded.bounds.imageWidth} × ${loaded.bounds.imageHeight}` }) }}
            </li>
            <li class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700 ring-1 ring-inset ring-sky-100">
              <LucideIcon :icon="Crop" class="size-3.5" />
              {{ $t('settings.profile.crop.ratio', { ratio: ratioLabel }) }}
            </li>
            <li v-if="output" class="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 tabular-nums">
              {{ $t('settings.profile.crop.output', { size: `${output.width} × ${output.height}` }) }}
            </li>
          </ul>
        </template>
      </div>

      <!-- Preview + upload status -->
      <div class="min-w-0 space-y-4">
        <div>
          <h3 class="mb-2 text-sm font-semibold text-slate-900">{{ $t('settings.profile.crop.previewHeading') }}</h3>
          <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div
              v-if="purpose === 'banner'"
              class="aspect-9/2 bg-slate-300"
              :style="loaded ? cropStyle : { backgroundImage: `url(${bannerUrl || appConfig.profile.defaultBanner})`, backgroundSize: 'cover', backgroundPosition: 'center' }"
            />
            <div
              v-else
              class="aspect-9/2 bg-slate-300 bg-cover bg-center"
              :style="{ backgroundImage: `url(${bannerUrl || appConfig.profile.defaultBanner})` }"
            />
            <div class="flex items-end gap-3 px-3 pb-3">
              <div
                v-if="purpose === 'avatar' && loaded"
                class="-mt-8 size-16 shrink-0 rounded-lg border-[3px] border-white bg-white shadow-sm"
                :style="cropStyle"
              />
              <img
                v-else-if="avatarUrl"
                :src="avatarUrl"
                alt=""
                class="-mt-8 size-16 shrink-0 rounded-lg border-[3px] border-white bg-white object-cover shadow-sm"
              />
              <AvatarPlaceholder
                v-else
                class="-mt-8 size-16 rounded-lg border-[3px] border-white shadow-sm"
              />
              <div class="min-w-0 pb-0.5">
                <p class="truncate text-sm font-bold text-slate-900">{{ psnid }}</p>
                <p v-if="country" class="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                  <RegionFlag :country="country" /> {{ regionName(country) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Lists, comments and the leaderboard show avatars round and small -->
          <div v-if="purpose === 'avatar' && loaded" class="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
            <span class="size-9 shrink-0 rounded-full bg-slate-100" :style="cropStyle" />
            <span class="size-6 shrink-0 rounded-full bg-slate-100" :style="cropStyle" />
            <span class="min-w-0 truncate text-xs text-slate-500">{{ $t('settings.profile.crop.previewLists') }}</span>
          </div>
        </div>

        <Transition
          enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
          enter-from-class="opacity-0 translate-y-1"
          leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
          leave-to-class="opacity-0"
        >
          <div v-if="status === 'working'" class="rounded-lg border border-slate-200 bg-slate-50 p-4" aria-live="polite">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium text-slate-700">
                {{ uploadBytes ? $t('settings.profile.crop.uploading') : $t('settings.profile.crop.preparing') }}
              </span>
              <span v-if="uploadBytes" class="tabular-nums text-slate-500">{{ percent }}%</span>
            </div>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full rounded-full bg-sky-600 transition-[width] duration-200 motion-reduce:transition-none"
                :style="{ width: `${uploadBytes ? Math.max(4, percent) : 4}%` }"
              />
            </div>
            <p v-if="uploadBytes" class="mt-2 text-xs text-slate-500">
              {{ $t('settings.profile.crop.uploadNote', { size: formatFileSize(uploadBytes) }) }}
            </p>
          </div>
          <div v-else-if="status === 'failed'" class="flex gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm" role="alert">
            <LucideIcon :icon="AlertTriangle" class="mt-0.5 size-4 shrink-0 text-rose-600" />
            <div class="min-w-0">
              <p class="font-semibold text-rose-700">{{ $t('settings.profile.crop.errors.uploadFailed') }}</p>
              <p v-if="uploadError" class="mt-0.5 text-rose-700/90">{{ uploadError }}</p>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          :disabled="busy"
          class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          @click="choose(purpose)"
        >
          <LucideIcon :icon="ImagePlus" class="size-4" />
          {{ $t('settings.profile.crop.chooseAnother') }}
        </button>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            @click="open = false"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="!loaded || busy"
            class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            @click="confirm"
          >
            <LucideIcon :icon="busy ? Loader2 : Check" class="size-4" :class="{ 'animate-spin': busy }" />
            {{ busy ? $t('settings.profile.crop.uploadingButton') : $t('settings.profile.crop.confirm') }}
          </button>
        </div>
      </div>
    </template>
  </Dialog>
</template>
