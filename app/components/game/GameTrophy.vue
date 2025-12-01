<template>
  <div class="p-4 bg-white rounded border shadow-sm">
    <h2 class="text-xl font-bold mb-2">关联奖杯组</h2>

    <div class="flex flex-col gap-3">
      <GameTrophyCard :trophy="trophy" v-for="(trophy, index) in trophies" />
    </div>
  </div>
</template>

<script setup>
import GameTrophyCard from './GameTrophyCard';

const props = defineProps({
  trophies: {
    type: Array,
    default: [],
  },
});
</script>
