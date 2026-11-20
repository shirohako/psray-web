<script setup lang="ts">
import { ArrowDown, ArrowUp, Combine, GripVertical, Plus, Target, Trash2, X } from 'lucide'
import {
  emptyStage,
  mergeIntoPrevious,
  moveEntry,
  moveStage,
  removeEntry,
  type DraftStage,
} from '~/utils/adminSeries'

/**
 * The series editor's stage board. Stages reorder by dragging their handle
 * (or the arrow buttons); versions move between stages by dragging (or the
 * "move to" menu, which also splits one into a new stage). Clicking a stage
 * makes it the target for sets added from the side panel.
 */
const stages = defineModel<DraftStage[]>('stages', { required: true })
const target = defineModel<string>('target', { required: true })

type Drag = { type: 'entry'; setId: number } | { type: 'stage'; key: string }
const drag = ref<Drag | null>(null)
const over = ref<{ stageKey: string; beforeSetId: number | null } | null>(null)
const stageDrop = ref<number | null>(null)
const confirmDelete = ref<string | null>(null)

const numbers = computed(() => {
  let n = 0
  return new Map(stages.value.map(stage => [stage.key, stage.kind === 'main' ? ++n : null]))
})
const stageTitle = (stage: DraftStage) => (stage.kind === 'main' ? `第 ${numbers.value.get(stage.key)} 阶段` : '外传')
const moveOptions = (stage: DraftStage) => stages.value
  .filter(other => other.key !== stage.key)
  .map(other => ({ value: other.key, label: `${stageTitle(other)} · ${other.label || other.fallbackName || '未命名'}` }))

function update(next: DraftStage[]) {
  stages.value = next
  if (!next.some(stage => stage.key === target.value)) target.value = next[next.length - 1]?.key ?? 'new'
}

function patchStage(key: string, patch: Partial<DraftStage>) {
  update(stages.value.map(stage => stage.key === key ? { ...stage, ...patch } : stage))
}

function shift(key: string, by: number) {
  const index = stages.value.findIndex(stage => stage.key === key)
  update(moveStage(stages.value, key, index + by))
}

function removeStage(key: string) {
  const stage = stages.value.find(s => s.key === key)
  if (stage?.entries.length && confirmDelete.value !== key) {
    confirmDelete.value = key
    return
  }
  confirmDelete.value = null
  update(stages.value.filter(s => s.key !== key))
}

function addStage() {
  const stage = emptyStage()
  update([...stages.value, stage])
  target.value = stage.key
}

function moveTo(setId: number, toKey: string) {
  if (toKey) update(moveEntry(stages.value, setId, toKey))
}

// ── Drag and drop ───────────────────────────────────────────────────────────
function startEntry(event: DragEvent, setId: number) {
  drag.value = { type: 'entry', setId }
  event.dataTransfer?.setData('text/plain', String(setId))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}
function startStage(event: DragEvent, key: string) {
  drag.value = { type: 'stage', key }
  event.dataTransfer?.setData('text/plain', key)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}
function end() {
  drag.value = null
  over.value = null
  stageDrop.value = null
}

function overEntry(event: DragEvent, stageKey: string, beforeSetId: number | null) {
  if (drag.value?.type !== 'entry') return
  event.preventDefault()
  over.value = { stageKey, beforeSetId }
}
function overStage(event: DragEvent, index: number) {
  if (drag.value?.type !== 'stage') return
  event.preventDefault()
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  stageDrop.value = event.clientY < box.top + box.height / 2 ? index : index + 1
}

function drop() {
  const current = drag.value
  if (current?.type === 'entry' && over.value) {
    if (over.value.beforeSetId !== current.setId) {
      update(moveEntry(stages.value, current.setId, over.value.stageKey, over.value.beforeSetId))
    }
  }
  else if (current?.type === 'stage' && stageDrop.value !== null) {
    const from = stages.value.findIndex(stage => stage.key === current.key)
    update(moveStage(stages.value, current.key, stageDrop.value > from ? stageDrop.value - 1 : stageDrop.value))
  }
  end()
}
</script>

<template>
  <div class="space-y-3" @dragend="end">
    <div
      v-for="(stage, index) in stages"
      :key="stage.key"
      class="relative"
      @dragover="overStage($event, index)"
      @drop.prevent="drop"
    >
      <!-- Where a dragged stage would land -->
      <span v-if="drag?.type === 'stage' && stageDrop === index" class="absolute -top-2 inset-x-0 h-0.5 rounded-full bg-slate-900" />
      <span v-if="drag?.type === 'stage' && stageDrop === index + 1 && index === stages.length - 1" class="absolute -bottom-2 inset-x-0 h-0.5 rounded-full bg-slate-900" />

      <section
        class="admin-panel overflow-hidden transition-shadow"
        :class="[
          target === stage.key ? 'ring-2 ring-slate-900/15' : '',
          stage.kind === 'side' ? 'border-dashed' : '',
          drag?.type === 'stage' && drag.key === stage.key ? 'opacity-40' : '',
        ]"
      >
        <header class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/60 px-3 py-2" @click="target = stage.key">
          <span
            draggable="true"
            class="grid size-7 shrink-0 cursor-grab place-items-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 active:cursor-grabbing"
            title="拖动调整阶段顺序"
            @dragstart="startStage($event, stage.key)"
          ><LucideIcon :icon="GripVertical" class="size-4" /></span>
          <span class="w-16 shrink-0 text-xs font-semibold text-slate-700">{{ stageTitle(stage) }}</span>
          <input
            :value="stage.label"
            class="admin-input h-7 min-w-40 flex-1"
            :placeholder="stage.fallbackName || '阶段名（留空用代表游戏的名称）'"
            maxlength="255"
            :aria-label="`${stageTitle(stage)}名称`"
            @input="patchStage(stage.key, { label: ($event.target as HTMLInputElement).value })"
            @click.stop
          />
          <span v-if="stage.releaseDate" class="text-[11px] tabular-nums text-slate-400">{{ stage.releaseDate.slice(0, 4) }}</span>
          <div class="flex items-center rounded-md border border-slate-200 bg-white p-0.5 text-[11px]">
            <button
              v-for="kind in (['main', 'side'] as const)"
              :key="kind"
              type="button"
              class="rounded px-2 py-0.5 font-medium transition"
              :class="stage.kind === kind ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'"
              @click.stop="patchStage(stage.key, { kind })"
            >{{ kind === 'main' ? '主线' : '外传' }}</button>
          </div>
          <div class="ml-auto flex items-center gap-0.5">
            <button type="button" class="grid size-7 place-items-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30" title="上移" :disabled="index === 0" @click.stop="shift(stage.key, -1)"><LucideIcon :icon="ArrowUp" class="size-3.5" /></button>
            <button type="button" class="grid size-7 place-items-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30" title="下移" :disabled="index === stages.length - 1" @click.stop="shift(stage.key, 1)"><LucideIcon :icon="ArrowDown" class="size-3.5" /></button>
            <button type="button" class="grid size-7 place-items-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30" title="并入上一阶段" :disabled="index === 0" @click.stop="update(mergeIntoPrevious(stages, stage.key))"><LucideIcon :icon="Combine" class="size-3.5" /></button>
            <button
              type="button"
              class="inline-flex h-7 items-center gap-1 rounded px-1.5 text-[11px] transition"
              :class="confirmDelete === stage.key ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-200 hover:text-red-600'"
              :title="stage.entries.length ? '删除阶段和其中的奖杯组' : '删除阶段'"
              @click.stop="removeStage(stage.key)"
              @blur="confirmDelete = null"
            ><LucideIcon :icon="Trash2" class="size-3.5" /><span v-if="confirmDelete === stage.key">再点一次删除</span></button>
          </div>
        </header>

        <ul
          class="divide-y divide-slate-100"
          :class="over?.stageKey === stage.key && over.beforeSetId === null ? 'bg-slate-50' : ''"
          @dragover="overEntry($event, stage.key, null)"
          @drop.prevent.stop="drop"
        >
          <li
            v-for="entry in stage.entries"
            :key="entry.set.id"
            draggable="true"
            class="relative flex cursor-grab items-center gap-2 px-3 py-2 transition-colors active:cursor-grabbing"
            :class="drag?.type === 'entry' && drag.setId === entry.set.id ? 'opacity-40' : 'hover:bg-slate-50'"
            @dragstart="startEntry($event, entry.set.id)"
            @dragover.stop="overEntry($event, stage.key, entry.set.id)"
            @drop.prevent.stop="drop"
          >
            <span v-if="over?.stageKey === stage.key && over.beforeSetId === entry.set.id" class="absolute inset-x-3 top-0 h-0.5 rounded-full bg-slate-900" />
            <LucideIcon :icon="GripVertical" class="size-3.5 shrink-0 text-slate-300" />
            <AdminSeriesSetRow :set="entry.set" :source="entry.source" class="flex-1">
              <select
                class="h-7 max-w-36 rounded-md border border-slate-200 bg-white px-1.5 text-[11px] text-slate-600 outline-none hover:border-slate-300 focus:border-slate-900"
                :aria-label="`移动 ${entry.set.name}`"
                @change="moveTo(entry.set.id, ($event.target as HTMLSelectElement).value); ($event.target as HTMLSelectElement).value = ''"
              >
                <option value="">移动到…</option>
                <option v-for="option in moveOptions(stage)" :key="option.value" :value="option.value">{{ option.label }}</option>
                <option value="new">拆到新阶段</option>
              </select>
              <button type="button" class="grid size-7 shrink-0 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600" :aria-label="`从系列中移除 ${entry.set.name}`" title="从系列中移除（自动归类不会再加回）" @click="update(removeEntry(stages, entry.set.id))">
                <LucideIcon :icon="X" class="size-3.5" />
              </button>
            </AdminSeriesSetRow>
          </li>
          <li v-if="!stage.entries.length" class="px-3 py-5 text-center text-xs text-slate-400">
            空阶段：把奖杯组拖到这里，或在右侧选中这个阶段后加入。空阶段不能保存。
          </li>
        </ul>
        <button
          v-if="target !== stage.key"
          type="button"
          class="flex w-full items-center justify-center gap-1 border-t border-slate-100 py-1.5 text-[11px] text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          @click="target = stage.key"
        ><LucideIcon :icon="Target" class="size-3" />设为加入目标</button>
      </section>
    </div>

    <button type="button" class="admin-button w-full border-dashed" @click="addStage">
      <LucideIcon :icon="Plus" class="size-3.5" />新建阶段
    </button>
  </div>
</template>
