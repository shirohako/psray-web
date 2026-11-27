<script setup lang="ts">
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Gamepad2, X } from 'lucide'
import type { Screenshot } from '~/services/screenshots'

/**
 * Full-screen viewer for a set of screenshots: the picture as large as the
 * window allows, its caption, game and date below, and arrows (or ←/→, or a
 * swipe) to step through the set. Drive it with `v-model:open` and
 * `v-model:index`. The `#actions` slot adds owner buttons to the top bar.
 */
const props = defineProps<{ items: Screenshot[] }>()
const open = defineModel<boolean>('open', { required: true })
const index = defineModel<number>('index', { default: 0 })
defineSlots<{ actions?(props: { item: Screenshot }): unknown }>()

const current = computed(() => props.items[Math.min(Math.max(index.value, 0), props.items.length - 1)])
const many = computed(() => props.items.length > 1)

/**
 * The picture's box at its own aspect ratio, as large as the area allows
 * (never past its real size). The area is a size container, so this is plain
 * CSS and holds before the image has loaded. Shrinking width and height
 * separately would leave a box wider or taller than the picture.
 */
const pictureStyle = computed(() => {
  const { width, height, color } = current.value?.image ?? {}
  const backgroundColor = color ?? undefined
  if (!width || !height) return { backgroundColor, maxWidth: '100%', maxHeight: '100%' }
  return {
    backgroundColor,
    width: `min(100cqw, ${width / height} * 100cqh, ${width}px)`,
    height: 'auto',
    aspectRatio: `${width} / ${height}`,
  }
})

function step(delta: number) {
  if (!many.value) return
  index.value = (index.value + delta + props.items.length) % props.items.length
}

// Listens in the capture phase and stops the event, so Esc inside a dialog
// (the "all screenshots" one) closes only the viewer.
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
  else if (event.key === 'ArrowLeft') step(-1)
  else if (event.key === 'ArrowRight') step(1)
  else return
  event.stopImmediatePropagation()
}

// A horizontal swipe on touch screens steps too.
let swipeX: number | null = null
function onPointerDown(event: PointerEvent) {
  swipeX = event.pointerType === 'mouse' ? null : event.clientX
}
function onPointerUp(event: PointerEvent) {
  if (swipeX === null) return
  const dx = event.clientX - swipeX
  swipeX = null
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
}

// Restore the scroll lock as it was: a dialog underneath keeps its own.
let previousOverflow = ''
watch(open, (value) => {
  if (!import.meta.client) return
  if (value) {
    previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey, true)
  }
  else {
    document.documentElement.style.overflow = previousOverflow
    window.removeEventListener('keydown', onKey, true)
  }
}, { immediate: true })
// The set can shrink while open (a screenshot deleted): stay in range, close when empty.
watch(() => props.items.length, (length) => {
  if (!length) open.value = false
  else if (index.value >= length) index.value = length - 1
})
onBeforeUnmount(() => {
  if (!import.meta.client || !open.value) return
  document.documentElement.style.overflow = previousOverflow
  window.removeEventListener('keydown', onKey, true)
})
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150 ease-in motion-reduce:transition-none"
        leave-to-class="opacity-0"
      >
        <div
          v-if="open && current"
          class="fixed inset-0 z-[60] flex flex-col bg-slate-950/95"
          role="dialog"
          aria-modal="true"
          :aria-label="current.caption || $t('screenshots.lightbox.label')"
        >
          <!-- Top bar -->
          <div class="flex items-center justify-between gap-3 px-4 py-3 text-slate-300">
            <span class="text-xs font-semibold tabular-nums">
              <template v-if="many">{{ $t('screenshots.lightbox.position', { n: index + 1, total: items.length }) }}</template>
            </span>
            <div class="flex items-center gap-1">
              <slot name="actions" :item="current" />
              <a
                :href="current.image.url"
                target="_blank"
                rel="noopener"
                class="grid size-9 place-items-center rounded-lg transition hover:bg-white/10 hover:text-white"
                :aria-label="$t('screenshots.lightbox.original')"
                :title="$t('screenshots.lightbox.original')"
              >
                <LucideIcon :icon="ExternalLink" class="size-4.5" />
              </a>
              <button
                type="button"
                class="grid size-9 place-items-center rounded-lg transition hover:bg-white/10 hover:text-white"
                :aria-label="$t('common.close')"
                @click="open = false"
              >
                <LucideIcon :icon="X" class="size-5" />
              </button>
            </div>
          </div>

          <!-- Picture -->
          <div
            class="relative flex min-h-0 flex-1 items-center justify-center px-2 [container-type:size] sm:px-16"
            @click.self="open = false"
            @pointerdown="onPointerDown"
            @pointerup="onPointerUp"
          >
            <Transition
              mode="out-in"
              enter-active-class="transition-opacity duration-150 ease-out motion-reduce:transition-none"
              enter-from-class="opacity-0"
              leave-active-class="transition-opacity duration-100 ease-in motion-reduce:transition-none"
              leave-to-class="opacity-0"
            >
              <img
                :key="current.id"
                :src="current.image.url"
                :srcset="current.image.srcset ?? undefined"
                sizes="100vw"
                :width="current.image.width ?? undefined"
                :height="current.image.height ?? undefined"
                :alt="current.caption || current.game?.name || ''"
                class="shrink-0 select-none rounded-md object-contain shadow-2xl"
                :style="pictureStyle"
                draggable="false"
              >
            </Transition>

            <template v-if="many">
              <button
                type="button"
                class="absolute left-2 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/20 sm:grid"
                :aria-label="$t('screenshots.lightbox.previous')"
                @click="step(-1)"
              >
                <LucideIcon :icon="ChevronLeft" class="size-5" />
              </button>
              <button
                type="button"
                class="absolute right-2 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/15 transition hover:bg-white/20 sm:grid"
                :aria-label="$t('screenshots.lightbox.next')"
                @click="step(1)"
              >
                <LucideIcon :icon="ChevronRight" class="size-5" />
              </button>
            </template>
          </div>

          <!-- Caption, game and date -->
          <div class="flex min-h-16 flex-col items-center justify-center gap-2 px-4 py-3 text-center">
            <p v-if="current.caption" class="max-w-3xl text-sm font-semibold text-white">{{ current.caption }}</p>
            <div class="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-300">
              <AppLink
                v-if="current.game"
                :to="`/trophies/${current.game.id}`"
                class="inline-flex max-w-72 items-center gap-1.5 rounded-full bg-white/10 py-1 pl-1 pr-2.5 ring-1 ring-inset ring-white/10 transition hover:bg-white/15 hover:text-white"
              >
                <img :src="current.game.icon_url" alt="" class="size-4.5 shrink-0 rounded-full object-cover">
                <span class="truncate" :lang="contentLang(current.game.display_language, current.game.name)">{{ current.game.name }}</span>
              </AppLink>
              <span v-else class="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 ring-1 ring-inset ring-white/10">
                <LucideIcon :icon="Gamepad2" class="size-3.5" />{{ $t('screenshots.noGame') }}
              </span>
              <span class="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 ring-1 ring-inset ring-white/10">
                <LucideIcon :icon="CalendarDays" class="size-3.5" />
                <LocalTime :value="current.created_at" format="day" />
              </span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
