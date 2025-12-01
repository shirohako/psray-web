<template>
  <div class="max-w-screen-xl mx-auto py-4 px-6">
    <div class="border p-5 rounded-md flex flex-col lg:flex-row justify-between">
      <div>
        <!-- 导航 -->
        <nav class="flex" aria-label="Breadcrumb">
          <ol class="inline-flex items-center flex-wrap gap-2 md:space-x-2 rtl:space-x-reverse">
            <li class="inline-flex items-center">
              <a
                href="/"
                class="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              >
                <Icon
                  name="material-symbols:home-outline-rounded"
                  class="text-gray-700 text-base"
                />
                <span>Home</span>
              </a>
            </li>
            <li>
              <div class="flex items-center">
                <Icon name="material-symbols:chevron-right" class="text-xl text-gray-500" />
                <a
                  href="/laboratory"
                  class="flex items-center gap-1 ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
                >
                  <Icon name="ph:flask"></Icon>
                  <span>社区实验室</span>
                </a>
              </div>
            </li>
            <li>
              <div class="flex items-center">
                <Icon name="material-symbols:chevron-right" class="text-xl text-gray-500" />
                <NuxtLink
                  :to="{
                    name: 'trophies-detail',
                    params: { id: route.params.id },
                  }"
                  class="flex items-center gap-1 ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
                >
                  <Icon name="material-symbols:trophy-outline"></Icon>
                  <span>奖杯组 (#{{ route.params.id }})</span>
                </NuxtLink>
              </div>
            </li>
            <li>
              <div class="flex items-center">
                <Icon name="material-symbols:chevron-right" class="text-xl text-gray-500" />
                <NuxtLink
                  :to="`/laboratory/contributions/trophies/${route.params.id}`"
                  class="flex items-center gap-1 ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
                >
                  <Icon name="material-symbols:note-alt-outline"></Icon>
                  <span>编辑奖杯组</span>
                </NuxtLink>
              </div>
            </li>
          </ol>
        </nav>
        <h2 class="text-xl font-bold my-2">编辑奖杯组</h2>
        <img :src="trophySet.trophyTitleIconUrl" class="mx-auto h-24 my-5 visible lg:hidden" />
        <div class="font-medium flex items-center mb-2">
          <span class="relative inline-flex align-middle h-3 w-3 mr-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-300"></span>
          </span>
          <span>正在编辑：{{ trophySet.trophyTitleName }}</span>
        </div>
        <div class="flex mb-1 text-sm ml-1.5">
          <span>关联状态：</span>
          <div class="flex items-center mr-3">
            <Icon
              name="lets-icons:done-ring-round-duotone-line"
              class="mr-2 shrink-0"
              :class="[game ? 'text-green-400' : 'text-red-400']"
            />
            游戏
          </div>
          <div class="flex items-center mr-3">
            <Icon
              name="lets-icons:done-ring-round-duotone-line"
              class="mr-2 shrink-0"
              :class="[series ? 'text-green-400' : 'text-red-400']"
            />
            系列
          </div>
          <div class="flex items-center">
            <Icon
              name="lets-icons:done-ring-round-duotone-line"
              class="mr-2 shrink-0"
              :class="[trophySet.region ? 'text-green-400' : 'text-red-400']"
            />
            版本标签
          </div>
        </div>
        <p class="text-sm ml-1.5">
          更新时间：{{ format(fromUnixTime(trophySet.updated_at), 'yyyy-MM-dd HH:mm:ss') }}
        </p>
        <p class="text-sm mt-2">部分灰色的功能尚未实现</p>
      </div>
      <img :src="trophySet.trophyTitleIconUrl" class="h-24 hidden lg:inline-block" />
    </div>
    <!-- 游戏 -->
    <div class="grid lg:grid-cols-4 gap-4 mt-5">
      <div class="box p-5 flex flex-col col-span-4 lg:col-span-1">
        <p class="text-center">关联的游戏</p>
        <div class="text-center grow flex justify-center items-center">
          <p class="font-bold text-lg" v-if="game">已关联</p>
          <p class="font-bold text-lg" v-else>未关联</p>
        </div>
      </div>
      <div class="box col-span-4 lg:col-span-3 p-5 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div class="border rounded-md px-6 py-5">
          <NuxtLink
            class="flex items-center gap-6"
            :to="`/laboratory/contributions/trophies/relation?id=${route.params.id}`"
          >
            <img src="https://i.psray.net/i/2024/08/02/66ac046319f07.png" class="w-16 h-16" />
            <div>
              <h3 class="text-xl font-bold leading-6">更改关联游戏</h3>
              <p class="mt-1 text-base">将这个奖杯组和一个游戏绑定</p>
            </div>
          </NuxtLink>
        </div>
        <div class="border rounded-md px-6 py-5 flex items-center gap-6 grayscale">
          <img src="https://i.psray.net/i/2024/08/02/66ac04b05fcb2.png" class="w-16 h-16" />
          <div>
            <h3 class="text-xl font-bold leading-6">报错</h3>
            <p class="my-2">反馈问题(今后计划合并到论坛功能内)</p>
          </div>
        </div>
        <div class="border rounded-md px-6 py-5">
          <NuxtLink
            class="flex items-center gap-6"
            :to="`/laboratory/contributions/trophies/region?id=${route.params.id}`"
          >
            <img src="https://i.psray.net/i/2024/08/02/66ac0aafe7612.png" class="w-16 h-16" />
            <div>
              <h3 class="text-xl font-bold leading-6">标记奖杯组地区版本</h3>
              <p class="mt-1 text-base">标记奖杯组地区或版本信息</p>
            </div>
          </NuxtLink>
        </div>
        <div class="border rounded-md px-6 py-5 flex items-center gap-6 grayscale">
          <!-- <NuxtLink
            class="flex items-center gap-6"
            :to="`/laboratory/wiki/changes?resource=trophies&resourceId=${route.params.id}`"
          > -->
          <img src="https://i.psray.net/i/2024/08/29/66d042fedbfdc.png" class="w-16 h-16" />
          <div>
            <h3 class="text-xl font-bold leading-6">提交奖杯组翻译</h3>
            <p class="my-2">可以非官网的翻译奖杯组，或是自己翻译</p>
          </div>
          <!-- </NuxtLink> -->
        </div>
        <div
          class="border rounded-md px-6 py-5 flex items-center gap-6 cursor-pointer"
          @click="playthrough"
        >
          <img src="https://i.psray.net/i/2024/08/29/66d043f491c3a.png" class="w-16 h-16" />
          <div>
            <h3 class="text-xl font-bold leading-6">标记时间和难度</h3>
            <p class="my-2">可以为奖杯组标记通关时间，全收集时间，评定难度</p>
          </div>
        </div>
        <div class="border rounded-md px-6 py-5 flex items-center gap-6 grayscale">
          <!-- <NuxtLink
            class="flex items-center gap-6"
            :to="`/laboratory/wiki/changes?resource=trophies&resourceId=${route.params.id}`"
          > -->
          <img src="https://i.psray.net/i/2024/08/29/66d09163c830a.png" class="w-16 h-16" />
          <div>
            <h3 class="text-xl font-bold leading-6">标记PS4/5版本存档通用性</h3>
            <p class="my-2">标记奖杯组是否可以从PS4上传存到PS5，是否可以秒白</p>
          </div>
          <!-- </NuxtLink> -->
        </div>
        <div class="border rounded-md px-6 py-5 flex items-center gap-6 grayscale">
          <!-- <NuxtLink
            class="flex items-center gap-6"
            :to="`/laboratory/wiki/changes?resource=trophies&resourceId=${route.params.id}`"
          > -->
          <img src="https://i.psray.net/i/2024/08/29/66d04563d26b5.png" class="w-16 h-16" />
          <div>
            <h3 class="text-xl font-bold leading-6">标记BUG和无法获得的奖杯</h3>
            <p class="my-2">
              标记因为更新或服务器关闭，导致的永久不可获取的奖杯。或是奖杯触发存在BUG
            </p>
          </div>
          <!-- </NuxtLink> -->
        </div>
        <div class="border rounded-md px-6 py-5 flex items-center gap-6">
          <NuxtLink
            class="flex items-center gap-6"
            :to="`/laboratory/wiki/changes?resource=trophies&resourceId=${route.params.id}`"
          >
            <img src="https://i.psray.net/i/2024/08/02/66ac0e8998a56.png" class="w-16 h-16" />
            <div>
              <h3 class="text-xl font-bold leading-6">提交记录</h3>
              <p class="my-2">查看该奖杯组关联变动历史</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
    <!-- 系列 -->
    <div class="grid grid-cols-4 gap-4 mt-5">
      <div class="box p-5 flex flex-col col-span-4 lg:col-span-1">
        <p class="text-center">关联的系列</p>
        <div class="text-center grow flex justify-center items-center">
          <p class="font-bold text-lg" v-if="series">已关联</p>
          <p class="font-bold text-lg" v-else>未关联</p>
        </div>
      </div>
      <div class="box col-span-4 lg:col-span-3 p-5 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div class="border rounded-md px-6 py-5 flex items-center gap-6 grayscale">
          <img src="https://i.psray.net/i/2024/08/02/66ac0dff555b9.png" class="w-16 h-16" />
          <div>
            <h3 class="text-xl font-bold leading-6">更改关联系列</h3>
            <p class="mt-1 text-base">将这个奖杯组和一个游戏系列绑定</p>
          </div>
        </div>
        <div class="border rounded-md px-6 py-5 flex items-center gap-6 grayscale">
          <img src="https://i.psray.net/i/2024/08/02/66ac04b05fcb2.png" class="w-16 h-16" />
          <div>
            <h3 class="text-xl font-bold leading-6">报错</h3>
            <p class="my-2">反馈问题(今后计划合并到论坛功能内)</p>
          </div>
        </div>
        <div class="border rounded-md px-6 py-5 flex items-center gap-6 grayscale">
          <img src="https://i.psray.net/i/2024/08/02/66ac0e8998a56.png" class="w-16 h-16" />
          <div>
            <h3 class="text-xl font-bold leading-6">关联记录</h3>
            <p class="my-2">查看该奖杯组关联变动历史</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';

const route = useRoute();
const router = useRouter();
const api = useApi();
const toast = useToast();

const { data, error, refresh } = await useAsyncData('trophy-set-relation', fetchTrophySet);

async function fetchTrophySet() {
  const res = await api.get(`/trophies/get/${route.params.id}`);
  return res.data;
}

const trophySet = toRef(data.value, 'trophyTitle');
const game = toRef(data.value, 'game');
const series = toRef(data.value, 'series');

function playthrough() {
  if (game.value) {
    router.push(`/laboratory/contributions/trophies/playthroughs?id=${route.params.id}`);
  } else {
    toast.add({
      severity: 'error',
      summary: '尚未关联游戏',
      detail: '使用此功能前，请先将奖杯组关联一个游戏',
      life: 3000,
    });
  }
}
</script>

<style>
.box {
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
  border-radius: 6px;
}
</style>
