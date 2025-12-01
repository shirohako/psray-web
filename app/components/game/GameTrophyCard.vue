<template>
  <NuxtLink
    :to="`/trophies/${trophy.id}`"
    class="flex items-center justify-center md:justify-between flex-wrap md:flex-nowrap space-y-4"
  >
    <!-- 左侧：logo / 标题 / 拥有者信息 -->
    <div class="flex items-center space-x-3">
      <div class="w-16 h-16 flex items-center justify-center bg-gray-100 text-gray-400 rounded">
        <img :src="trophy.trophyTitleIconUrl" />
      </div>

      <!-- 标题 & 拥有者统计等信息 -->
      <div>
        <h3 class="text-base font-semibold text-gray-800">
          {{ trophy.trophyTitleName }}
        </h3>
        <p class="text-sm text-gray-600">{{ '1' }} Owners • {{ '1' }} Recent</p>
      </div>
      <span class="inline-block text-xs bg-blue-600 text-white py-1 px-2 rounded font-medium">
        {{ trophy.trophyTitlePlatform }}
      </span>
    </div>

    <!-- 右侧 -->
    <div class="flex items-center space-x-4">
      <!-- 奖杯数量 -->
      <div class="text-xs text-gray-700 leading-tight">
        <div class="flex space-x-4">
          <div class="flex flex-col items-center justify-center space-y-1">
            <img src="https://i.psray.net/i/2023/09/04/64f4e3dd41b45.png" class="size-6" />
            <span class="font-medium">1</span>
          </div>
          <div class="flex flex-col items-center justify-center space-y-1">
            <img src="https://i.psray.net/i/2024/09/01/66d46bee1ad33.png" class="size-6" />
            <span class="font-medium">30</span>
          </div>
          <div class="flex flex-col items-center justify-center space-y-1">
            <img src="https://i.psray.net/i/2024/09/01/66d46befbc188.png" class="size-6" />
            <span class="font-medium">30</span>
          </div>
          <div class="flex flex-col items-center justify-center space-y-1">
            <img src="https://i.psray.net/i/2024/09/01/66d46beec5bb1.png" class="size-6" />
            <span class="font-medium">30</span>
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  trophy: {
    type: Object,
  },
});
</script>
