<script setup lang="ts">
import { GripVertical, Settings2 } from 'lucide'
import { tierLabelTextColor, type TierRow } from '~/utils/tierList'

/**
 * One tier: its coloured label (click to edit), its tiles, and a handle to
 * drag the whole row up or down.
 */
const props = defineProps<{
  row: TierRow
  index: number
  /** Draw the line that marks where a dragged row will land, above this one. */
  dropLine?: boolean
}>()

const editor = useTierEditor()
const textColor = computed(() => tierLabelTextColor(props.row.color))
const dragged = computed(() => editor.drag.draggedRowId === props.row.id)
const label = computed(() => props.row.label.trim())
const labelClass = computed(() => {
  const length = Array.from(label.value).length
  if (length <= 2) return 'text-2xl sm:text-3xl'
  if (length <= 4) return 'text-base sm:text-lg'
  return 'text-[11px] leading-tight sm:text-xs'
})

const root = ref<HTMLElement | null>(null)

function startRowDrag(event: PointerEvent) {
  if (!root.value) return
  editor.drag.start(event, { kind: 'row', rowId: props.row.id }, root.value, { src: null, color: props.row.color, label: label.value }, true)
}
</script>

<template>
  <div
    ref="root"
    :data-tier-row="row.id"
    :data-tier-zone="row.id"
    class="relative flex border-t border-slate-200 transition-opacity first:border-t-0"
    :class="dragged ? 'opacity-40' : ''"
  >
    <div v-if="dropLine" class="absolute inset-x-0 -top-px z-10 h-0.5 bg-slate-900" />

    <DropdownMenu class="flex w-16 shrink-0 sm:w-22" panel-class="w-72">
      <button
        type="button"
        class="flex size-full min-h-19 cursor-pointer items-center justify-center px-1.5 py-1 text-center font-bold break-words transition-[filter] hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900 sm:min-h-23"
        :style="{ backgroundColor: row.color, color: textColor }"
        :aria-label="$t('tierlist.row.settings', { name: label || $t('tierlist.untitledRow') })"
      >
        <span class="max-w-full" :class="labelClass">{{ label }}</span>
      </button>
      <template #menu="{ close }">
        <TierlistRowSettings :row="row" :index="index" @close="close" />
      </template>
    </DropdownMenu>

    <TierlistZone :zone="row.id" :ids="row.items" class="min-w-0 flex-1" />

    <div class="flex w-8 shrink-0 flex-col items-center justify-center gap-0.5 border-l border-slate-100">
      <DropdownMenu align="right" panel-class="w-72">
        <button
          type="button"
          class="grid size-7 cursor-pointer place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          :aria-label="$t('tierlist.row.settings', { name: label || $t('tierlist.untitledRow') })"
          :title="$t('tierlist.row.settingsShort')"
        >
          <LucideIcon :icon="Settings2" class="size-4" />
        </button>
        <template #menu="{ close }">
          <TierlistRowSettings :row="row" :index="index" @close="close" />
        </template>
      </DropdownMenu>
      <button
        type="button"
        class="grid size-7 cursor-grab touch-none place-items-center rounded-md text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        :aria-label="$t('tierlist.row.drag')"
        :title="$t('tierlist.row.drag')"
        tabindex="-1"
        @pointerdown="startRowDrag"
      >
        <LucideIcon :icon="GripVertical" class="size-4" />
      </button>
    </div>
  </div>
</template>
