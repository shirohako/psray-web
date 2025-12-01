<template>
  <HomeAppBlock :image="image">
    <h3 class="text-xl font-semibold">
      {{ title.line1 }} <br />
      {{ title.line2 }}
    </h3>
    <div class="mt-12">
      <NuxtLink :to="{ name: 'sync' }">
        <button class="home-sync-card__button">
          {{ buttonText }}
        </button>
      </NuxtLink>
    </div>
  </HomeAppBlock>
</template>

<script setup lang="ts">
interface Props {
  image?: string;
  title: {
    line1: string;
    line2: string;
  };
  buttonText: string;
}

withDefaults(defineProps<Props>(), {
  image: 'https://i.psray.net/i/2024/05/18/6647b0e2372fa.png',
});
</script>

<style scoped>
.home-sync-card__button {
  background-color: rgb(30 41 59);
  color: white;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  border-radius: 0.5rem;
  transition: background-color 0.2s;
}

.home-sync-card__button:hover {
  background-color: rgb(51 65 85);
}
</style>
