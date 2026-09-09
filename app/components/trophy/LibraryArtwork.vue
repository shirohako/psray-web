<script setup lang="ts">
import type { TrophyBrowseItem } from '~/services/trophies'
const props = defineProps<{ game: TrophyBrowseItem }>()
const isSquareArtwork = computed(() => props.game.platform.includes('PS5'))
</script>

<template>
  <!-- The slot is uniform; the artwork is not. PS5 remains square and
       PS4/PS3/Vita keep their original landscape proportions, without cropping. -->
  <div class="library-artwork relative flex items-center justify-center">
    <div
      class="relative flex h-full items-center justify-center"
      :class="isSquareArtwork ? 'w-full' : 'w-[92%]'"
    >
      <TrophySetImage :src="game.icon_url" :alt="game.localized_name" :platform="game.platform" />
    </div>
  </div>
</template>

<!--
  Keep a real style block in this SFC. During HMR, Vite may briefly request the
  previous `type=style&index=0` virtual module after this component changes.
  Without a current style descriptor, Tailwind can receive the whole Vue file
  as CSS and report TypeScript identifiers such as `TrophyBrowseItem` as invalid
  declarations.
-->
<style scoped>
.library-artwork {
  min-width: 0;
}
</style>
