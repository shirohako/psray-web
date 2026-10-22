<script setup lang="ts">
import { Check } from 'lucide'
import type { LeaderboardBoard } from '~/composables/useRankingBoards'

/** The ranking boards as selectable cards, each with its icon and description. */
defineProps<{
  boards: LeaderboardBoard[]
  /** Key of the board on screen. */
  active: string
}>()

const emit = defineEmits<{ select: [key: string] }>()

// Picker card colours per board accent, a muted pastel palette: a pale wash
// with a border one step deeper in the same hue (no shadow or halo), and a
// soft mid-pastel icon tile with a dark icon. Idle cards stay white; their tile
// keeps a pale tint. `mark` fills the corner marker of the selected card.
const ACCENTS: Record<LeaderboardBoard['accent'], { selected: string; tile: string; idleTile: string; mark: string }> = {
  violet: { selected: 'border-violet-300 bg-violet-50/70', tile: 'bg-violet-200 text-violet-700', idleTile: 'bg-violet-50 text-violet-500', mark: 'border-violet-400 bg-violet-400' },
  sky: { selected: 'border-sky-300 bg-sky-50/70', tile: 'bg-sky-200 text-sky-700', idleTile: 'bg-sky-50 text-sky-500', mark: 'border-sky-400 bg-sky-400' },
  pink: { selected: 'border-pink-300 bg-pink-50/70', tile: 'bg-pink-200 text-pink-700', idleTile: 'bg-pink-50 text-pink-500', mark: 'border-pink-400 bg-pink-400' },
}
</script>

<template>
  <div role="tablist" :aria-label="$t('leaderboard.boards')" class="grid grid-cols-2 gap-3">
    <button
      v-for="b in boards"
      :key="b.key"
      type="button"
      role="tab"
      :aria-selected="b.key === active"
      class="group relative flex min-w-0 items-center gap-3 rounded-xl border px-2 py-3 text-left transition max-sm:justify-center max-sm:text-center sm:p-4"
      :class="b.key === active
        ? ACCENTS[b.accent].selected
        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'"
      @click="emit('select', b.key)"
    >
      <!-- Corner marker on every card: filled with a check when chosen, an empty circle otherwise -->
      <span
        class="absolute right-3 top-3 grid size-5 place-items-center rounded-full border-2 transition max-sm:hidden"
        :class="b.key === active ? ACCENTS[b.accent].mark : 'border-slate-300 bg-white group-hover:border-slate-400'"
      >
        <LucideIcon v-if="b.key === active" :icon="Check" class="size-3 text-white" stroke-width="3" />
      </span>
      <span
        class="grid size-10 shrink-0 place-items-center rounded-lg transition max-sm:hidden"
        :class="b.key === active ? ACCENTS[b.accent].tile : ACCENTS[b.accent].idleTile"
      >
        <LucideIcon :icon="b.icon" class="size-5" />
      </span>
      <span class="min-w-0">
        <span
          class="block whitespace-nowrap text-sm font-semibold max-sm:text-[13px]"
          :class="b.key === active ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'"
        >{{ $t(b.labelKey) }}</span>
        <span class="mt-0.5 block text-xs leading-5 text-slate-500 max-sm:hidden">{{ $t(b.descriptionKey) }}</span>
      </span>
    </button>
  </div>
</template>
