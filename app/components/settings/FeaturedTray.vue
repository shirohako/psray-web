<script setup lang="ts">
import { Plus, Trophy, X } from 'lucide'
import type { PickedTrophy } from '~/utils/profileShowcase'

/**
 * The featured trophies as a row of tiles: drag a tile (long press on touch)
 * or use the arrow keys on it to reorder, × to take it out. With `addable`, a
 * "+" tile opens the picker and empty slots show how many are left.
 */
const props = withDefaults(defineProps<{
  modelValue: PickedTrophy[]
  addable?: boolean
  /** Tile size: `md` on the settings page, `sm` in the picker's footer. */
  size?: 'sm' | 'md'
  disabled?: boolean
}>(), { addable: false, size: 'md', disabled: false })
const emit = defineEmits<{ 'update:modelValue': [picks: PickedTrophy[]], add: [] }>()
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

const tile = computed(() => (props.size === 'sm' ? 'size-10' : 'size-13'))
// Empty slots after the "+" tile, so the tray shows its capacity.
const emptySlots = computed(() => (props.addable ? Math.max(0, FEATURED_LIMIT - props.modelValue.length - 1) : 0))
</script>

<template>
  <div ref="list" @click.capture="onClickCapture">
    <TransitionGroup
      tag="ul"
      move-class="transition-transform duration-200 ease-out motion-reduce:transition-none"
      class="flex flex-wrap"
      :class="size === 'sm' ? 'gap-2' : 'gap-2.5'"
    >
      <li
        v-for="(pick, index) in modelValue"
        :key="pick.trophy_id"
        :data-sort-index="index"
        class="relative"
      >
        <div
          role="button"
          tabindex="0"
          :aria-label="t('settings.showcase.tray.moveTrophy', { name: pick.name })"
          :title="`${pick.name}\n${pick.set_name}`"
          class="relative block cursor-grab rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40 focus-visible:ring-offset-2 active:cursor-grabbing"
          :class="[tile, dragging === index ? 'z-10 scale-110 shadow-lg shadow-slate-900/25' : '', disabled ? 'pointer-events-none opacity-60' : '']"
          @pointerdown="onPointerDown($event, index)"
          @keydown="onKeydown($event, index, modelValue.length)"
          @dragstart.prevent
        >
          <img :src="pick.icon_url" :alt="pick.name" class="size-full rounded-lg object-cover shadow-sm" draggable="false" />
          <TrophyRareFrame v-if="isRareTrophy(pick)" />
          <span
            v-if="size === 'md'"
            class="absolute -bottom-1 -left-1 grid size-4.5 place-items-center rounded-full border-2 border-white bg-white shadow-sm"
            :class="trophyTierColor(pick.type)"
          >
            <LucideIcon :icon="Trophy" class="size-2.5" />
          </span>
        </div>
        <button
          type="button"
          class="absolute -right-1.5 -top-1.5 z-10 grid size-5 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          :aria-label="t('settings.showcase.tray.remove', { name: pick.name })"
          :disabled="disabled"
          @pointerdown.stop
          @click="remove(index)"
        >
          <LucideIcon :icon="X" class="size-3" />
        </button>
      </li>

      <li v-if="addable && modelValue.length < FEATURED_LIMIT" key="add">
        <button
          type="button"
          class="grid place-items-center rounded-lg border-[1.5px] border-dashed border-slate-300 bg-white text-slate-400 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          :class="tile"
          :aria-label="t('settings.showcase.tray.add')"
          :title="t('settings.showcase.tray.add')"
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
        :class="tile"
      />
    </TransitionGroup>
  </div>
</template>
