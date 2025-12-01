<template>
  <div class="flex flex-col items-center">
    <div class="relative w-16 h-16">
      <svg class="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <!-- 背景圆环 -->
        <path
          class="text-gray-200"
          stroke-width="3"
          fill="none"
          stroke="currentColor"
          d="M18 2.0845
             a 15.9155 15.9155 0 0 1 0 31.831
             a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <!-- 如果有评分，则绘制进度圆环 -->
        <path
          v-if="hasRating"
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
          :stroke-dasharray="`${rating} 100`"
          :style="{ stroke: ringColor }"
          d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <!-- 中间图标：如果有评分，则根据好评率显示向上/向下拇指；否则显示问号图标 -->
      <div class="absolute inset-0 flex items-center justify-center">
        <template v-if="hasRating">
          <Icon
            v-if="rating >= 50"
            name="material-symbols:thumb-up"
            class="w-6 h-6"
            :style="{ color: ringColor }"
          />
          <Icon
            v-else
            name="material-symbols:thumb-down"
            class="w-6 h-6"
            :style="{ color: ringColor }"
          />
        </template>
        <template v-else>
          <Icon name="material-symbols:help-outline" class="w-6 h-6 text-gray-500" />
        </template>
      </div>
    </div>
    <!-- 评分文本 -->
    <div v-if="hasRating" class="mt-1 text-sm font-semibold" :style="{ color: ringColor }">
      {{ rating }}%
    </div>
    <div v-else class="mt-1 text-sm font-semibold text-gray-500">用户评分不足</div>
    <div class="text-xs text-gray-500">好评率</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 如果评分数据缺失，则传入 null（默认值为 null）
  rating: {
    type: Number,
    default: null,
  },
});

// 判断是否有评分数据
const hasRating = computed(() => {
  return false;
});

// 如果有评分，使用 HSL 计算动态颜色（饱和度70%，亮度45%）；否则返回固定灰色
const ringColor = computed(() => {
  if (!hasRating.value) return 'hsl(0, 0%, 60%)';
  const weight = props.rating / 100;
  const hue = weight * 120; // 0 ~ 120：低评分为红色，高评分为绿色
  return `hsl(${hue}, 70%, 45%)`;
});

// 将评分转换为数字，方便模板中使用
const rating = computed(() => (hasRating.value ? props.rating : 0));
</script>
