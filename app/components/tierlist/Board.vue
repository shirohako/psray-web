<script setup lang="ts">
import { HardDrive, PenLine, Plus } from 'lucide'
import { placedCount, TIER_LIMITS, TIER_POOL } from '~/utils/tierList'

/** The open list: its title, the tier rows, then the unranked pool. */
const editor = useTierEditor()
const list = computed(() => editor.list!)
const placed = computed(() => placedCount(list.value))

/** While a row is dragged: the row the drop line sits above, or `end` for after the last. */
const rowDropBefore = computed(() => {
  const dragged = editor.drag.draggedRowId
  const index = editor.drag.state.row
  if (!dragged || index === null) return null
  return list.value.rows.filter(row => row.id !== dragged)[index]?.id ?? 'end'
})

const tag = 'inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[11px] font-medium'
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" :aria-label="list.title || $t('tierlist.untitled')">
    <header class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 px-2.5 py-2 sm:px-3">
      <label class="flex min-w-48 flex-1 items-center gap-1.5">
        <input
          :value="list.title"
          :maxlength="TIER_LIMITS.title"
          :placeholder="$t('tierlist.untitled')"
          :aria-label="$t('tierlist.titleLabel')"
          class="peer min-w-0 flex-1 truncate rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[15px] font-bold text-slate-900 outline-none transition placeholder:text-slate-300 hover:border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          @input="editor.setTitle(($event.target as HTMLInputElement).value)"
        >
        <LucideIcon :icon="PenLine" class="size-3.5 shrink-0 text-slate-400 transition peer-focus:opacity-0" />
      </label>
      <div class="flex flex-wrap items-center gap-1.5">
        <span :class="tag" class="border-emerald-200 bg-emerald-50 text-emerald-700">
          <LucideIcon :icon="HardDrive" class="size-3" />{{ $t('tierlist.savedLocally') }}
        </span>
        <span :class="tag" class="border-slate-200 bg-slate-50 tabular-nums text-slate-600">{{ $t('tierlist.rowCount', list.rows.length) }}</span>
        <span :class="tag" class="border-slate-200 bg-slate-50 tabular-nums text-slate-600">{{ $t('tierlist.placedCount', placed) }}</span>
      </div>
    </header>

    <div data-tier-rows>
      <TierlistRow
        v-for="(row, index) in list.rows"
        :key="row.id"
        :row="row"
        :index="index"
        :drop-line="rowDropBefore === row.id"
      />
    </div>

    <!-- Unranked items -->
    <div :data-tier-zone="TIER_POOL" class="relative flex border-t border-slate-200 bg-slate-50/70">
      <div v-if="rowDropBefore === 'end'" class="absolute inset-x-0 -top-px z-10 h-0.5 bg-slate-900" />
      <div class="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 bg-slate-200/70 px-1 text-center text-slate-600 sm:w-22">
        <span class="text-xs font-bold">{{ $t('tierlist.pool') }}</span>
        <span class="text-[11px] tabular-nums">{{ list.pool.length }}</span>
      </div>
      <TierlistZone :zone="TIER_POOL" :ids="list.pool" :empty="$t('tierlist.poolEmpty')" class="min-h-19 flex-1 sm:min-h-23" />
    </div>

    <button
      type="button"
      class="flex h-10 w-full items-center justify-center gap-1.5 border-t border-dashed border-slate-300 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="list.rows.length >= TIER_LIMITS.rows"
      @click="editor.insertRow(list.rows.length)"
    >
      <LucideIcon :icon="Plus" class="size-3.5" />{{ $t('tierlist.addRow') }}
    </button>
  </section>
</template>
