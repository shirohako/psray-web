<template>
  <div class="p-4">
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
            :to="{ name: 'player-profile', params: { psnid: trackedUser.profile.psnid } }"
          >
            <img :src="trackedUser.profile.avatarUrl" class="w-8 h-8 rounded-full mr-2" />
            <span class="text-lg font-medium">{{ trackedUser.profile.psnid }}</span>
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
              trackedUser.trophySummary.first_earned_at
                ? formatISO9075(fromUnixTime(trackedUser.trophySummary.first_earned_at))
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
          <span>{{ formatISO9075(fromUnixTime(trackedUser.trophySummary.last_updated_at)) }}</span>
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
                    intervalToDuration({ start: 0, end: trackedUser.trophySummary.gap * 1000 }),
                    { delimiter: ', ', locale: zhCN },
                  )
                : '无数据'
            }}
          </span>
        </div>
      </div>
    </div>
    <!-- 已获得的奖杯 -->
    <div
      class="flex flex-col lg:flex-row px-3 py-3 my-3 bg-gray-100 rounded-lg items-center"
    >
      <span class="min-w-28 mr-3">{{ $t('trophies.earned_trophies') }}:</span>
      <div class="flex items-center gap-3">
        <div class="flex gap-1 items-center">
          <img class="size-6" :src="getTrophyIcon('platinum')" />
          <span class="text-base">{{ trackedUser.trophySummary.earned_platinum }}</span>
        </div>
        <div class="flex gap-1 items-center">
          <img class="size-6" :src="getTrophyIcon('gold')" />
          <span class="text-base">{{ trackedUser.trophySummary.earned_gold }}</span>
        </div>
        <div class="flex gap-1 items-center">
          <img class="size-6" :src="getTrophyIcon('silver')" />
          <span class="text-base">{{ trackedUser.trophySummary.earned_silver }}</span>
        </div>
        <div class="flex gap-1 items-center">
          <img class="size-6" :src="getTrophyIcon('bronze')" />
          <span class="text-base">{{ trackedUser.trophySummary.earned_bronze }}</span>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap gap-2 justify-center px-1">
      <div v-for="[trophyId, trophy] in earnedTrophies.entries()" :key="trophyId">
        <img :src="trophy.trophyIconUrl" class="w-8 h-8 rounded-lg" />
      </div>
    </div>
    <!-- 尚未获得的奖杯 -->
    <div
      class="flex flex-col lg:flex-row px-3 py-3 my-3 bg-gray-100 rounded-lg mt-4 items-center"
    >
      <span class="min-w-28 mr-3">{{ $t('trophies.unearned_trophies') }}:</span>
      <div class="flex items-center gap-3">
        <div class="flex gap-1 items-center">
          <img class="size-6" :src="getTrophyIcon('platinum')" />
          <span class="text-base">
            {{ trophySet.definedTrophies.platinum - trackedUser.trophySummary.earned_platinum }}
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
    <div class="flex flex-wrap gap-2 justify-center px-1">
      <div v-for="trophy in unearnedTrophies" :key="trophy.id">
        <img :src="trophy.trophyIconUrl" class="w-8 h-8 grayscale rounded-lg" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatISO9075, fromUnixTime, formatDuration, intervalToDuration } from 'date-fns'
import { zhCN } from 'date-fns/locale'

defineProps(['trackedUser', 'trophySet', 'earnedTrophies', 'unearnedTrophies'])
const { getTrophyIcon } = usePsn()
</script>
