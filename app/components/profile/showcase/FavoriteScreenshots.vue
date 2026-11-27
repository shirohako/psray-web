<script setup lang="ts">
import { GalleryHorizontal, Gamepad2, Maximize2 } from 'lucide'
import type { Screenshot } from '~/services/screenshots'

/**
 * Showcase: up to six public screenshots the owner picked. One is shown
 * large with its caption and game; the strip below switches it, and the
 * large picture opens the full-screen viewer.
 */
const props = defineProps<{ screenshots: Screenshot[] }>()

const active = ref(0)
const current = computed(() => props.screenshots[Math.min(active.value, props.screenshots.length - 1)])
watch(() => props.screenshots.length, () => { active.value = 0 })

const viewerOpen = ref(false)
const viewerIndex = ref(0)
function openViewer() {
  viewerIndex.value = active.value
  viewerOpen.value = true
}
// Stepping in the viewer moves the large picture along with it.
watch(viewerIndex, (index) => { active.value = index })
</script>

<template>
  <section v-if="current" class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <header class="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <h2 class="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
        <LucideIcon :icon="GalleryHorizontal" class="size-4 shrink-0 text-slate-500" />
        {{ $t('profile.showcase.favoriteScreenshots.title') }}
      </h2>
    </header>

    <div class="space-y-3 p-3 sm:p-4">
      <button
        type="button"
        class="group relative block aspect-video w-full overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-900/5"
        :style="{ backgroundColor: current.image.color ?? undefined }"
        :aria-label="$t('profile.showcase.screenshots.view')"
        @click="openViewer"
      >
        <Transition
          enter-active-class="transition-opacity duration-300 ease-out motion-reduce:transition-none"
          enter-from-class="opacity-0"
          leave-active-class="transition-opacity duration-300 ease-in motion-reduce:transition-none"
          leave-to-class="opacity-0"
        >
          <img
            :key="current.id"
            :src="current.image.url"
            :srcset="current.image.srcset ?? undefined"
            sizes="(min-width: 1024px) 700px, 100vw"
            :alt="current.caption || current.game?.name || ''"
            class="absolute inset-0 size-full object-cover"
          >
        </Transition>
        <span class="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-slate-900/55 text-white opacity-0 transition group-hover:opacity-100 motion-reduce:transition-none">
          <LucideIcon :icon="Maximize2" class="size-4" />
        </span>
      </button>

      <!-- Caption and game of the large picture -->
      <div class="flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1.5">
        <p v-if="current.caption" class="min-w-0 text-[13px] font-semibold text-slate-900">{{ current.caption }}</p>
        <span
          v-if="current.game"
          class="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2.5 text-[11px] font-medium text-slate-600"
        >
          <img :src="current.game.icon_url" alt="" class="size-4.5 shrink-0 rounded-full object-cover">
          <span class="truncate" :lang="contentLang(current.game.display_language, current.game.name)">{{ current.game.name }}</span>
        </span>
        <span v-else-if="!current.caption" class="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
          <LucideIcon :icon="Gamepad2" class="size-3.5" />{{ $t('screenshots.noGame') }}
        </span>
        <span v-if="screenshots.length > 1" class="ml-auto text-[11px] font-semibold tabular-nums text-slate-400">
          {{ active + 1 }} / {{ screenshots.length }}
        </span>
      </div>

      <!-- Strip -->
      <ul v-if="screenshots.length > 1" class="grid grid-cols-6 gap-2">
        <li v-for="(shot, index) in screenshots" :key="shot.id">
          <button
            type="button"
            class="block aspect-video w-full overflow-hidden rounded-md bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
            :class="index === active ? 'ring-2 ring-slate-900 ring-offset-1' : 'opacity-70 hover:opacity-100'"
            :style="{ backgroundColor: shot.image.color ?? undefined }"
            :aria-label="shot.caption || shot.game?.name || $t('profile.showcase.screenshots.view')"
            :aria-pressed="index === active"
            @click="active = index"
          >
            <img
              :src="shot.image.url"
              :srcset="shot.image.srcset ?? undefined"
              sizes="120px"
              alt=""
              loading="lazy"
              class="size-full object-cover"
            >
          </button>
        </li>
      </ul>
    </div>

    <ScreenshotLightbox v-model:open="viewerOpen" v-model:index="viewerIndex" :items="screenshots" />
  </section>
</template>
