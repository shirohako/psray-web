<script setup lang="ts" generic="T">
import { Plus, X } from 'lucide'

/**
 * A row of picked items as tiles: drag a tile (long press on touch) or use the
 * arrow keys on it to reorder, × to take it out. With `addable`, a "+" tile
 * asks for more (`add`) and empty slots show how many are left. What a tile
 * shows comes from the `tile` slot; the tray only sizes it (`tileClass`).
 */
const props = withDefaults(defineProps<{
  modelValue: T[]
  /** Stable key per item. */
  itemKey: (item: T) => string | number
  /** Name read out for the tile and its remove button. */
  itemLabel: (item: T) => string
  limit: number
  tileClass: string
  /** With `addable`: the "+" tile's label, e.g. "Add trophies". */
  addLabel?: string
  addable?: boolean
  disabled?: boolean
}>(), { addable: false, disabled: false })
const emit = defineEmits<{ 'update:modelValue': [items: T[]], add: [] }>()
defineSlots<{ tile(props: { item: T }): unknown }>()
const { t } = useI18n()

const list = ref<HTMLElement | null>(null)
const { dragging, onPointerDown, onKeydown, onClickCapture } = useSortDrag({
  container: list,
  axis: 'grid',
  move: (from, to) => emit('update:modelValue', moveIndex(props.modelValue, from, to)),
})

function remove(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

// Empty slots after the "+" tile, so the tray shows its capacity.
const emptySlots = computed(() => (props.addable ? Math.max(0, props.limit - props.modelValue.length - 1) : 0))
</script>

<template>
  <div ref="list" @click.capture="onClickCapture">
    <TransitionGroup
      tag="ul"
      move-class="transition-transform duration-200 ease-out motion-reduce:transition-none"
      class="flex flex-wrap gap-2.5"
    >
      <li
        v-for="(item, index) in modelValue"
        :key="itemKey(item)"
        :data-sort-index="index"
        class="relative"
      >
        <div
          role="button"
          tabindex="0"
          :aria-label="t('settings.showcase.tray.move', { name: itemLabel(item) })"
          :title="itemLabel(item)"
          class="relative block cursor-grab rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 focus-visible:ring-offset-2 active:cursor-grabbing"
          :class="[tileClass, dragging === index ? 'z-10 scale-110 shadow-lg shadow-slate-900/25' : '', disabled ? 'pointer-events-none opacity-60' : '']"
          @pointerdown="onPointerDown($event, index)"
          @keydown="onKeydown($event, index, modelValue.length)"
          @dragstart.prevent
        >
          <slot name="tile" :item="item" />
        </div>
        <button
          type="button"
          class="absolute -right-1.5 -top-1.5 z-10 grid size-5 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          :aria-label="t('settings.showcase.tray.remove', { name: itemLabel(item) })"
          :disabled="disabled"
          @pointerdown.stop
          @click="remove(index)"
        >
          <LucideIcon :icon="X" class="size-3" />
        </button>
      </li>

      <li v-if="addable && modelValue.length < limit" key="add">
        <button
          type="button"
          class="grid place-items-center rounded-lg border-[1.5px] border-dashed border-slate-300 bg-white text-slate-400 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          :class="tileClass"
          :aria-label="addLabel"
          :title="addLabel"
          :disabled="disabled"
          @click="emit('add')"
        >
          <LucideIcon :icon="Plus" class="size-5" />
        </button>
      </li>
      <li
        v-for="slot in emptySlots"
        :key="`empty-${slot}`"
        aria-hidden="true"
        class="rounded-lg border-[1.5px] border-dashed border-slate-200"
        :class="tileClass"
      />
    </TransitionGroup>
  </div>
</template>
