<template>
  <div class="flex items-center gap-3 font-semibold">
    <div class="flex items-center gap-1">
      <Icon name="ph:ranking" class="text-2xl" />
      <span>{{ label }}:</span>
    </div>

    <div class="flex items-center gap-1">
      <Icon name="fxemoji:asiaaustraliaglobe" />
      <span>{{ globalRank }}</span>
    </div>

    <div class="flex items-center gap-1">
      <Icon :name="`flag:${country.toLowerCase()}-4x3`" class="text-base" />
      <span>{{ countryRank }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string;
  globalRank?: number;
  countryRank?: number;
  country?: string;
}

withDefaults(defineProps<Props>(), {
  globalRank: 0,
  countryRank: 0,
  country: 'CN',
});
</script>
