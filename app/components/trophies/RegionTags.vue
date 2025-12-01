<template>
  <div v-if="trophySet.region" class="mt-6">
    <div class="flex items-center mb-3">
      <img
        src="https://i.psray.net/i/2024/08/30/66d1696c2fa99.png"
        class="mr-3"
        style="width: 28px"
      />
      <span class="text-lg font-medium">{{ $t('trophies.tags') }}</span>
    </div>
    <div class="flex items-center flex-wrap gap-5">
      <RegionTag :code="code" v-for="code in trophySet.region.split(',')" />
    </div>
  </div>
</template>

<script setup>
defineProps(['trophySet']);
</script>
