<template>
  <div class="bg-[#17191e]">
    <div class="max-w-screen-xl mx-auto px-5">
      <div class="pt-6 pb-28">
        <AppBreadcrumb variant="dark" class="mb-2" />
        <h1 class="text-white text-xl font-bold">{{ title }}</h1>
        <div v-if="descriptions.length" class="space-y-1 mt-1">
          <p
            v-for="(desc, index) in descriptions"
            :key="index"
            class="text-gray-400 text-sm flex items-center gap-1"
          >
            <Icon :name="desc.icon" />
            <span>{{ desc.text }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Description {
  icon: string;
  text: string;
}

interface Props {
  title: string;
  descriptions?: Description[];
}

withDefaults(defineProps<Props>(), {
  descriptions: () => [],
});
</script>
