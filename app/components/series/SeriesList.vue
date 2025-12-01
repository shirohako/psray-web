<template>
  <div>
    <div v-for="(group, stage) in groupedWorks" :key="stage" class="mb-6">
      <!-- 整个 stage 分组容器白色背景 -->
      <div class="bg-gray-100 border border-gray-200 rounded-lg p-4">
        <!-- 显示阶段名称 -->
        <h3 class="text-lg font-semibold mb-2">{{ stage }}</h3>
        <!-- 游戏列表 -->
        <div v-for="work in group" class="flex space-x-4 space-y-4 items-center border-gray-100">
          <!-- 左侧 stage_order -->
          <div class="bg-blue-600 rounded-full size-8 flex items-center justify-center">
            <span class="text-white">{{ work.stage_order + 1 }}</span>
          </div>
          <!-- 游戏详情 -->
          <div class="grow">
            <GameCard :game="work.game" v-if="view == '游戏视图'" />
            <TrophiesList :trophies="work.game.trophies" v-else />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import GameCard from '../game/GameCard.vue';
import TrophiesList from './TrophiesList.vue';

const props = defineProps({
  works: {
    type: Array,
    required: true,
  },
  view: {
    type: String,
  },
});

// 根据 work.stage 对作品进行分组
const groupedWorks = computed(() => {
  return props.works.reduce((groups, work) => {
    if (!groups[work.stage]) {
      groups[work.stage] = [];
    }
    groups[work.stage].push(work);
    return groups;
  }, {});
});
</script>
