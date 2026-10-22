<script setup lang="ts">
import type { EarnedInfo, Trophy, TrophyGroup } from '~/services/trophies'
import { filterTrophies, isTrophyEarned, sortTrophies, type TrophyFilterMode, type TrophySortMode } from '~/utils/trophyList'

const props = defineProps<{
  /** A group whose trophies are already in PSN order (see `sortTrophyGroups`). */
  group: TrophyGroup
  /** id → earned order, timestamp, and gap since the previous earned trophy. */
  earnedInfo: Map<number, EarnedInfo>
  hasViewer: boolean
  filter: TrophyFilterMode
  sort: TrophySortMode
  /** Reveal PSN-hidden (spoiler) trophies. */
  showSpoilers: boolean
  /** Continuous serial number per trophy (db id → number). */
  numbers: Map<number, number>
  /** Counts refreshed after publishing or deleting a tip. */
  tipCounts: Record<number, number>
}>()

const emit = defineEmits<{
  detail: [trophy: Trophy]
  earners: [trophy: Trophy]
  tips: [trophy: Trophy]
}>()

const { t } = useI18n()

const title = computed(() => {
  if (props.group.psn_group_id === 'default') return t('trophy.group.baseGame')
  return props.group.localized_name || props.group.name
})

function isEarned(trophy: Trophy) {
  return isTrophyEarned(trophy, props.hasViewer, props.earnedInfo)
}

function earnedAt(t: Trophy) {
  return props.earnedInfo.get(t.id)?.earnedAt ?? null
}

// 1-based position in the viewer's earned order (rank is 0-based).
function earnedOrder(t: Trophy) {
  const rank = props.earnedInfo.get(t.id)?.rank
  return rank == null ? null : rank + 1
}

// Seconds since the previous earned trophy (`null` for the first / unearned).
function earnedGap(t: Trophy) {
  return props.earnedInfo.get(t.id)?.sincePrev ?? null
}

// Filter then sort. Earned-based filter/sort only apply when a viewer is set.
const displayTrophies = computed(() => sortTrophies(
  filterTrophies(props.group.trophies, props.filter, props.hasViewer, props.earnedInfo),
  props.sort,
  props.hasViewer,
  props.earnedInfo,
))
</script>

<template>
  <section>
    <header
      class="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-2.5 sm:px-5"
    >
      <h2 class="truncate text-sm font-semibold text-slate-900">{{ title }}</h2>
      <div class="flex shrink-0 items-center gap-3">
        <span v-for="t in trophyKinds" :key="t.key" class="inline-flex items-center gap-1">
          <span class="size-2 rounded-full" :class="t.dot" />
          <span class="text-xs font-bold text-slate-700">{{ group.defined_trophies[t.key] }}</span>
        </span>
      </div>
    </header>

    <!-- Re-keying on `filter` remounts these, which replays the cascade. -->
    <p v-if="!displayTrophies.length" :key="`empty-${filter}`" class="animate-filter-in px-5 py-10 text-center text-sm text-slate-400">
      {{ $t('trophy.group.noMatches') }}
    </p>

    <div v-else :key="`list-${filter}`" class="divide-y divide-slate-200">
      <TrophyItem
        v-for="(trophy, index) in displayTrophies"
        :key="trophy.id"
        class="animate-filter-in"
        :style="{ animationDelay: `${Math.min(index, 7) * 24}ms` }"
        :trophy="trophy"
        :has-viewer="hasViewer"
        :earned="isEarned(trophy)"
        :earned-at="earnedAt(trophy)"
        :timestamp-missing="earnedInfo.get(trophy.id)?.timestampMissing"
        :earned-order="earnedOrder(trophy)"
        :earned-gap="earnedGap(trophy)"
        :show-spoilers="showSpoilers"
        :number="numbers.get(trophy.id) ?? 0"
        :tip-count="tipCounts[trophy.id]"
        @detail="emit('detail', $event)"
        @earners="emit('earners', $event)"
        @tips="emit('tips', $event)"
      />
    </div>
  </section>
</template>

