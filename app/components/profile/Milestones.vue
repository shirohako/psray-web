<template>
  <div
    class="mt-3 pt-3 border-t lg:max-h-full overflow-hidden relative"
    :class="{ 'max-h-[410px]': milestonesExpanded }"
  >
    <div class="flex items-center mb-4 gap-2">
      <img src="https://i.psray.net/i/2024/09/26/66f44a465bade.png" class="size-7" />
      <span class="text-base font-medium">{{ $t('profile.milestones') }}</span>
    </div>
    <div
      class="milestones-expand-btn lg:hidden"
      @click="milestonesExpand"
      :class="{ hidden: !milestonesExpanded }"
    >
      <Icon
        name="material-symbols:keyboard-double-arrow-down-rounded"
        class="animate-bounce text-stone-500"
      />
    </div>
    <div class="flex flex-col gap-1">
      <div v-for="milestone in milestones" class="odd:bg-gray-50 rounded-sm hover:bg-gray-100">
        <div class="px-2.5 py-2 space-y-2">
          <div class="flex flex-col">
            <!-- 奖杯类型 -->
            <div class="flex items-center gap-2">
              <img
                src="https://i.psray.net/i/2023/09/05/64f5ff0e52e77.png"
                v-if="milestone.type == 'trophy'"
                class="size-4"
              />
              <img src="https://i.psray.net/i/2023/09/04/64f4e3dd41b45.png" v-else class="size-4" />
              <span>{{ _.capitalize(milestone.type) }}</span>
              <span class="text-xs text-gray-600 -ml-1">#{{ milestone.index }}</span>
            </div>

            <!-- 获取时间 -->
            <div class="text-xs text-gray-600">
              {{ format(fromUnixTime(milestone.earned_at), 'yyyy-MM-dd hh:mm') }}
            </div>
          </div>

          <!-- 奖杯内容 -->
          <div class="flex gap-2 items-center">
            <NuxtLink :to="`/trophy/${milestone.trophy_id}`" class="size-12 shrink-0">
              <img
                :src="milestone.trophyIconUrl"
                class="w-full h-full border-2 rounded-sm border-gray-200 p-0.5"
              />
            </NuxtLink>

            <div class="flex flex-col justify-center gap-0.5 grow">
              <div class="text-sm line-clamp-1 text-stone-700 hover:text-stone-950">
                <NuxtLink :to="`/trophy/${milestone.trophy_id}`">
                  {{ milestone.trophyName }}
                </NuxtLink>
              </div>
              <div class="text-xs line-clamp-1 text-gray-600 hover:text-cyan-700">
                <NuxtLink :to="`/trophies/${milestone.trophy_set_id}`">
                  {{ milestone.trophySetName }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import _ from 'lodash';
import { format, fromUnixTime, formatDuration, intervalToDuration } from 'date-fns';

defineProps(['milestones']);

const milestonesExpanded = ref(true);
function milestonesExpand() {
  milestonesExpanded.value = false;
}
</script>
