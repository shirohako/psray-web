<template>
  <div class="trophy-group">
    <div class="flex flex-col gap-3 pl-3 my-6 border py-3 px-1 rounded-md">
      <!-- 筛选 -->
      <div class="flex flex-wrap gap-4 text-sm">
        <div class="flex items-center gap-0.5">
          <Icon name="material-symbols:filter-alt-off" class="text-lg text-gray-500"></Icon>
          <span>筛选：</span>
        </div>
        <div class="flex items-center">
          <RadioButton v-model="filter" name="filter-all" value="all" />
          <label for="filter-all" class="ml-2">
            {{ $t('trophies.filter.all') }}
          </label>
        </div>
        <div class="flex items-center">
          <RadioButton v-model="filter" name="filter-earned" value="earned" />
          <label for="filter-earned" class="ml-2">
            {{ $t('trophies.filter.earned') }}
          </label>
        </div>
        <div class="flex items-center">
          <RadioButton v-model="filter" name="filter-unearned" value="unearned" />
          <label for="filter-unearned" class="ml-2">
            {{ $t('trophies.filter.unearned') }}
          </label>
        </div>
      </div>
      <!-- 排序 -->
      <div class="flex flex-wrap gap-4 text-sm">
        <div class="flex items-center gap-0.5">
          <Icon name="tabler:sort-descending" class="text-lg text-gray-500"></Icon>
          <span>排序：</span>
        </div>
        <div class="flex items-center">
          <RadioButton v-model="sort" name="sort-default" value="default" />
          <label for="sort-default" class="ml-2">
            {{ $t('trophies.sort.default') }}
          </label>
        </div>
        <div class="flex items-center">
          <RadioButton v-model="sort" name="sort-earnedDate" value="earnedDate" />
          <label for="sort-earnedDate" class="ml-2">
            {{ $t('trophies.sort.date') }}
          </label>
        </div>
        <div class="flex items-center">
          <RadioButton v-model="sort" name="sort-rarity" value="rarity" />
          <label for="sort-rarity" class="ml-2">
            {{ $t('trophies.sort.psn-rarity') }}
          </label>
        </div>
      </div>
      <!-- 更多设置 -->
      <div>
        <Button type="button" class="bg-black text-white text-sm" @click="drawer = true">
          <Icon name="lucide:settings" />
          更多设置
        </Button>
        <TrophiesSetting />
      </div>
    </div>
    <NoDataFound v-if="processedTrophies.length == 0" />
    <div v-for="(trophy, i) in processedTrophies">
      <TrophiesTrophy
        :trophy="trophy"
        :translate="translation"
        :earned="trophy.earned"
        :earnedDateTime="trophy.earnedDateTime"
      />
    </div>
  </div>
</template>

<script setup>
import _ from 'lodash';

const props = defineProps(['trophies', 'translation', 'earnedTrophies']);
const filter = ref('all'); // 过滤
const sort = ref('default'); // 排序

const drawer = useState('trophies-drawer');

const processedTrophies = computed(() => {
  let _processedTrophies = [];

  if (filter.value != 'all') {
    const condition = filter.value == 'earned' ? true : false;
    for (let index = 0; index < props.trophies.length; index++) {
      if (props.earnedTrophies.has(props.trophies[index]['id']) == condition) {
        _processedTrophies.push(props.trophies[index]);
      }
    }
  } else {
    _processedTrophies = props.trophies;
  }

  _processedTrophies.forEach(trophy => {
    trophy['earned'] = props.earnedTrophies.has(trophy.id);
    trophy['earnedDateTime'] = getEarnedDateTime(trophy.id);
  });

  if (sort.value == 'earnedDate') {
    _processedTrophies = _.orderBy(
      _processedTrophies,
      ['earned', 'earnedDateTime', 'trophyId'],
      ['desc', 'asc', 'asc'],
    );
  } else if (sort.value == 'rarity') {
    _processedTrophies = _.orderBy(_processedTrophies, ['trophyEarnedRate']);
  }

  return _processedTrophies;
});

function getEarnedDateTime(_trackedTrophyId) {
  const _trophy = props.earnedTrophies.get(_trackedTrophyId);
  if (_trophy) {
    return _trophy['earnedDateTime'];
  }
  return false;
}
</script>

<style></style>
