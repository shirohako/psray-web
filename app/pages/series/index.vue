<template>
  <div class="max-w-2xl mx-auto pt-5 px-2">
    <h1 class="text-center mb-5 text-2xl font-bold">游戏系列</h1>

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

    <div class="grid grid-cols-1 space-y-2">
      <NuxtLink
        v-for="series in data.data"
        :to="`/series/${series.id}`"
        class="flex justify-between bg-gray-100 p-4 border rounded-md"
      >
        <div class="grow flex justify-start items-center">
          {{ series.name }}
        </div>
        <div class="flex space-x-4">
          <div class="flex flex-col justify-center items-center">
            <span class="font-bold">{{ series.game_count }}</span>
            <span class="text-xs">游戏</span>
          </div>
          <div class="flex flex-col justify-center items-center">
            <span class="font-bold">{{ series.trophy_set_count }}</span>
            <span class="text-xs">奖杯组</span>
          </div>
        </div>
      </NuxtLink>
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
</template>

<script setup>
const api = useApi();
const route = useRoute();

const currentPage = ref(1);
const rowsPerPage = ref(10);

const { data, refresh } = await useAsyncData('series', fetchSeries);

watch(
  [currentPage],
  () => {
    refresh();
  },
  { deep: true },
);

function onPageChange(PageState) {
  currentPage.value = PageState.page + 1;
}

async function fetchSeries() {
  const params = {
    page: currentPage.value,
  };
  const res = await api.get('/series', { params });
  return res.data;
}
</script>
