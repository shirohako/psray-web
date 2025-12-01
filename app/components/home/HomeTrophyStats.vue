<template>
  <div class="flex gap-2 font-semibold">
    <div v-for="trophy in trophyTypes" :key="trophy.type" class="flex items-center gap-1">
      <img class="size-6" :src="getTrophyIcon(trophy.type)" :alt="trophy.type" />
      <span class="text-base">{{ trophy.count }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  platinum?: number;
  gold?: number;
  silver?: number;
  bronze?: number;
}

const props = withDefaults(defineProps<Props>(), {
  platinum: 0,
  gold: 0,
  silver: 0,
  bronze: 0,
});

const { getTrophyIcon } = usePsn();

const trophyTypes = computed(() => [
  { type: 'platinum', count: props.platinum },
  { type: 'gold', count: props.gold },
  { type: 'silver', count: props.silver },
  { type: 'bronze', count: props.bronze },
]);
</script>
