<template>
  <div class="data-card rounded-xl px-8 py-6 flex flex-col gap-3">
    <div class="font-bold text-lg">
      {{ $t('trophies.overview.data.platform') }}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="flex flex-col gap-1">
        <p class="text-sm text-gray-500">
          {{ $t('trophies.overview.data.fetched_trophy_set') }}
        </p>
        <p class="font-bold text-2xl">
          {{ summary || 0 }}
        </p>
        <div class="flex items-center gap-1 mb-1.5">
          <div
            class="h-2 w-full rounded-sm"
            :class="[colors[key]]"
            :style="{ 'max-width': _.floor((value / sum) * 100) + '%' }"
            v-for="(value, key) in data"
          ></div>
        </div>
        <div class="flex items-center flex-wrap gap-4 mb-1">
          <div class="flex items-center gap-1.5" v-for="(value, key) in data">
            <span class="rounded-md size-2" :class="colors[key]"></span>
            <span class="text-sm font-normal text-gray-800">
              {{ key.toUpperCase() }}
            </span>
          </div>
        </div>
      </div>
      <div class="grid gap-3">
        <div class="flex items-center justify-between flex-wrap gap-2" v-for="(value, key) in data">
          <div class="flex items-center gap-1.5">
            <span class="text-sm font-bold text-gray-900">
              {{ key.toUpperCase() }}
            </span>
          </div>
          <div class="flex items-center text-sm font-medium text-gray-800 gap-6">
            <span class="md:text-right">{{ value }}</span>
            <span class="text-center md:text-right w-14">
              {{ _.ceil((value / sum) * 100, 1) }} %
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import _ from 'lodash';

const props = defineProps(['data', 'summary']);

const colors = {
  ps3: 'bg-yellow-400',
  ps4: 'bg-blue-400',
  ps5: 'bg-indigo-600',
  psvita: 'bg-red-400',
  pspc: 'bg-green-400',
};

const sum = computed(() => {
  return _.sum(Object.values(props.data));
});
</script>
