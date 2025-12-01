<template>
  <!-- 如果已选择图片，则展示整体容器 -->
  <div v-if="images.length" class="border border-gray-200 rounded-md p-4 mb-4">
    <!-- 顶部：显示当前已选图片数 -->
    <div class="mb-3 flex items-center justify-between">
      <div class="text-sm text-gray-600">已选择 {{ images.length }}/4 张图片</div>
    </div>

    <!-- 图片预览列表 -->
    <div
      v-for="(img, index) in images"
      :key="index"
      class="flex items-center mb-2 p-2 bg-white rounded-md"
    >
      <!-- 预览图 -->
      <img
        :src="img.previewUrl"
        alt="preview"
        class="w-16 h-16 object-cover rounded-md border border-gray-200"
      />

      <!-- 文件信息 -->
      <div class="ml-3 flex-1 text-sm">
        <!-- 文件名 -->
        <div class="font-medium text-gray-800 line-clamp-1">
          {{ img.file.name }}
        </div>
        <!-- 文件大小 -->
        <div class="text-gray-500">{{ (img.file.size / 1024).toFixed(2) }} KB</div>
      </div>

      <!-- 删除按钮 -->
      <button class="text-gray-400 hover:text-red-500 ml-3" @click="remove(index)">
        <Icon name="mdi:close" class="size-5" />
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  images: {
    type: Array,
    default: () => [],
  },
});

const emits = defineEmits(['remove']);

// 点击“X”按钮，通知父组件移除该图片
function remove(index) {
  emits('remove', index);
}
</script>
