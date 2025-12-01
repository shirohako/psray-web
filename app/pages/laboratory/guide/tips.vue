<template>
  <div class="max-w-screen-lg mx-auto p-4">
    <div
      class="community-top-block bg-white w-full px-6 lg:px-10 py-8 rounded-2xl shadow-md flex flex-col relative"
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
            <img src="https://i.psray.net/i/2024/09/17/66e97c0040593.png" class="size-4" />
            <span class="leading-relaxed">奖杯Tips</span>
          </div>
        </NuxtLink>
      </div>
      <div class="flex gap-5 mt-5 items-center">
        <img src="https://i.psray.net/i/2024/09/17/66e97c0040593.png" class="size-10" />
        <div>
          <h2 class="text-xl font-bold">奖杯Tips</h2>
          <p class="text-sm text-gray-600">零门槛写攻略，一句话也能帮到大家</p>
        </div>
      </div>
      <div class="mt-3">
        <h2 class="text-lg font-bold my-2">功能特点</h2>
        <ul class="list-disc list-inside">
          <li class="text-sm text-gray-600 hover:text-gray-900">
            为了降低游戏攻略创作难度，奖杯Tips针对单个奖杯和成就进行创作分享
          </li>
          <li class="text-sm text-gray-600 hover:text-gray-900">
            一言也可以，与传统攻略创作相比更加灵活简单
          </li>
          <li class="text-sm text-gray-600 hover:text-gray-900">
            将白金流程拆分各个拼图，不需要考虑完整性，随时随心创作
          </li>
        </ul>
      </div>
      <div class="mt-3">
        <h2 class="text-lg font-bold my-2">可以获得的社区奖励</h2>
        <p class="text-sm text-gray-600">删除发布的内容后，奖励会被回收</p>
        <div class="flex flex-col">
          <div class="mt-3 overflow-x-auto">
            <div class="min-w-full inline-block align-middle">
              <div class="overflow-hidden">
                <table class="divide-y divide-gray-200 table-fixed border rounded-md">
                  <tbody>
                    <tr class="odd:bg-white even:bg-gray-100">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        发布奖杯Tips
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                      >
                        <img
                          src="https://i.psray.net/i/2024/07/17/6696acf994b94.png"
                          class="size-5"
                        />
                        <span class="font-bold">5</span>
                      </td>
                    </tr>

                    <tr class="odd:bg-white even:bg-gray-100">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        获得他人点赞时
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                      >
                        <img
                          src="https://i.psray.net/i/2024/07/17/6696afa80d3c4.png"
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
      <div class="mt-3">
        <h2 class="text-lg font-bold my-2">最近发布的内容</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          <div
            v-for="tip in data['recent-tips']"
            class="p-1.5 flex justify-between items-center border rounded-md"
          >
            <div class="flex items-center gap-2">
              <img :src="tip.trophy.trophyIconUrl" class="size-14 mx-3" />
              <div class="flex flex-col gap-0.5">
                <div class="font-medium">
                  <NuxtLink :to="{ name: 'trophy', params: { id: tip.trophy.id } }">
                    {{ tip.trophy.trophyName }}
                  </NuxtLink>
                </div>
                <div class="flex flex-col -mt-0.5">
                  <div class="flex items-center gap-1">
                    <Icon
                      name="material-symbols:account-circle"
                      class="text-base text-indigo-400"
                    ></Icon>
                    <span class="text-sm">
                      {{ tip.user.psnid }}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-1">
                    <Icon name="ic:outline-update" class="text-base text-blue-400"></Icon>
                    <span class="text-xs text-gray-800">
                      {{ format(fromUnixTime(tip.created_at), 'MM-dd HH:mm') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mt-3">
        <h2 class="text-lg font-bold my-2">发布排行榜 (本月)</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          <div
            v-for="(rankedUser, index) in data['tip-ranking-month']"
            class="flex items-center px-1 py-2"
          >
            <div class="w-12 text-center">
              <span class="px-2 py-1 bg-gray-100 rounded-lg">
                {{ ++index }}
              </span>
            </div>
            <div class="flex flex-1 items-center gap-2">
              <img :src="rankedUser.user.avatarUrl" class="size-8 rounded-full" />
              <NuxtLink
                :to="{
                  name: 'player-profile',
                  params: { psnid: rankedUser.user.psnid },
                }"
              >
                <span class="font-medium">{{ rankedUser.user.psnid }}</span>
              </NuxtLink>
            </div>
            <div class="flex flex-1 items-center justify-end gap-2">
              <span class="w-10 font-bold text-base text-right">{{ rankedUser.total }}</span>
              <img src="https://i.psray.net/i/2024/09/17/66e97c0040593.png" class="size-6" />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-3">
        <h2 class="text-lg font-bold my-2">发布排行榜</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          <div
            v-for="(rankedUser, index) in data['tip-ranking-anytime']"
            class="flex items-center px-1 py-2"
          >
            <div class="w-12 text-center">
              <span class="px-2 py-1 bg-gray-100 rounded-lg">
                {{ ++index }}
              </span>
            </div>
            <div class="flex flex-1 items-center gap-2">
              <img :src="rankedUser.user.avatarUrl" class="size-8 rounded-full" />
              <NuxtLink
                :to="{
                  name: 'player-profile',
                  params: { psnid: rankedUser.user.psnid },
                }"
              >
                <span class="font-medium">{{ rankedUser.user.psnid }}</span>
              </NuxtLink>
            </div>
            <div class="flex flex-1 items-center justify-end gap-2">
              <span class="w-10 font-bold text-base text-right">{{ rankedUser.total }}</span>
              <img src="https://i.psray.net/i/2024/09/17/66e97c0040593.png" class="size-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';

const api = useApi();

const { data, error, refresh } = await useAsyncData('tip-overview', fetchData);

async function fetchData() {
  const res = await api.get(`/laboratory/guide/tips`);
  return res.data;
}
</script>
