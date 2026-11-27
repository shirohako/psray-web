<script setup lang="ts">
import { AlertTriangle, Check, Images, Loader2 } from 'lucide'
import type { OwnScreenshot, ScreenshotPageMeta } from '~/services/screenshots'
import type { PickedScreenshot } from '~/utils/profileShowcase'

/**
 * Picks the favorite screenshots: tick up to six of the owner's public
 * screenshots (newest first, a page at a time). The picks sit in the footer
 * tray, where they can be reordered or taken out. Nothing changes until
 * "Done"; the settings page saves it with the rest of the form.
 */
const props = defineProps<{ picks: PickedScreenshot[] }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ apply: [picks: PickedScreenshot[]] }>()
const { t } = useI18n()
const { raw } = useApi()
const errorText = useApiErrorText()

/** The picks being edited; copied from `picks` each time the dialog opens. */
const working = ref<PickedScreenshot[]>([])
const ids = computed(() => new Set(working.value.map(s => s.id)))
const full = computed(() => working.value.length >= FAVORITE_SCREENSHOTS_LIMIT)

function toggle(shot: OwnScreenshot) {
  if (ids.value.has(shot.id)) {
    working.value = working.value.filter(s => s.id !== shot.id)
  }
  else if (!full.value) {
    const { id, image, caption, game, created_at } = shot
    working.value = [...working.value, { id, image, caption, game, created_at }]
  }
}

// ── The owner's public screenshots ──────────────────────────────────────────

const items = ref<OwnScreenshot[]>([])
const page = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)
const hasMore = computed(() => page.value < totalPages.value)

async function load(reset = false) {
  if (loading.value) return
  if (reset) {
    items.value = []
    page.value = 0
    totalPages.value = 1
  }
  loading.value = true
  error.value = null
  try {
    const next = page.value + 1
    const response = await raw.get<OwnScreenshot[], ScreenshotPageMeta>('/user/screenshots', { query: { visibility: 'public', page: next } })
    items.value = [...items.value, ...(response.data ?? [])]
    page.value = next
    totalPages.value = response.meta?.total_pages ?? next
  }
  catch (err) {
    error.value = errorText(err) ?? t('errors.title')
  }
  finally {
    loading.value = false
  }
}

watch(open, (value) => {
  if (!value) return
  working.value = [...props.picks]
  load(true)
}, { immediate: true })

function done() {
  emit('apply', working.value)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open" size="3xl" :title="t('settings.showcase.screenshotsPicker.title')">
    <div class="px-5 py-4">
      <p v-if="error" class="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
        <LucideIcon :icon="AlertTriangle" class="size-4 shrink-0" />{{ error }}
      </p>

      <div v-else-if="!loading && !items.length" class="py-12 text-center">
        <span class="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400"><LucideIcon :icon="Images" class="size-5" /></span>
        <p class="mt-3 text-sm text-slate-500">{{ t('settings.showcase.screenshotsPicker.empty') }}</p>
        <AppLink to="/me/screenshots" class="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700">
          {{ t('settings.showcase.screenshotsPicker.manage') }}
        </AppLink>
      </div>

      <ul class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <li v-for="shot in items" :key="shot.id">
          <button
            type="button"
            class="group relative block aspect-video w-full overflow-hidden rounded-md bg-slate-100 ring-1 transition disabled:cursor-not-allowed disabled:opacity-40"
            :class="ids.has(shot.id) ? 'ring-2 ring-slate-900' : 'ring-slate-900/5 hover:ring-slate-300'"
            :style="{ backgroundColor: shot.image.color ?? undefined }"
            :aria-pressed="ids.has(shot.id)"
            :aria-label="shot.caption || shot.game?.name || t('profile.showcase.screenshots.view')"
            :disabled="full && !ids.has(shot.id)"
            @click="toggle(shot)"
          >
            <img
              :src="shot.image.url"
              :srcset="shot.image.srcset ?? undefined"
              sizes="240px"
              alt=""
              loading="lazy"
              class="size-full object-cover"
            >
            <span
              class="absolute right-1.5 top-1.5 grid size-5.5 place-items-center rounded-md shadow-sm transition"
              :class="ids.has(shot.id) ? 'bg-slate-900 text-white' : 'border-[1.5px] border-white/90 bg-slate-900/20'"
            >
              <LucideIcon v-if="ids.has(shot.id)" :icon="Check" class="size-3.5" stroke-width="3" />
            </span>
          </button>
        </li>
      </ul>

      <div v-if="loading" class="grid place-items-center py-8">
        <LucideIcon :icon="Loader2" class="size-5 animate-spin text-slate-400" />
      </div>
      <div v-else-if="hasMore && items.length" class="mt-4 flex justify-center">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          @click="load()"
        >
          {{ t('settings.showcase.picker.loadMore') }}
        </button>
      </div>
    </div>

    <template #footer>
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-3 text-xs">
          <span class="font-semibold tabular-nums text-slate-600">
            {{ t('settings.showcase.picker.picked', { count: working.length, max: FAVORITE_SCREENSHOTS_LIMIT }) }}
          </span>
          <span v-if="full" class="text-amber-600">{{ t('settings.showcase.picker.limit', { max: FAVORITE_SCREENSHOTS_LIMIT }) }}</span>
          <span v-else-if="working.length > 1" class="text-slate-400">{{ t('settings.showcase.tray.hint') }}</span>
        </div>
        <SettingsSortTray
          v-model="working"
          :item-key="shot => shot.id"
          :item-label="shot => shot.caption || shot.game?.name || String(shot.id)"
          :limit="FAVORITE_SCREENSHOTS_LIMIT"
          tile-class="h-9 w-16"
        >
          <template #tile="{ item }">
            <img :src="item.image.url" :srcset="item.image.srcset ?? undefined" sizes="64px" alt="" class="size-full rounded object-cover">
          </template>
        </SettingsSortTray>
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            @click="open = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            @click="done"
          >
            {{ t('settings.showcase.picker.done') }}
          </button>
        </div>
      </div>
    </template>
  </Dialog>
</template>
