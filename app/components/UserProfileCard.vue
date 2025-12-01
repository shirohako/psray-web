<template>
  <div class="flex flex-col space-y-2 w-[350px] p-2">
    <img :src="user.avatarUrl" class="size-12 rounded-full" />
    <!-- PSNID -->
    <p class="text-xl font-bold">{{ user.psnid }}</p>
    <!-- 奖杯 -->
    <div class="flex space-x-3 flex-wrap">
      <div class="flex justify-start items-center space-x-1">
        <img src="https://i.psray.net/i/2023/09/04/64f4e3dd41b45.png" class="size-4" />
        <span>{{ user.platinum }}</span>
      </div>
      <div class="flex justify-start items-center space-x-1">
        <img src="https://i.psray.net/i/2024/09/01/66d46bee1ad33.png" class="size-4" />
        <span>{{ user.gold }}</span>
      </div>
      <div class="flex justify-start items-center space-x-1">
        <img src="https://i.psray.net/i/2024/09/01/66d46befbc188.png" class="size-4" />
        <span>{{ user.silver }}</span>
      </div>
      <div class="flex justify-start items-center space-x-1">
        <img src="https://i.psray.net/i/2024/09/01/66d46beec5bb1.png" class="size-4" />
        <span>{{ user.bronze }}</span>
      </div>
    </div>
    <!-- 4格 -->
    <div class="grid grid-cols-2">
      <div class="flex items-center space-x-1">
        <Icon name="material-symbols:family-star" class="size-5 text-yellow-400" />

        <span
          ><b>{{ user.trophyLevel }}</b> PSN Level</span
        >
      </div>
      <div class="flex items-center space-x-1">
        <Icon name="solar:gamepad-minimalistic-linear" class="size-5 text-blue-500" />
        <span
          ><b>{{ user.games_played }}</b> Games</span
        >
      </div>
      <div class="flex items-center space-x-1">
        <Icon name="mdi:account-multiple" class="size-5 text-green-500" />
        <span
          ><b>{{ user.following }}</b> Following</span
        >
      </div>
      <div class="flex items-center space-x-1">
        <Icon name="mdi:account-multiple" class="size-5 text-purple-500" />
        <span
          ><b>{{ user.followers }}</b> Followers</span
        >
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  user: {
    type: Object,
  },
});
</script>
