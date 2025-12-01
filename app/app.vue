<template>
  <NuxtLoadingIndicator style="opacity: 1" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
useHead({
  titleTemplate: titleChunk => {
    return titleChunk ? `${titleChunk} - PSRay` : 'PSRay - PSN玩家游戏社区';
  },
});
</script>

<style>
@import url('./assets/css/base.css');
</style>
