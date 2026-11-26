<script setup lang="ts">
import type { PickedGame } from '~/utils/profileShowcase'

/** A picked game's art inside a `SettingsSortTray` tile, at its own aspect (PS5 square, older 320×176). */
defineProps<{ game: PickedGame }>()
</script>

<template>
  <span class="pointer-events-none relative flex size-full items-center justify-center">
    <TrophySetImage :src="game.icon_url" :alt="game.name" :platform="game.platform" />
  </span>
</template>
