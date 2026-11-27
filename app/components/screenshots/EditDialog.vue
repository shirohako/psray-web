<script setup lang="ts">
import { Gamepad2, Globe, Info, Loader2, X } from 'lucide'
import type { ShowcaseGame } from '~/services/profile'
import { useScreenshotApi, type OwnScreenshot } from '~/services/screenshots'
import { ApiError } from '~/utils/ApiError'

/**
 * Edits a screenshot's caption, linked game and visibility. The watermarks
 * are part of the picture, so they are shown but can't be changed here.
 */
const props = defineProps<{ screenshot: OwnScreenshot | null, psnid: string }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ saved: [screenshot: OwnScreenshot] }>()
const { t } = useI18n()
const toast = useToast()
const errorText = useApiErrorText()
const api = useScreenshotApi()

const caption = ref('')
const game = ref<ShowcaseGame | null>(null)
const isPublic = ref(false)
const saving = ref(false)
const gamePickerOpen = ref(false)

watch(open, (value) => {
  if (!value || !props.screenshot) return
  caption.value = props.screenshot.caption ?? ''
  game.value = props.screenshot.game
  isPublic.value = props.screenshot.is_public
}, { immediate: true })

const captionLength = computed(() => textLength(caption.value))
const tooLong = computed(() => captionLength.value > SCREENSHOT_CAPTION_MAX)

async function save() {
  const shot = props.screenshot
  if (!shot || saving.value || tooLong.value) return
  saving.value = true
  try {
    const updated = await api.update(shot.id, {
      caption: caption.value.trim() || null,
      trophy_set_id: game.value?.id ?? null,
      is_public: isPublic.value,
    })
    emit('saved', updated)
    open.value = false
    toast.success({ title: t('screenshots.edit.saved') })
  }
  catch (error) {
    const field = error instanceof ApiError && error.isValidation ? Object.values(error.fieldErrors())[0] : undefined
    toast.error({ title: t('screenshots.edit.saveFailed'), description: field ?? errorText(error) })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open" size="lg" :title="$t('screenshots.edit.title')">
    <div v-if="screenshot" class="space-y-4 p-5">
      <img
        :src="screenshot.image.url"
        :srcset="screenshot.image.srcset ?? undefined"
        sizes="480px"
        alt=""
        class="aspect-video w-full rounded-lg object-cover ring-1 ring-slate-200"
        :style="{ backgroundColor: screenshot.image.color ?? undefined }"
      >

      <label class="block">
        <span class="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-600">
          {{ $t('screenshots.edit.caption') }}
          <span class="font-medium tabular-nums" :class="tooLong ? 'text-rose-600' : 'text-slate-400'">{{ captionLength }} / {{ SCREENSHOT_CAPTION_MAX }}</span>
        </span>
        <input
          v-model="caption"
          type="text"
          :placeholder="$t('screenshots.edit.captionPlaceholder')"
          class="h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2"
          :class="tooLong ? 'border-rose-300 focus:ring-rose-100' : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'"
          @keydown.enter.prevent="save"
        >
      </label>

      <div>
        <p class="mb-1.5 text-xs font-bold text-slate-600">{{ $t('screenshots.edit.game') }}</p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm transition hover:border-slate-300"
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
            class="grid size-10 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            :aria-label="$t('screenshots.upload.clearGame')"
            @click="game = null"
          >
            <LucideIcon :icon="X" class="size-4" />
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-inset ring-slate-100">
        <div class="flex items-start gap-2.5">
          <LucideIcon :icon="Globe" class="mt-0.5 size-4 shrink-0 text-slate-500" />
          <div>
            <p class="text-[13px] font-semibold text-slate-800">{{ $t('screenshots.upload.public') }}</p>
            <p class="mt-0.5 text-[11px] text-slate-400">{{ $t('screenshots.upload.publicHint') }}</p>
          </div>
        </div>
        <SettingsSwitch v-model="isPublic" :label="$t('screenshots.upload.public')" />
      </div>

      <p class="flex items-start gap-1.5 text-[11px] leading-4 text-slate-400">
        <LucideIcon :icon="Info" class="mt-px size-3.5 shrink-0" />
        <span v-if="screenshot.watermarks.psn || screenshot.watermarks.profile">
          {{ $t('screenshots.watermarks.drawn', { list: formatList([
            ...(screenshot.watermarks.psn ? [$t('screenshots.watermarks.psn')] : []),
            ...(screenshot.watermarks.profile ? [$t('screenshots.watermarks.profile')] : []),
          ]) }) }}
          {{ $t('screenshots.edit.watermarkFixed') }}
        </span>
        <span v-else>{{ $t('screenshots.edit.noWatermark') }}</span>
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          :disabled="saving"
          @click="open = false"
        >
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          :disabled="saving || tooLong"
          @click="save"
        >
          <LucideIcon v-if="saving" :icon="Loader2" class="size-4 animate-spin" />
          {{ saving ? $t('common.saving') : $t('common.save') }}
        </button>
      </div>
    </template>

    <ScreenshotsGamePicker v-model:open="gamePickerOpen" :psnid="psnid" @select="game = $event" />
  </Dialog>
</template>
