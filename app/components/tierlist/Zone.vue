<script setup lang="ts">
/**
 * The tiles of one row or of the pool. While something is dragged over it, a
 * dashed slot shows where it will land and the dragged tile is hidden, so the
 * row already looks the way it will after the drop.
 *
 * The dragged tile is hidden, not removed: on touch screens `touchmove` keeps
 * going to the element the finger went down on, and once that element leaves
 * the document the events stop reaching `window`, where the drag cancels them
 * to keep the page from scrolling.
 */
const props = defineProps<{
  zone: string
  ids: string[]
  /** Shown when the zone has nothing in it. */
  empty?: string
}>()

const editor = useTierEditor()
const SLOT = '\u0000slot'

const entries = computed(() => {
  const dragged = editor.drag.draggedItemId
  const list = props.ids.map(id => ({ id, hidden: id === dragged }))
  const target = editor.drag.state.zone
  if (!editor.drag.state.active || !dragged || target?.zone !== props.zone) return list
  // The target index counts the visible tiles only.
  let at = list.length
  let visible = 0
  for (const [i, entry] of list.entries()) {
    if (entry.hidden) continue
    if (visible === target.index) {
      at = i
      break
    }
    visible++
  }
  list.splice(at, 0, { id: SLOT, hidden: false })
  return list
})
const isEmpty = computed(() => entries.value.every(entry => entry.hidden))
</script>

<template>
  <div class="flex flex-wrap content-start items-start gap-1.5 p-1.5">
    <template v-for="entry in entries" :key="entry.id">
      <div v-if="entry.id === SLOT" class="h-16 w-12 shrink-0 rounded border-2 border-dashed border-slate-400 bg-slate-100 sm:h-20 sm:w-15" aria-hidden="true" />
      <TierlistItem v-else-if="editor.list?.items[entry.id]" v-show="!entry.hidden" :item="editor.list.items[entry.id]" :zone="zone" />
    </template>
    <p v-if="isEmpty && empty" class="self-center px-2 py-3 text-xs leading-5 text-slate-400">{{ empty }}</p>
  </div>
</template>
