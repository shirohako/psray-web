<template>
  <div class="flex flex-col items-center">
    <!-- 图片 -->
    <img
      :src="trophySet.trophyTitleIconUrl"
      class="border-2 border-gray-100 rounded-md w-[320px] max-w-full"
    />
    <!-- 奖杯标题 -->
    <h1 class="font-bold mt-2 text-center">
      {{ trophyTitle }}
    </h1>
    <!-- 奖杯平台 -->
    <div class="flex justify-center lg:justify-center mt-1">
      <div
        class="mr-2 ml-0 bg-indigo-500 text-white px-3 py-1 rounded-md text-sm"
        v-for="platform in trophySet.trophyTitlePlatform?.split(',')"
      >
        {{ platform }}
      </div>
    </div>
    <!-- 奖杯个数 -->
    <div class="flex justify-center gap-2 mt-3">
      <div class="flex gap-1">
        <img class="size-6" :src="getTrophyIcon('platinum')" />
        <span class="text-base">
          {{ trophySet.definedTrophies?.platinum }}
        </span>
      </div>
      <div class="flex gap-1">
        <img class="size-6" :src="getTrophyIcon('gold')" />
        <span class="text-base">
          {{ trophySet?.definedTrophies?.gold }}
        </span>
      </div>
      <div class="flex gap-1">
        <img class="size-6" :src="getTrophyIcon('silver')" />
        <span class="text-base">
          {{ trophySet?.definedTrophies?.silver }}
        </span>
      </div>
      <div class="flex gap-1">
        <img class="size-6" :src="getTrophyIcon('bronze')" />
        <span class="text-base">
          {{ trophySet?.definedTrophies?.bronze }}
        </span>
      </div>
    </div>
    <!-- NPID 和 版本 -->
    <div class="flex flex-col justify-center mt-3 w-full">
      <div class="mr-2 ml-0 bg-green-500 text-white rounded-md py-1">
        <div class="text-center w-full text-sm">
          {{ trophySet.npCommunicationId }}
        </div>
      </div>
      <div class="mr-2 ml-0 bg-violet-400 text-white rounded-md mt-3 py-1">
        <div class="text-center w-full text-sm">
          {{ $t('trophies.version') }}: {{ trophySet.trophySetVersion }}
        </div>
      </div>
    </div>
    <!-- ID 和 奖杯更新时间 -->
    <div class="w-full border-l-4 pl-2 border-blue-300 mt-5 rounded">
      <table class="w-full">
        <tbody>
          <tr>
            <td>PSRay ID:</td>
            <td class="text-right">{{ trophySet.id }}</td>
          </tr>
          <tr>
            <td>{{ $t('trophies.created_at') }}:</td>
            <td class="text-right">
              {{ format(fromUnixTime(trophySet.created_at), 'yyyy-MM-dd HH:mm') }}
            </td>
          </tr>
          <tr>
            <td>{{ $t('trophies.updated_at') }}:</td>
            <td class="text-right">
              {{ format(fromUnixTime(trophySet.updated_at), 'yyyy-MM-dd HH:mm') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { format, formatISO9075, fromUnixTime, formatDuration, intervalToDuration } from 'date-fns';

defineProps(['trophySet', 'trophyTitle']);
const { getTrophyIcon } = usePsn();
</script>
