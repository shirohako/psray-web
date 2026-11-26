<script setup lang="ts">
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, Eraser, Pipette, Trash2, type IconNode } from 'lucide'
import { TIER_COLORS, TIER_LIMITS, type TierRow } from '~/utils/tierList'

/** Edits one row: its name and colour, its place, rows around it. Shown in a dropdown. */
const props = defineProps<{
  row: TierRow
  index: number
}>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const editor = useTierEditor()
const rowCount = computed(() => editor.list?.rows.length ?? 0)
const nameInput = ref<HTMLInputElement | null>(null)

// Ready to type on desktop; on phones a keyboard popping up uninvited is a nuisance.
onMounted(() => {
  if (window.matchMedia('(pointer: fine)').matches) nameInput.value?.select()
})

function setColor(color: string) {
  editor.updateRow(props.row.id, { color })
}

function run(action: () => unknown) {
  action()
  emit('close')
}

const actions = computed<{ icon: IconNode, label: string, disabled: boolean, danger?: boolean, run: () => unknown }[]>(() => [
  { icon: ArrowUp, label: t('tierlist.row.moveUp'), disabled: props.index === 0, run: () => editor.moveRow(props.row.id, props.index - 1) },
  { icon: ArrowDown, label: t('tierlist.row.moveDown'), disabled: props.index >= rowCount.value - 1, run: () => editor.moveRow(props.row.id, props.index + 1) },
  { icon: ArrowUpToLine, label: t('tierlist.row.insertAbove'), disabled: rowCount.value >= TIER_LIMITS.rows, run: () => editor.insertRow(props.index) },
  { icon: ArrowDownToLine, label: t('tierlist.row.insertBelow'), disabled: rowCount.value >= TIER_LIMITS.rows, run: () => editor.insertRow(props.index + 1) },
  { icon: Eraser, label: t('tierlist.row.clear'), disabled: !props.row.items.length, run: () => editor.clearRow(props.row.id) },
  { icon: Trash2, label: t('tierlist.row.remove'), disabled: rowCount.value <= 1, danger: true, run: () => editor.removeRow(props.row.id) },
])
</script>

<template>
  <div class="space-y-3 px-3 pb-2 pt-2.5">
    <label class="block">
      <span class="text-[11px] font-semibold text-slate-400">{{ $t('tierlist.row.name') }}</span>
      <input
        ref="nameInput"
        :value="row.label"
        :maxlength="TIER_LIMITS.label"
        class="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        @input="editor.updateRow(row.id, { label: ($event.target as HTMLInputElement).value })"
        @keydown.enter.prevent="emit('close')"
      >
    </label>

    <div>
      <span class="text-[11px] font-semibold text-slate-400">{{ $t('tierlist.row.color') }}</span>
      <div class="mt-1.5 flex flex-wrap gap-2">
        <button
          v-for="color in TIER_COLORS"
          :key="color"
          type="button"
          class="size-7 cursor-pointer rounded-md ring-1 ring-black/10 ring-offset-2 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 motion-reduce:transition-none"
          :class="row.color === color ? 'ring-2! ring-slate-900!' : ''"
          :style="{ backgroundColor: color }"
          :aria-label="color"
          :aria-pressed="row.color === color"
          @click="setColor(color)"
        />
        <label
          class="relative grid size-7 cursor-pointer place-items-center rounded-md border border-dashed border-slate-300 text-slate-500 transition hover:border-slate-500 hover:text-slate-800 focus-within:ring-2 focus-within:ring-slate-500"
          :title="$t('tierlist.row.customColor')"
        >
          <LucideIcon :icon="Pipette" class="size-3.5" />
          <input
            type="color"
            :value="row.color"
            :aria-label="$t('tierlist.row.customColor')"
            class="absolute inset-0 size-full cursor-pointer opacity-0"
            @input="setColor(($event.target as HTMLInputElement).value)"
          >
        </label>
      </div>
    </div>

    <div class="-mx-3 border-t border-slate-100 pt-1">
      <button
        v-for="action in actions"
        :key="action.label"
        type="button"
        role="menuitem"
        class="flex w-full cursor-pointer items-center gap-2.5 px-3 py-1.5 text-left text-[13px] transition disabled:cursor-not-allowed disabled:opacity-40"
        :class="action.danger ? 'text-rose-600 enabled:hover:bg-rose-50' : 'text-slate-600 enabled:hover:bg-slate-50 enabled:hover:text-slate-900'"
        :disabled="action.disabled"
        @click="run(action.run)"
      >
        <LucideIcon :icon="action.icon" class="size-4 shrink-0" :class="action.danger ? '' : 'text-slate-400'" />{{ action.label }}
      </button>
    </div>
  </div>
</template>
