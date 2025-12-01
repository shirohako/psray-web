<template>
  <div class="w-full md:w-4/12 grid md:grid-cols-2 gap-4">
    <HomeAppCard
      v-for="card in functionCards"
      :key="card.title"
      :title="card.title"
      :icon="card.icon"
      :color="card.color"
      :link="card.link"
    />
  </div>
</template>

<script setup lang="ts">
interface FunctionCard {
  title: string;
  icon: string;
  color?: string;
  link?: string | null;
}

interface Props {
  cards: FunctionCard[];
}

const props = defineProps<Props>();

const functionCards = computed(() => props.cards);
</script>
