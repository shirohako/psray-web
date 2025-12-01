<template>
  <div class="max-w-screen-lg mx-auto p-4">
    <div
      class="community-top-block bg-white w-full px-10 py-8 rounded-2xl shadow-md flex flex-col relative"
    >
      <!-- 导航面包屑 -->
      <div class="mb-2 flex flex-row items-center text-sm gap-0.5">
        <NuxtLink to="/" class="text-gray-600 hover:text-gray-950">
          <div class="flex items-center gap-0.5">
            <Icon name="material-symbols:home-outline" class="text-base text-cyan-600" />
            <span class="leading-relaxed">主页</span>
          </div>
        </NuxtLink>
        <Icon name="material-symbols:chevron-right" class="text-lg text-gray-400" />
        <NuxtLink to="/laboratory" class="text-gray-600 hover:text-gray-950">
          <div class="flex items-center gap-0.5">
            <Icon name="ph:flask" class="text-base text-blue-500" />
            <span class="leading-relaxed">社区实验室</span>
          </div>
        </NuxtLink>

        <Icon name="material-symbols:chevron-right" class="text-lg text-gray-400" />
        <NuxtLink to="#" class="text-gray-600 hover:text-gray-950">
          <div class="flex items-center gap-0.5">
            <Icon name="ph:star-fill" class="text-base text-orange-400" />
            <span class="leading-relaxed">米拉</span>
          </div>
        </NuxtLink>
      </div>
      <h2 class="text-2xl font-bold mt-4">社区奖励</h2>
      <div class="flex gap-5 mt-5 items-center">
        <img src="https://i.psray.net/i/2024/08/02/66ac244902d7c.png" class="size-10" />
        <div>
          <h2 class="text-lg font-bold">米拉</h2>
          <p class="text-sm text-gray-600">
            塞姆里亚大陆的通用货币。不知为何，也可以在这里流通使用
          </p>
        </div>
      </div>
      <div class="mt-5">
        <div class="text-lg font-bold my-2 flex items-center gap-2">
          <Icon name="ph:star-fill" class="text-base text-orange-400" />
          <span>米拉获取方式</span>
        </div>
        <div class="flex flex-col">
          <div class="-m-1.5 overflow-x-auto">
            <div class="p-1.5 min-w-full inline-block align-middle">
              <div class="overflow-hidden">
                <table class="divide-y divide-gray-200 table-fixed">
                  <thead>
                    <tr class="font-bold text-base text-gray-800">
                      <th class="px-6 py-3 text-start uppercase">行为</th>
                      <th class="px-6 py-3 text-start uppercase min-w-28">奖励数量</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="odd:bg-white even:bg-gray-100">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        右下角悬浮按钮的每日签到
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                      >
                        <img
                          src="https://i.psray.net/i/2024/08/02/66ac244902d7c.png"
                          class="size-5"
                        />
                        <span class="font-bold">1</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-5">
        <div class="text-lg font-bold my-2 flex items-center gap-2">
          <Icon name="ph:star-fill" class="text-base text-orange-400" />
          <span>持有米拉排行榜</span>
        </div>
        <div class="flex flex-col max-w-screen-sm w-full">
          <div v-for="(rankedUser, index) in data" class="flex items-center px-1 py-2">
            <div class="w-12 text-center">
              <span class="px-2 py-1 bg-gray-100 rounded-lg">{{ ++index }}</span>
            </div>
            <div class="flex flex-1 items-center gap-2">
              <img :src="rankedUser.avatarUrl" class="w-8 h-18 rounded-full" />
              <NuxtLink
                :to="{
                  name: 'player-profile',
                  params: { psnid: rankedUser.psnid },
                }"
              >
                <span class="font-medium">{{ rankedUser.psnid }}</span>
              </NuxtLink>
            </div>
            <div class="flex flex-1 justify-end gap-5">
              <div class="flex items-center gap-3">
                <img src="https://i.psray.net/i/2024/08/02/66ac244902d7c.png" class="size-6" />
                <span class="w-10">{{ rankedUser.mira }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const api = useApi();

const rage = ref({ label: '全时期', value: 'all' });
const rageOptions = ref([{ label: '全时期', value: 'all' }]);

const { data, error, refresh } = await useAsyncData('mira-ranking', fetchData, {
  watch: [rage],
});

async function fetchData() {
  const res = await api.get(`/laboratory/rewards/mira`, {
    params: {
      gap: rage.value.value,
    },
  });
  return res.data;
}
</script>
