<template>
  <div class="max-w-screen-2xl mx-auto py-4 px-6">
    <div class="flex flex-row flex-wrap lg:flex-nowrap gap-5 items-start">
      <!-- 左侧 -->
      <div class="basis-full lg:basis-4/12 border rounded-md shadow-lg p-6 max-w-full">
        <!-- 奖杯基本资料 -->
        <BaseInfo :trophySet="data.trophyTitle" :trophyTitle="trophyTitle" />
        <!-- 奖杯地区标签 -->
        <RegionTags :trophySet="data.trophyTitle" />
        <!-- 游戏资料 -->
        <TrophiesGameInfo :game="data.game" v-if="data.game" />
        <!-- 不同地区/平台 -->
        <SimilarTrophies
          :similarTrophies="data.similarTrophies"
          v-if="data.similarTrophies?.length > 0"
        />
        <!-- 奖杯排行 -->
        <TrophiesPlayerRanking />
        <!-- 编辑可能提示 -->
        <Contribute />
        <!-- 耗时 -->
        <TrophiesHowLongToBeat :game="data.game" v-if="data.game" class="mt-8" />

        <!-- 近期玩家 -->
        <RecentPlayers :recentPlayers="data.recentPlayers" v-if="data.recentPlayers?.length > 0" />
      </div>
      <!-- 右侧 -->
      <div class="basis-full lg:basis-8/12 border rounded-md shadow-lg p-3">
        <!-- 奖杯统计 -->
        <div class="p-4">
          <div class="flex items-center mb-4">
            <img
              src="https://i.psray.net/i/2023/09/10/64fda3a2c3d9a.png"
              class="mr-3"
              style="width: 28px"
            />
            <span class="text-lg font-medium">{{ $t('trophies.statistics') }}</span>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-5 gap-2">
            <div class="flex justify-between items-center border rounded-md p-3">
              <img
                src="https://i.psray.net/i/2023/09/08/64fa0fcc62402.png"
                style="width: 40px; height: 40px"
              />
              <div class="text-right">
                <div class="text-xl font-medium">
                  {{ trophySet.owners }}
                </div>
                <div class="text-xs">
                  {{ $t('trophies.played') }}
                </div>
              </div>
            </div>
            <div class="flex justify-between items-center border rounded-md p-3">
              <img class="size-10" :src="getTrophyIcon('platinum')" />
              <div class="text-right">
                <div class="text-xl font-medium">
                  {{ trophySet.platinum_achievers }}
                </div>
                <div class="text-xs">
                  {{ $t('trophies.platinum_achievers') }}
                </div>
              </div>
            </div>
            <div class="flex justify-between items-center border rounded-md p-3">
              <img
                src="https://i.psray.net/i/2023/09/08/64fa0f1dd3813.png"
                style="width: 40px; height: 40px"
              />
              <div class="text-right">
                <div class="text-xl font-medium">
                  {{ trophySet.completed_players }}
                </div>
                <div class="text-xs">
                  {{ $t('trophies.completed_players') }}
                </div>
              </div>
            </div>
            <div class="flex justify-between items-center border rounded-md p-3">
              <img
                src="https://i.psray.net/i/2023/09/08/64fa11b74f1a8.png"
                style="width: 40px; height: 40px"
              />
              <div class="text-right">
                <div class="text-xl font-medium">
                  {{ trophySet.recent_players }}
                </div>
                <div class="text-xs">
                  {{ $t('trophies.recent_players') }}
                </div>
              </div>
            </div>
            <div class="flex justify-between items-center border rounded-md p-3">
              <img
                src="https://i.psray.net/i/2023/09/08/64fa11b820c39.png"
                style="width: 40px; height: 40px"
              />
              <div class="text-right">
                <div class="text-xl font-medium text-right">{{ trophySet.average_progress }}%</div>
                <div class="text-xs">{{ $t('trophies.average_progress') }}</div>
              </div>
            </div>
          </div>
        </div>
        <!-- 用户进度 -->
        <div class="p-4" v-if="trackedUser?.trophySummary">
          <!-- 标题 -->
          <div class="flex items-center mb-4">
            <img
              src="https://i.psray.net/i/2024/06/29/667f01bb48c70.png"
              class="mr-3"
              style="width: 28px"
            />
            <span class="text-lg font-medium">{{ $t('trophies.player_trophy_status') }}</span>
          </div>
          <!-- 总进度和时间 -->
          <div class="flex flex-col lg:flex-row justify-center items-center mb-5">
            <div class="flex flex-col justify-center items-center">
              <Knob v-model="trackedUser.trophySummary.progress" />
            </div>
            <div class="px-10">
              <!-- 头像和ID -->
              <div class="mb-4 text-center">
                <NuxtLink
                  class="inline-flex justify-center items-center"
                  :to="{
                    name: 'player-profile',
                    params: { psnid: trackedUser.profile.psnid },
                  }"
                >
                  <img :src="trackedUser.profile.avatarUrl" class="w-8 h-8 rounded-full mr-2" />
                  <span class="text-lg font-medium">
                    {{ trackedUser.profile.psnid }}
                  </span>
                </NuxtLink>
              </div>

              <!-- 开坑时间 -->
              <div class="flex items-center flex-wrap mb-2 justify-center lg:justify-start">
                <div class="w-32 inline-flex flex-nowrap items-center">
                  <div
                    class="bg-blue-100 px-1 py-1.5 rounded-lg inline-flex flex-nowrap items-center mr-2"
                  >
                    <Icon name="material-symbols:start-rounded" class="text-blue-600" />
                  </div>
                  <span>{{ $t('trophies.first_trophy') }}:</span>
                </div>
                <span>
                  {{
                    trackedUser?.trophySummary.first_earned_at
                      ? formatISO9075(fromUnixTime(trackedUser?.trophySummary.first_earned_at))
                      : '无数据'
                  }}
                </span>
              </div>
              <!-- 最后更新 -->
              <div class="flex items-center flex-wrap mb-2 justify-center lg:justify-start">
                <div class="w-32 inline-flex flex-nowrap items-center">
                  <div
                    class="bg-green-100 px-1 py-1.5 rounded-lg inline-flex flex-nowrap items-center mr-2"
                  >
                    <Icon name="material-symbols:line-end-circle" class="text-green-600" />
                  </div>
                  <span>{{ $t('trophies.last_trophy') }}:</span>
                </div>
                <span>
                  {{ formatISO9075(fromUnixTime(trackedUser?.trophySummary.last_updated_at)) }}
                </span>
              </div>
              <!-- 用时 -->
              <div class="flex items-center flex-wrap mb-2 justify-center lg:justify-start">
                <div class="w-32 inline-flex flex-nowrap items-center">
                  <div
                    class="bg-purple-100 px-1 py-1.5 rounded-lg inline-flex flex-nowrap items-center mr-2"
                  >
                    <Icon name="mdi:skip-next-circle-outline" class="text-purple-600" />
                  </div>
                  <span>{{ $t('trophies.duration') }}:</span>
                </div>
                <span class="text-center">
                  {{
                    trackedUser.trophySummary.gap > 0
                      ? formatDuration(
                          intervalToDuration({
                            start: 0,
                            end: trackedUser.trophySummary.gap * 1000,
                          }),
                          { delimiter: ', ', locale: zhCN },
                        )
                      : '无数据'
                  }}</span
                >
              </div>
            </div>
          </div>
          <!-- 已获得和未获得的奖杯 -->
          <div>
            <!-- 已获得奖杯 -->
            <div
              class="flex flex-col lg:flex-row px-3 py-3 my-3 bg-gray-100 rounded-lg items-center"
            >
              <span class="min-w-28 mr-3">{{ $t('trophies.earned_trophies') }}:</span>
              <div class="flex items-center gap-3">
                <div class="flex gap-1 items-center">
                  <img class="size-6" :src="getTrophyIcon('platinum')" />
                  <span class="text-base">
                    {{ trackedUser.trophySummary.earned_platinum }}
                  </span>
                </div>
                <div class="flex gap-1 items-center">
                  <img class="size-6" :src="getTrophyIcon('gold')" />
                  <span class="text-base">
                    {{ trackedUser.trophySummary.earned_gold }}
                  </span>
                </div>
                <div class="flex gap-1 items-center">
                  <img class="size-6" :src="getTrophyIcon('silver')" />
                  <span class="text-base">
                    {{ trackedUser.trophySummary.earned_silver }}
                  </span>
                </div>
                <div class="flex gap-1 items-center">
                  <img class="size-6" :src="getTrophyIcon('bronze')" />
                  <span class="text-base">
                    {{ trackedUser.trophySummary.earned_bronze }}
                  </span>
                </div>
              </div>
            </div>
            <!-- 已获得的奖杯图标 -->
            <div class="flex flex-wrap gap-2 justify-center px-1">
              <div v-for="[trophyId, trophy] in earnedTrophies.entries()">
                <img :src="trophy.trophyIconUrl" class="w-8 h-8 rounded-lg" />
              </div>
            </div>
            <!-- 尚未获得 -->
            <div
              class="flex flex-col lg:flex-row px-3 py-3 my-3 bg-gray-100 rounded-lg mt-4 items-center"
            >
              <span class="min-w-28 mr-3">{{ $t('trophies.unearned_trophies') }}:</span>
              <div class="flex items-center gap-3">
                <div class="flex gap-1 items-center">
                  <img class="size-6" :src="getTrophyIcon('platinum')" />
                  <span class="text-base">
                    {{
                      trophySet.definedTrophies.platinum - trackedUser.trophySummary.earned_platinum
                    }}
                  </span>
                </div>
                <div class="flex gap-1 items-center">
                  <img class="size-6" :src="getTrophyIcon('gold')" />
                  <span class="text-base">
                    {{ trophySet.definedTrophies.gold - trackedUser.trophySummary.earned_gold }}
                  </span>
                </div>
                <div class="flex gap-1 items-center">
                  <img class="size-6" :src="getTrophyIcon('silver')" />
                  <span class="text-base">
                    {{ trophySet.definedTrophies.silver - trackedUser.trophySummary.earned_silver }}
                  </span>
                </div>
                <div class="flex gap-1 items-center">
                  <img class="size-6" :src="getTrophyIcon('bronze')" />
                  <span class="text-base">
                    {{ trophySet.definedTrophies.bronze - trackedUser.trophySummary.earned_bronze }}
                  </span>
                </div>
              </div>
            </div>
            <!-- 未获得的奖杯图标 -->
            <div class="flex flex-wrap gap-2 justify-center px-1">
              <div v-for="trophy in unearnedTrophies">
                <img :src="trophy.trophyIconUrl" class="w-8 h-8 grayscale rounded-lg" />
              </div>
            </div>
          </div>
        </div>
        <!-- 翻译 -->
        <div class="p-4" v-if="trophySet?.default_language">
          <div class="flex items-center mb-4">
            <img
              src="https://i.psray.net/i/2023/09/10/64fda1d94ba7e.png"
              class="mr-3"
              style="width: 28px"
            />
            <span class="text-lg font-medium">{{ $t('trophies.translations') }}</span>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <label
              :class="[
                {
                  'ring-2 ring-indigo-500': language == trophySet.default_language,
                },
              ]"
              class="flex items-center justify-center rounded-md border py-3 px-4 text-sm font-medium hover:bg-gray-50 focus:outline-none cursor-pointer text-gray-900 shadow-sm"
              @click="defaultTrophyLanguage"
            >
              <span>{{ trophySet.language.native_name }}</span>
            </label>

            <label
              :class="[
                {
                  'ring-2 ring-indigo-500': language == translate.language_code,
                },
              ]"
              class="text-center flex items-center justify-center rounded-md border py-2 px-3 text-sm font-medium hover:bg-gray-50 focus:outline-none cursor-pointer text-gray-900 shadow-sm"
              @click="changeTrophyLanguage(translate)"
              v-for="translate in trophySet.languages"
            >
              <span>{{ translate.languageTag.native_name }}</span>
            </label>
          </div>
        </div>
        <!-- 奖杯 -->
        <div v-for="trophyGroup in trophyGroups">
          <div class="p-4 mt-2">
            <div class="flex items-center mb-4">
              <img
                src="https://i.psray.net/i/2023/09/10/64fda2bd068aa.png"
                class="mr-3"
                style="width: 28px"
              />
              <h2 class="text-lg font-medium">
                {{ trophyGroup.trophyTitleName }}
              </h2>
            </div>

            <TrophiesGroup
              :trophies="trophyGroup.trophyList"
              :translation="data.trophyTranslation"
              :earnedTrophies="earnedTrophies"
            ></TrophiesGroup>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { format, formatISO9075, fromUnixTime, formatDuration, intervalToDuration } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const userStore = useUserStore();
const { authenticated } = storeToRefs(userStore);

import BaseInfo from '~/components/trophies/BaseInfo.vue';
import Contribute from '~/components/trophies/Contribute.vue';
import RecentPlayers from '~/components/trophies/RecentPlayers.vue';
import RegionTags from '~/components/trophies/RegionTags.vue';
import SimilarTrophies from '~/components/trophies/SimilarTrophies.vue';

const route = useRoute();
const router = useRouter();
const psnid = ref(route.query.psnid);
const language = ref(route.query.language || route.params.language);
const api = useApi();
const { getTrophyIcon } = usePsn();
const { getTrophySetTitleSlug } = usePsn();

// 切换奖杯组语言
async function changeTrophyLanguage(newLanguage) {
  language.value = newLanguage.language_code;
  router.replace({
    name: route.name,
    params: {
      ...route.params,
      language: language.value,
      title: getTrophySetTitleSlug(newLanguage.localized_title),
    },
    query: route.query,
  });
  refresh();
}

// 切换奖杯组到默认语言
async function defaultTrophyLanguage() {
  language.value = trophySet.value.default_language;
  router.replace({
    name: route.name,
    params: {
      ...route.params,
      language: trophySet.value.default_language,
      title: getTrophySetTitleSlug(trophySet.value.trophyTitleName),
    },
    query: route.query,
  });
  refresh();
}

const { data, refresh } = await useAsyncData(
  'trophy-set-' + route.params.id + '-' + route.params.language,
  fetchTrophySet,
);

const trophySet = toRef(data.value, 'trophyTitle');
const trophyGroups = toRef(data.value, 'trophyGroups');

const trackedUser = computed(() => {
  return data.value.user;
});
const trophyTitle = computed(() => {
  if (data.value.trophyTranslation?.length > 0) {
    for (const translate of data.value.trophyTranslation) {
      if (translate.default_group === 1) {
        return translate.localized_title;
      }
    }
  }
  return trophySet.value['trophyTitleName'];
});

useSeoMeta({
  title: `${trophySet.value.trophyTitleName}`,
  description: `${trophySet.value.trophyTitlePlatform}游戏「${trophySet.value.trophyTitleName}」的奖杯组。`,
});

async function fetchTrophySet() {
  const res = await api.get(`/trophies/get/${route.params.id}`, {
    params: {
      language: language.value,
      psnid: psnid.value,
    },
  });
  return res.data;
}

// 所有奖杯
const trophies = computed(() => {
  if (trophyGroups.value?.length <= 0) {
    return [];
  }

  const _trophies = [];

  for (const trophyGroup of trophyGroups.value) {
    for (const trophy of trophyGroup.trophyList) {
      _trophies.push(trophy);
    }
  }
  return _trophies;
});

// 已获得的奖杯
const earnedTrophies = computed(() => {
  if (
    trophyGroups.value?.length <= 0 ||
    !trackedUser.value?.trophyLog ||
    trackedUser.value?.trophyLog?.length <= 0
  ) {
    return new Map();
  }

  const _trophies = {};
  const _earnedTrophies = new Map();

  for (const trophyGroup of trophyGroups.value) {
    for (const trophy of trophyGroup.trophyList) {
      _trophies[trophy.id] = trophy;
    }
  }

  for (const trackedTrophy of trackedUser.value.trophyLog) {
    if (trackedTrophy.earned == 1) {
      _earnedTrophies.set(trackedTrophy.trophy_id, {
        ..._trophies[trackedTrophy.trophy_id],
        earnedDateTime: trackedTrophy.earned_at,
      });
    }
  }

  return _earnedTrophies;
});

// 未获得的奖杯
const unearnedTrophies = computed(() => {
  if (
    trophyGroups.value?.length <= 0 ||
    !trackedUser.value?.trophyLog ||
    trackedUser.value?.trophyLog?.length <= 0
  ) {
    return [];
  }

  const _trophies = {};
  const _unearnedTrophies = [];

  for (const trophyGroup of trophyGroups.value) {
    for (const trophy of trophyGroup.trophyList) {
      _trophies[trophy.id] = trophy;
    }
  }

  for (const trackedTrophy of trackedUser.value.trophyLog) {
    if (trackedTrophy.earned == 0) {
      _unearnedTrophies.push(_trophies[trackedTrophy.trophy_id]);
    }
  }

  return _unearnedTrophies;
});
</script>
