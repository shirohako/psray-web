<template>
  <div class="flex flex-col md:flex-row min-h-screen bg-gray-100">
    <!-- 左侧：游戏列表区 -->
    <div class="md:w-3/4 p-6">
      <!-- 排序栏组件 -->
      <SortBar :currentSort="currentSort" @change-sort="changeSort" class="mb-3" />

      <!-- 分页组件 -->
      <div class="my-4 flex justify-center">
        <Paginator
          :rows="rowsPerPage"
          :totalRecords="data?.total"
          :first="(currentPage - 1) * rowsPerPage"
          @page="onPageChange"
          v-if="data?.total > 0"
        />
      </div>

      <!-- 游戏列表展示 -->
      <div class="space-y-6">
        <GameCard v-for="game in data.data" :game="game" />
      </div>

      <!-- 分页组件 -->
      <div class="my-4 flex justify-center">
        <Paginator
          :rows="rowsPerPage"
          :totalRecords="data?.total"
          :first="(currentPage - 1) * rowsPerPage"
          @page="onPageChange"
          v-if="data?.total > 0"
        />
      </div>
    </div>

    <!-- 右侧：过滤条件组件 -->
    <div class="md:w-1/4 p-6 bg-white border-l border-gray-200">
      <FilterSidebar :filter="filter" @apply-filter="onFilter" />
    </div>
  </div>
</template>

<script setup>
import SortBar from '~/components/game/SortBar.vue';
import GameCard from '~/components/game/GameCard.vue';
import FilterSidebar from '~/components/game/FilterSidebar.vue';

const currentSort = ref('addedTime');
// 分页数据
const currentPage = ref(1);
const rowsPerPage = ref(30);

const filter = ref({
  category: '',
  platform: '',
  year: '',
});

// 当筛选条件或排序方式变化时，重新请求数据
watch(
  [filter, currentSort, currentPage],
  () => {
    refresh();
  },
  { deep: true },
);

// 筛选侧边栏传递的新条件
function onFilter(newFilter) {
  filter.value = newFilter;
  currentPage.value = 1; // 筛选条件改变时重置页码
}

// 排序栏切换排序方式
function changeSort(newSort) {
  currentSort.value = newSort;
  currentPage.value = 1; // 排序条件改变时重置页码
}

// 分页组件触发的事件
function onPageChange(PageState) {
  // event.first 是当前页第一条记录的索引，从0开始
  currentPage.value = PageState.page + 1;
}

useSeoMeta({
  title: `游戏库`,
  description: `探索这个广阔的世界，发现新游戏。`,
});

const api = useApi();

const { data, error, refresh } = await useAsyncData('games', fetchGames);

async function fetchGames() {
  const params = {
    sort: currentSort.value,
    page: currentPage.value,
  };
  const res = await api.get('/games/all', { params });
  return res.data;
}
</script>
