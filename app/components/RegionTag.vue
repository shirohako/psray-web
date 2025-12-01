<template>
  <div class="border px-4 py-1.5 rounded-md flex gap-3 items-center" v-if="tag">
    <!-- 地区图片 -->
    <div class="flex items-center">
      <img v-if="tag.iconType == 'image'" :src="tag.icon" class="size-8" />
      <Icon :name="tag.icon" class="text-lg rounded-sm border" v-else />
    </div>
    <!-- 文字描述 -->
    <div class="flex flex-col gap-0.5">
      <div class="flex items-baseline gap-1">
        <span class="font-bold text-lg font-mono">{{ tag.code }}</span>
        <span class="text-xs text-gray-400">{{ tag.name }}</span>
      </div>
      <div class="text-gray-700 text-sm">{{ tag.description }}</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['code']);
const { getRegionTag } = useTrophies();

const tag = computed(() => {
  return getRegionTag(props.code);
});
</script>

<style></style>
