<script setup lang="ts">
import { AlertTriangle, Loader2 } from 'lucide'
import type { PublicScreenshotPageMeta, Screenshot } from '~/services/screenshots'

/**
 * All of a player's public screenshots, newest first, a page at a time
 * ("load more"). A thumbnail opens the viewer on everything loaded so far.
 * The first page loads when the dialog opens.
 */
const props = defineProps<{ psnid: string, total: number }>()
const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
const { raw } = useApi()
const errorText = useApiErrorText()

const items = ref<Screenshot[]>([])
const page = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)
const hasMore = computed(() => page.value < totalPages.value)

async function load() {
  if (loading.value) return
  loading.value = true
  error.value = null
  try {
    const next = page.value + 1
    const response = await raw.get<Screenshot[], PublicScreenshotPageMeta>(`/profile/${encodeURIComponent(props.psnid)}/screenshots`, { query: { page: next } })
    const seen = new Set(items.value.map(item => item.id))
    items.value = [...items.value, ...(response.data ?? []).filter(item => !seen.has(item.id))]
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
  if (value && !page.value) load()
})

const viewerOpen = ref(false)
const viewerIndex = ref(0)
function view(index: number) {
  viewerIndex.value = index
  viewerOpen.value = true
}
</script>

<template>
  <Dialog v-model:open="open" size="4xl" :title="$t('profile.showcase.screenshots.dialogTitle', { psnid, count: fmt(total) })">
    <div class="p-4 sm:p-5">
      <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        <li v-for="(shot, index) in items" :key="shot.id">
          <button
            type="button"
            class="group relative block aspect-video w-full overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-900/5"
            :style="{ backgroundColor: shot.image.color ?? undefined }"
            :aria-label="shot.caption || shot.game?.name || $t('profile.showcase.screenshots.view')"
            @click="view(index)"
          >
            <img
              :src="shot.image.url"
              :srcset="shot.image.srcset ?? undefined"
              sizes="(min-width: 640px) 280px, 50vw"
              alt=""
              loading="lazy"
              class="size-full object-cover transition duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
            >
          </button>
        </li>
      </ul>

      <p v-if="error" class="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
        <LucideIcon :icon="AlertTriangle" class="size-4 shrink-0" />{{ error }}
      </p>
      <div v-if="loading && !items.length" class="grid place-items-center py-16">
        <LucideIcon :icon="Loader2" class="size-5 animate-spin text-slate-400" />
      </div>
      <div v-else-if="hasMore || error" class="mt-4 flex justify-center">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          :disabled="loading"
          @click="load"
        >
          <LucideIcon v-if="loading" :icon="Loader2" class="size-3.5 animate-spin" />
          {{ error ? $t('common.retry') : $t('profile.showcase.screenshots.loadMore') }}
        </button>
      </div>
    </div>

    <ScreenshotLightbox v-model:open="viewerOpen" v-model:index="viewerIndex" :items="items" />
  </Dialog>
</template>
