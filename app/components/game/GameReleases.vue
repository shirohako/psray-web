<template>
  <div class="p-4 bg-white rounded border shadow-sm">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-sm font-semibold text-gray-700">发布时间</h2>
    </div>

    <!-- 内容区域：平台 + 日期 列表 -->
    <div class="space-y-2">
      <div
        v-for="(release, idx) in releases"
        :key="idx"
        class="flex justify-between text-sm text-gray-700"
      >
        <div class="pr-2">
          <span>{{ release.platform }}</span>
          <span v-if="release?.region" class="ml-1"> ({{ release.region }}) </span>
        </div>
        <div class="font-semibold text-gray-800">
          {{ release.date }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  releases: {
    type: Array,
    default: [],
  },
});
</script>
