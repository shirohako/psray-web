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
            <img src="https://i.psray.net/i/2023/09/04/64f4f2613f72f.png" class="size-4" />
            <span class="leading-relaxed">游戏资料库</span>
          </div>
        </NuxtLink>
      </div>
      <div class="flex gap-5 mt-5 items-center">
        <img src="https://i.psray.net/i/2023/09/04/64f4f2613f72f.png" class="size-10" />
        <div>
          <h2 class="text-xl font-bold">游戏资料库</h2>
          <p class="text-sm text-gray-600">任何人都可以编辑完善的数据库</p>
        </div>
      </div>
      <div class="mt-3">
        <h2 class="text-lg font-bold my-2">功能特点</h2>
        <ul class="list-disc list-inside">
          <li class="text-sm text-gray-600 hover:text-gray-900">
            由于PSN一个游戏会有多套奖杯，可以在PSRay把多套奖杯组关联到一个游戏上
          </li>
          <li class="text-sm text-gray-600 hover:text-gray-900">
            将多套奖杯组添加标签。标记它们发行商和地区
          </li>
          <li class="text-sm text-gray-400">[未完成] 可以非官网的翻译奖杯组，或是自己翻译</li>
          <li class="text-sm text-gray-600 hover:text-gray-900">
            可以为奖杯组标记通关时间，全收集时间，评定难度
          </li>
          <li class="text-sm text-gray-400">
            [未完成] 标记奖杯组是否可以从PS4上传存到PS5，是否可以立即获得奖杯
          </li>
          <li class="text-sm text-gray-400">
            [未完成] 标记因为更新或服务器关闭，导致的永久不可获取的奖杯。或是奖杯触发存在BUG
          </li>
          <li class="text-sm text-gray-600 hover:text-gray-900">将会提供更多友善的功能</li>
        </ul>
      </div>
      <div class="mt-3">
        <h2 class="text-lg font-bold my-2">可以获得的社区奖励</h2>
        <p class="text-sm text-gray-600">
          部分提交的编辑，会覆盖之前的数据。这会需要一点时间来审核
        </p>
        <div class="flex flex-col">
          <div class="mt-3 overflow-x-auto">
            <div class="min-w-full inline-block align-middle">
              <div class="overflow-hidden">
                <table class="divide-y divide-gray-200 table-fixed border rounded-md">
                  <tbody>
                    <tr class="odd:bg-white even:bg-gray-100">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        将奖杯组关联到游戏
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                      >
                        <img
                          src="https://i.psray.net/i/2024/08/02/66ac21691a054.png"
                          class="size-5"
                        />
                        <span class="font-bold">1</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        需审核 (数据覆盖)
                      </td>
                    </tr>
                    <tr class="odd:bg-white even:bg-gray-100">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        标记奖杯组地区版本
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                      >
                        <img
                          src="https://i.psray.net/i/2024/08/02/66ac21691a054.png"
                          class="size-5"
                        />
                        <span class="font-bold">1</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        需审核 (数据覆盖)
                      </td>
                    </tr>

                    <tr class="odd:bg-white even:bg-gray-100">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        标记奖杯组时间和难度
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-gray-800 flex items-center gap-2"
                      >
                        <img
                          src="https://i.psray.net/i/2024/07/17/6696acf994b94.png"
                          class="size-5"
                        />
                        <span class="font-bold">1</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        无需审核 (计算平均值)
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
        <h2 class="text-lg font-bold my-2">游戏资料库贡献排行榜 (本月)</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          <div
            v-for="(rankedUser, index) in data['contribution-month']"
            class="flex items-center px-1 py-2"
          >
            <div class="w-12 text-center">
              <span class="px-2 py-1 bg-gray-100 rounded-lg">
                {{ ++index }}
              </span>
            </div>
            <div class="flex flex-1 items-center gap-2">
              <img :src="rankedUser.avatarUrl" class="size-8 rounded-full" />
              <NuxtLink
                :to="{
                  name: 'player-profile',
                  params: { psnid: rankedUser.psnid },
                }"
              >
                <span class="font-medium">{{ rankedUser.psnid }}</span>
              </NuxtLink>
            </div>
            <div class="flex flex-1 items-center justify-end gap-2">
              <span class="w-10 font-bold text-base text-right">
                {{ rankedUser.total }}
              </span>
              <img src="https://i.psray.net/i/2024/09/20/66eca1e5500c4.png" class="size-6" />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-3">
        <h2 class="text-lg font-bold my-2">游戏资料库贡献排行榜</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          <div
            v-for="(rankedUser, index) in data['contribution-anytime']"
            class="flex items-center px-1 py-2"
          >
            <div class="w-12 text-center">
              <span class="px-2 py-1 bg-gray-100 rounded-lg">
                {{ ++index }}
              </span>
            </div>
            <div class="flex flex-1 items-center gap-2">
              <img :src="rankedUser.avatarUrl" class="size-8 rounded-full" />
              <NuxtLink
                :to="{
                  name: 'player-profile',
                  params: { psnid: rankedUser.psnid },
                }"
              >
                <span class="font-medium">{{ rankedUser.psnid }}</span>
              </NuxtLink>
            </div>
            <div class="flex flex-1 items-center justify-end gap-2">
              <span class="w-10 font-bold text-base text-right">
                {{ rankedUser.total }}
              </span>
              <img src="https://i.psray.net/i/2024/09/20/66eca1e5500c4.png" class="size-6" />
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

const { data, error, refresh } = await useAsyncData('contribution-overview', fetchData);

async function fetchData() {
  const res = await api.get(`/laboratory/db/contribution`);
  return res.data;
}
</script>
