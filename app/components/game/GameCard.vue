<template>
  <div class="bg-white rounded-lg shadow hover:shadow-xl transition p-4 flex flex-col sm:flex-row">
    <!-- 左侧封面图 -->
    <div class="w-full sm:w-32 sm:mr-4 flex-shrink-0">
      <img :src="getCover(game)" alt="game cover" class="w-full h-auto object-contain" />
    </div>
    <!-- 右侧信息及评分 -->
    <div class="flex-1 mt-4 sm:mt-0 flex flex-col sm:flex-row sm:items-center justify-between">
      <!-- 主要信息 -->
      <div>
        <!-- 平台图标 -->
        <div class="flex space-x-1.5 mb-1 items-center text-gray-500">
          <Icon name="mdi:sony-playstation" class="w-5 h-5" v-if="true" />
          <Icon name="mdi:microsoft-xbox" class="w-4 h-4" v-if="hasPlatformRelease(game, 'Xbox')" />
          <Icon
            name="mdi:nintendo-switch"
            class="w-4 h-4"
            v-if="hasPlatformRelease(game, 'Nintendo')"
          />
          <Icon name="mdi:steam" class="w-4 h-4" v-if="hasPlatformRelease(game, 'Windows')" />
          <Icon
            name="material-symbols:smartphone"
            class="w-4 h-4"
            v-if="hasPlatformRelease(game, 'Smartphone')"
          />
        </div>
        <!-- 标题 -->
        <NuxtLink :to="`/games/${game.id}`">
          <h3 class="text-xl font-bold text-gray-800 mb-1">{{ game.title }}</h3>
        </NuxtLink>
        <!-- 发售时间 -->
        <div class="flex items-center text-gray-600 my-2">
          <Icon name="material-symbols:calendar-month-outline" class="w-5 h-5" />
          <span class="ml-1">{{ getReleaseDate(game) }}</span>
        </div>
        <!-- 发行商 -->
        <div class="flex items-center text-gray-600 my-2" v-if="developerName">
          <Icon name="material-symbols:storefront" class="w-5 h-5" />
          <span class="ml-1">{{ developerName }}</span>
        </div>
        <!-- 类型 Tag -->
        <div class="flex space-x-2 mt-3 flex-wrap">
          <span
            v-for="tag in genres"
            class="px-2 py-1 bg-gray-200 text-gray-700 rounded-sm text-xs"
          >
            {{ tag }}
          </span>
        </div>
      </div>
      <!-- 评分组件（小屏隐藏） -->
      <div class="hidden sm:block mt-4 sm:mt-0">
        <RatingRing :rating="randomRating" />
      </div>
    </div>
  </div>
</template>

<script setup>
import RatingRing from '~/components/game/RatingRing.vue';

const props = defineProps({
  game: {
    type: Object,
    required: true,
  },
});

const { getCover, getDeveloperName, getReleaseDate, getGenres, hasPlatformRelease } = useGame();

const genres = computed(() => {
  return getGenres(props.game);
});

const developerName = computed(() => {
  return getDeveloperName(props.game);
});

// 测试时生成随机好评率（0～100）
const randomRating = computed(() => {
  return Math.floor(Math.random() * 101);
});
</script>
