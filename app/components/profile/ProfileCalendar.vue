<template>
  <div class="mt-2" v-if="calendar?.length > 0">
    <div class="flex items-center mt-6 gap-2">
      <img src="https://i.psray.net/i/2024/07/10/668e6517d2f8a.png" class="size-6" />
      <span class="text-lg font-medium">
        {{ $t('profile.trophy_calendar') }}
      </span>
    </div>
    <p class="text-xs lg:text-sm text-gray-400 my-3">
      {{ $t('profile.trophy_calendar_description')
      }}<span class="inline lg:hidden">，{{ $t('profile.swipe_left') }}</span>
    </p>
    <div class="max-w-full overflow-x-scroll lg:overflow-hidden">
      <calendar-heatmap
        class="min-w-[720px]"
        :values="calendar"
        :end-date="endDate"
        :round="3"
        :max="50"
        tooltip-unit="奖杯"
        no-data-text="这一天没有获得奖杯"
        :tooltip-formatter="formatTooltip"
      />
    </div>
  </div>
</template>

<script setup>
import { format } from 'date-fns';
import { CalendarHeatmap } from 'vue3-calendar-heatmap';
import 'vue3-calendar-heatmap/dist/style.css';

defineProps({
  calendar: {
    type: Array,
    default: () => [],
  },
});

const endDate = format(new Date(), 'yyyy-MM-dd');

const formatTooltip = (v) => {
  return '在 ' + format(v.date, 'yyyy-MM-dd') + ` 获得了${v.count}个奖杯`;
};
</script>
