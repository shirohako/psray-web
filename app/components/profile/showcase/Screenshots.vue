<script setup lang="ts">
import { ChevronRight, Images } from 'lucide'
import type { Screenshot } from '~/services/screenshots'

/**
 * Showcase: the owner's newest public screenshots, two to a row at 16:9.
 * A thumbnail opens the viewer on these; the count in the header opens all
 * of them when there are more than fit here.
 */
const props = defineProps<{ psnid: string, screenshots: Screenshot[], total: number }>()

const viewerOpen = ref(false)
const viewerIndex = ref(0)
const allOpen = ref(false)
function view(index: number) {
  viewerIndex.value = index
  viewerOpen.value = true
}
const more = computed(() => props.total > props.screenshots.length)
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <header class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <h2 class="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
        <LucideIcon :icon="Images" class="size-4 shrink-0 text-slate-500" />
        {{ $t('profile.showcase.screenshots.title') }}
      </h2>
      <button
        v-if="more"
        type="button"
        class="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-slate-100 py-0.5 pl-2 pr-1 text-[11px] font-semibold tabular-nums text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
        @click="allOpen = true"
      >
        {{ $t('profile.showcase.screenshots.all', { count: fmt(total) }) }}
        <LucideIcon :icon="ChevronRight" class="size-3.5" />
      </button>
      <span v-else class="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-slate-600">
        {{ $t('profile.showcase.screenshots.count', { count: fmt(total) }) }}
      </span>
    </header>

    <ul class="grid grid-cols-2 gap-2 p-3 sm:p-4">
      <li v-for="(shot, index) in screenshots" :key="shot.id">
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
            sizes="(min-width: 1024px) 160px, 50vw"
            alt=""
            loading="lazy"
            class="size-full object-cover transition duration-300 group-hover:scale-[1.04] motion-reduce:transition-none"
          >
        </button>
      </li>
    </ul>

    <ScreenshotLightbox v-model:open="viewerOpen" v-model:index="viewerIndex" :items="screenshots" />
    <ProfileScreenshotsDialog v-if="more" v-model:open="allOpen" :psnid="psnid" :total="total" />
  </section>
</template>
