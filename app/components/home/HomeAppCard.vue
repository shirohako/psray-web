<template>
  <div class="home-app-card bg-white w-full p-10 rounded-2xl shadow-md">
    <NuxtLink class="flex flex-col" :to="link">
      <Icon :name="props.icon" class="text-4xl" :class="color"></Icon>
      <span class="mt-3 font-semibold">{{ props.title }}</span>
    </NuxtLink>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: 'text-gray-400',
  },
  link: {
    type: [String, null],
    default: null,
  },
});
</script>

<style>
.home-app-card {
  border: 1px solid #f1f1f4;
}
</style>
