<template>
  <div class="max-w-screen-lg mx-auto py-4 px-6">
    <div class="my-2 flex flex-row items-center text-sm gap-0.5">
      <NuxtLink to="/" class="text-gray-600 hover:text-gray-950">
        <div class="flex items-center gap-0.5">
          <Icon name="mdi:home" class="text-lg text-cyan-600 size-4" />
          <span class="leading-relaxed">主页</span>
        </div>
      </NuxtLink>
      <Icon name="material-symbols:chevron-right" class="text-lg text-gray-400" />
      <NuxtLink
        :to="{ name: 'trophies-detail', params: { id: route.query.trophies } }"
        class="text-gray-600 hover:text-gray-950"
      >
        <div class="flex items-center gap-0.5">
          <span class="leading-relaxed">奖杯组 (#{{ route.query.trophies }})</span>
        </div>
      </NuxtLink>
      <Icon name="material-symbols:chevron-right" class="text-lg text-gray-400" />
      <NuxtLink to="#" class="text-gray-600 hover:text-gray-950">
        <div class="flex items-center gap-0.5">
          <span class="leading-relaxed">奖杯组排行榜</span>
        </div>
      </NuxtLink>
    </div>
    <div class="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
      <NuxtLink
        :to="{
          path: '/trophies/ranking/pioneers',
          query: { ...route.query, page: 1 },
        }"
      >
        <div class="flex gap-3 items-center justify-between border p-2 rounded-md">
          <div class="flex gap-3 items-center">
            <img src="https://i.psray.net/i/2024/08/21/66c53be4a4dad.png" class="w-8 h-8" />
            <span class="font-bold"> {{ $t('trophies.ranking.first_achievers') }}</span>
          </div>
          <Icon
            name="material-symbols:arrow-right-alt-rounded"
            class="text-2xl hover:translate-x-1 transition-transform"
            :class="{ 'rotate-90': route.name == 'trophies-ranking-pioneers' }"
          ></Icon>
        </div>
      </NuxtLink>

      <NuxtLink
        :to="{
          path: '/trophies/ranking/time-attack',
          query: { ...route.query, page: 1 },
        }"
      >
        <div class="flex gap-3 items-center justify-between border p-2 rounded-md">
          <div class="flex gap-3 items-center">
            <img src="https://i.psray.net/i/2024/08/21/66c53db151c22.png" class="w-8 h-8" />
            <span class="font-bold"> {{ $t('trophies.ranking.fastest_completed') }}</span>
          </div>
          <Icon
            name="material-symbols:arrow-right-alt-rounded"
            class="text-2xl hover:translate-x-1 transition-transform"
            :class="{
              'rotate-90': route.name == 'trophies-ranking-time-attack',
            }"
          ></Icon>
        </div>
      </NuxtLink>

      <NuxtLink
        :to="{
          path: '/trophies/ranking/recent',
          query: { ...route.query, page: 1 },
        }"
      >
        <div class="flex gap-3 items-center justify-between border p-2 rounded-md">
          <div class="flex gap-3 items-center">
            <img src="https://i.psray.net/i/2024/08/21/66c541bd44283.png" class="w-8 h-8" />
            <span class="font-bold"> {{ $t('trophies.ranking.recent_players') }}</span>
          </div>
          <Icon
            name="material-symbols:arrow-right-alt-rounded"
            class="text-2xl hover:translate-x-1 transition-transform"
            :class="{ 'rotate-90': route.name == 'trophies-ranking-recent' }"
          ></Icon>
        </div>
      </NuxtLink>
    </div>
    <div class="mt-5">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
</script>
