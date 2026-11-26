<script setup lang="ts">
import { FolderOpen, ImageDown, RotateCcw, Rows3 } from 'lucide'
import { tierLabelTextColor } from '~/utils/tierList'

/**
 * The tier list maker: the board on the left, where to find things to rank on
 * the right (below the board on narrow screens). Client only; the page shows
 * `TierlistSkeleton` until it mounts.
 */
const editor = provideTierEditor()

const listsOpen = ref(false)
const exportOpen = ref(false)
const resetOpen = ref(false)

function confirmReset() {
  editor.reset()
  resetOpen.value = false
}

const button = 'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-sm shadow-slate-900/5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50'
const secondary = `${button} border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900`
const primary = `${button} border-slate-900 bg-slate-900 text-white hover:border-slate-700 hover:bg-slate-700`

const drag = computed(() => editor.drag.state)
const ghostStyle = computed(() => ({
  width: `${drag.value.width}px`,
  height: `${drag.value.height}px`,
  transform: `translate3d(${drag.value.x - drag.value.offsetX}px, ${drag.value.y - drag.value.offsetY}px, 0)`,
}))
</script>

<template>
  <div class="space-y-5">
    <PageHeader :icon="Rows3" :title="$t('tierlist.title')" :description="$t('tierlist.description')">
      <!-- One row from sm up: the buttons keep their width and the description wraps instead -->
      <div class="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap sm:pt-1">
        <button type="button" :class="secondary" @click="listsOpen = true">
          <LucideIcon :icon="FolderOpen" class="size-3.5 text-slate-500" />{{ $t('tierlist.actions.lists') }}
        </button>
        <button type="button" :class="secondary" :disabled="!editor.list" @click="resetOpen = true">
          <LucideIcon :icon="RotateCcw" class="size-3.5 text-slate-500" />{{ $t('tierlist.actions.reset') }}
        </button>
        <button type="button" :class="primary" :disabled="!editor.list" @click="exportOpen = true">
          <LucideIcon :icon="ImageDown" class="size-3.5" />{{ $t('tierlist.actions.export') }}
        </button>
      </div>
    </PageHeader>

    <div v-if="editor.list" class="flex flex-col gap-4 lg:flex-row lg:items-start">
      <TierlistBoard class="min-w-0 flex-1" />
      <TierlistSourcePanel class="lg:sticky lg:top-20 lg:w-80 lg:shrink-0" />
    </div>
    <TierlistSkeleton v-else board-only />

    <TierlistListsDialog v-model:open="listsOpen" />
    <TierlistExportDialog v-if="editor.list" v-model:open="exportOpen" />
    <ConfirmDialog
      v-model:open="resetOpen"
      :title="$t('tierlist.reset.title')"
      :icon="RotateCcw"
      :confirm-label="$t('tierlist.reset.confirm')"
      @confirm="confirmReset"
    >
      <p class="p-4 text-sm leading-6 text-slate-600 sm:p-5">{{ $t('tierlist.reset.body') }}</p>
    </ConfirmDialog>

    <!-- What follows the pointer while dragging -->
    <Teleport to="body">
      <div
        v-if="drag.active && drag.preview"
        class="pointer-events-none fixed left-0 top-0 z-[60] will-change-transform"
        :style="ghostStyle"
        aria-hidden="true"
      >
        <div
          v-if="drag.preview.label !== undefined"
          class="flex size-full items-center rounded-md px-4 text-lg font-bold shadow-xl ring-1 ring-black/10"
          :style="{ backgroundColor: drag.preview.color ?? '#cbd5e1', color: tierLabelTextColor(drag.preview.color ?? '#cbd5e1') }"
        >
          {{ drag.preview.label }}
        </div>
        <div
          v-else
          class="size-full -rotate-3 overflow-hidden rounded bg-slate-200 shadow-xl ring-2 ring-white"
          :style="{ backgroundColor: drag.preview.color ?? undefined }"
        >
          <img v-if="drag.preview.src" :src="drag.preview.src" alt="" class="size-full object-cover">
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
/* While a tile or row is dragged: one cursor everywhere, no text selection. */
.tier-dragging,
.tier-dragging * {
  cursor: grabbing !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}
</style>
