<template>
  <div class="space-y-4 bg-white rounded shadow p-4">
    <div v-for="(trophy, index) in trophies">
      <GameTrophyCard :trophy="trophy" />
    </div>
  </div>
</template>

<script setup>
import GameTrophyCard from '../game/GameTrophyCard';

const props = defineProps({
  trophies: [],
});
</script>
