<template>
  <div class="p-4 bg-white rounded border shadow-sm">
    <h2 class="font-bold text-xl">玩家评价</h2>
    <div class="space-y-3 mt-5">
      <div v-for="review in reviews.data.data" class="border px-3 py-2 rounded-md">
        <div class="flex gap-2 items-center justify-between">
          <div class="flex gap-2 items-center">
            <img :src="review.user.avatarUrl" class="size-14 rounded-full" />
            <div class="flex flex-col gap-0.5 justify-center">
              <div class="font-bold text-lg">{{ review.user.psnid }}</div>
              <div class="text-sm text-gray-500">{{ formatTimestamp(review.created_at) }}</div>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <span>{{ review.is_recommended ? '推荐' : '不推荐' }}</span>
            <Icon
              name="material-symbols:thumb-up"
              class="size-6"
              :class="getColor(review.is_recommended)"
            />
          </div>
        </div>

        <div class="my-5 p-1">
          {{ review.comment }}
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="text-gray-500 text-sm flex items-center gap-1">
            <Icon name="ic:round-download-done" class="text-blue-500 text-xl"></Icon>
            <span>发布评测时，TA的游戏进度：{{ review.game_progress }}%</span>
          </div>
          <div class="text-gray-500 text-sm flex items-center gap-1" v-if="review.score">
            <Icon name="material-symbols:family-star-sharp" class="text-yellow-500 text-xl"></Icon>
            <span>给与评分：{{ review.score }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(['reviews']);
const { formatTimestamp } = useTime();

function getColor(is_recommended) {
  return is_recommended ? 'bg-green-500' : 'bg-red-500 rotate-180';
}
</script>
