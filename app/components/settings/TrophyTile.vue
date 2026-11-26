<script setup lang="ts">
import { Trophy } from 'lucide'
import type { PickedTrophy } from '~/utils/profileShowcase'

/** A picked trophy's icon inside a `SettingsSortTray` tile: rare frame, and the tier badge when there's room. */
defineProps<{ pick: PickedTrophy; badge?: boolean }>()
</script>

<template>
  <img :src="pick.icon_url" :alt="pick.name" class="size-full rounded-lg object-cover shadow-sm" draggable="false" />
  <TrophyRareFrame v-if="isRareTrophy(pick)" />
  <span
    v-if="badge"
    class="absolute -bottom-1 -left-1 grid size-4.5 place-items-center rounded-full border-2 border-white bg-white shadow-sm"
    :class="trophyTierColor(pick.type)"
  >
    <LucideIcon :icon="Trophy" class="size-2.5" />
  </span>
</template>
