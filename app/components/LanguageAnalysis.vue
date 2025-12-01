<template>
  <div class="data-card-ex rounded-xl px-8 py-6 flex flex-col gap-3">
    <div class="font-bold text-lg">{{ $t('trophies.overview.data.language') }}</div>
    <div class="grid grid-cols-1 gap-6">
      <div class="flex flex-col gap-1">
        <p class="text-sm text-gray-500">{{ $t('trophies.overview.data.localizations') }}</p>
        <p class="font-bold text-2xl">
          {{ summary || 0 }}
        </p>
        <div class="flex items-center gap-1 mb-1.5">
          <div
            class="h-2 w-full rounded-sm"
            :class="[colors[key]]"
            :style="{ 'max-width': _.floor((value / sum) * 100) + '%' }"
            v-for="(value, key) in sortedData"
          ></div>
        </div>
        <div class="flex items-center flex-wrap gap-4 mb-1">
          <div class="flex items-center gap-1.5" v-for="(value, key) in sortedData">
            <span class="rounded-md size-2" :class="colors[key]"></span>
            <span class="text-sm font-normal text-gray-800">
              {{ key.toUpperCase() }}
            </span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          class="flex items-center justify-between flex-wrap gap-2"
          v-for="(value, key) in sortedData"
        >
          <div class="flex items-center gap-1.5">
            <div class="text-sm font-normal text-gray-900">
              <span class="font-bold">
                {{ key != 'other' ? getEnglishName(key) : _.capitalize(key) }}
              </span>
              <span v-if="key != 'other'"> ({{ getNativeName(key) }}) </span>
            </div>
          </div>
          <div class="flex items-center text-sm font-medium text-gray-800 gap-6">
            <span class="lg:text-right">{{ value }}</span>
            <span class="text-center lg:text-right w-12">
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
const { getEnglishName, getNativeName } = usePsn();

const sortedData = computed(() => {
  let sortedLocalization = _.chain(props.data).toPairs().orderBy([1], ['desc']).fromPairs().value();

  if (!sortedLocalization.hasOwnProperty('other')) {
    sortedLocalization.other = 0;
  }

  _.forOwn(sortedLocalization, (value, key) => {
    if (key !== 'other' && (value / sum.value) * 100 < 3) {
      sortedLocalization.other += value;
      delete sortedLocalization[key];
    }
  });

  return sortedLocalization;
});

const colors = {
  en: 'bg-blue-500',
  es: 'bg-red-300',
  fr: 'bg-emerald-300',
  zh: 'bg-pink-400',
  de: 'bg-yellow-300',
  ja: 'bg-violet-400',
  it: 'bg-cyan-400',
  pt: 'bg-orange-600',
  ru: 'bg-purple-700',
  ko: 'bg-red-500',
  pl: 'bg-yellow-600',
  other: 'bg-green-400',
};

const sum = computed(() => {
  return _.sum(Object.values(props.data));
});
</script>

<style scoped>
.data-card-ex {
  position: relative;
  z-index: 1;
  box-shadow: 0px 3px 4px 0px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f1f4;
  background-image: url('https://i.psray.net/i/2024/08/21/66c5c9f63c993.png');
  background-repeat: no-repeat;
  background-position: right top -1.7rem;
  background-size: cover;
}
.data-card-ex::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5); /* 透明覆盖层 */
  z-index: -1; /* 保证覆盖层在背景图片之上，但在内容之下 */
}
</style>
