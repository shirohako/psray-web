<template>
  <div class="bg-gray-100 min-h-screen">
    <div class="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <!-- SparkEntryArea: 根据登录状态显示 发布框 或 未登录提示 -->
      <SparkEntryArea @new-activity="refresh" />

      <Paginator
        :rows="rowsPerPage"
        :totalRecords="sparkList.total"
        :first="(currentPage - 1) * rowsPerPage"
        @page="onPageChange"
        v-if="sparkList.total > 0"
      />

      <!-- SparkFeed: 展示动态列表 -->
      <SparkFeed :sparks="sparkList.data" @new-activity="refresh" />

      <Paginator
        :rows="rowsPerPage"
        :totalRecords="sparkList.total"
        :first="(currentPage - 1) * rowsPerPage"
        @page="onPageChange"
        v-if="sparkList.total > 0"
      />
    </div>
  </div>
</template>

<script setup>
import SparkEntryArea from '~/components/spark/SparkEntryArea.vue';
import SparkFeed from '~/components/spark/SparkFeed.vue';

const api = useApi();
const route = useRoute();

const currentPage = ref(1);
const rowsPerPage = ref(10);

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

const { data: sparkList, error, refresh } = await useAsyncData('sparks', fetchData);

async function fetchData() {
  const params = {
    page: currentPage.value,
  };
  const res = await api.get(`/spark`, { params });
  return res.data;
}
</script>
