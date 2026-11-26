<script setup lang="ts">
import { DEFAULT_TIERS } from '~/utils/tierList'

/**
 * The picture at the top of a tool's card on `/tools`, drawn rather than a
 * screenshot so it stays sharp and follows the site's colours. Hovering the
 * card (`group`) nudges it a little.
 */
defineProps<{ tool: string }>()

// Tiles per tier row; the pattern just needs to read as "a ranked list".
const tierTiles = [3, 5, 4, 2, 1]
</script>

<template>
  <div class="relative overflow-hidden bg-slate-50" aria-hidden="true">
    <div v-if="tool === 'tierlist'" class="absolute inset-x-6 top-5 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition-transform duration-500 ease-out group-hover:-translate-y-1 motion-reduce:transition-none">
      <div v-for="(count, row) in tierTiles" :key="row" class="flex border-t border-slate-100 first:border-t-0">
        <div class="grid h-7 w-8 shrink-0 place-items-center text-[11px] font-bold text-slate-900/80" :style="{ backgroundColor: DEFAULT_TIERS[row]!.color }">
          {{ DEFAULT_TIERS[row]!.label }}
        </div>
        <div class="flex gap-1 px-1 py-1">
          <span
            v-for="tile in count"
            :key="tile"
            class="h-5 w-4 rounded-[3px]"
            :class="(row + tile) % 3 === 0 ? 'bg-slate-300' : 'bg-slate-200'"
          />
        </div>
      </div>
    </div>
  </div>
</template>
