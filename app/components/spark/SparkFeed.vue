<template>
  <div class="mt-6 space-y-6">
    <!-- 如果没有任何Spark数据 -->
    <div v-if="!sparks || !sparks.length" class="text-gray-500 text-center p-4 italic">
      暂无任何动态
    </div>

    <!-- 遍历Spark列表 -->
    <div
      v-for="spark in sparks"
      class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:bg-gray-50"
    >
      <SparkCard :spark="spark" @new-activity="emit('new-activity')" />
    </div>
  </div>
</template>

<script setup>
import SparkCard from './SparkCard.vue';

const props = defineProps({
  sparks: {
    type: Array,
    default: [],
  },
});
const emit = defineEmits(['new-activity']);
</script>
