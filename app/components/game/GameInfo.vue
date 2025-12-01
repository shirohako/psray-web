<template>
  <div class="p-4 bg-white rounded border shadow-sm">
    <!-- 游戏标题 -->
    <h1 class="text-3xl font-bold">{{ game.title }}</h1>

    <!-- 发行日期 -->
    <p class="text-sm text-gray-600 my-2">发布于: {{ game.first_release_date }}</p>

    <!-- 分割线 -->
    <hr class="my-4 border-gray-300" />

    <!-- 用户评价 (好评和差评) -->
    <div>
      <h2 class="text-xl font-semibold uppercase text-gray-800 mb-1">用户评价</h2>
      <p class="text-lg text-gray-700 font-medium mb-3">
        {{ game.positive_rate }}% 的用户 给与了好评
      </p>
      <p class="text-xs text-gray-500 mb-2">基于 {{ game.review_count }} 篇 评测</p>

      <!-- 横向绿色进度条-->
      <div class="flex space-x-1" v-if="game.review_count > 0">
        <div class="h-2 bg-green-500 mb-2" :style="{ width: game.positive_rate + '%' }"></div>
        <div class="h-2 bg-red-500 mb-2" :style="{ width: 100 - game.positive_rate + '%' }"></div>
      </div>
      <div class="flex space-x-1" v-else>
        <div class="h-2 bg-green-500 mb-2 w-[50%]"></div>
        <div class="h-2 bg-red-500 mb-2 w-[50%]"></div>
      </div>
      <div class="flex justify-between mb-2">
        <Icon name="material-symbols:thumb-up" class="w-4 h-4 bg-green-600" />
        <Icon name="material-symbols:thumb-down" class="w-4 h-4 bg-red-400" />
      </div>

      <!-- 综合排名-->
      <div class="flex items-center justify-end">
        <span class="bg-blue-500 text-white font-bold py-1 px-2 rounded text-xl">
          PSRay Rank TBD
        </span>
      </div>
    </div>

    <!-- 分割线 -->
    <hr class="my-4 border-gray-300" />

    <!-- 用户打分 -->
    <div>
      <h3 class="text-xl font-semibold uppercase text-gray-800">用户评分</h3>

      <!-- User Score 圆形（右侧的绿色圆）-->
      <div class="flex items-center justify-between mt-3">
        <p class="text-lg text-gray-700">基于 {{ game.rating_count }} 位用户打分</p>

        <div
          class="bg-purple-500 text-white font-bold h-12 w-12 rounded-full flex items-center justify-center text-xl"
        >
          {{ game.score || 0.0 }}
        </div>
      </div>
    </div>

    <!-- 分割线 -->
    <hr class="my-4 border-gray-300" />

    <!-- My Score 区块 -->
    <div>
      <GamePostReview />
      <button
        class="border border-gray-300 bg-white px-4 py-2 rounded text-sm hover:bg-gray-100 transition-colors"
        @click="writeGameReview"
      >
        发布我的评价
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps(['game']);

function writeGameReview() {
  const userStore = useUserStore();
  if (userStore.authenticated) {
    const visible = useState('review-dialog');
    visible.value = true;
  } else {
    navigateTo('/auth/login');
  }
}
</script>
