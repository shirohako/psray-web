<template>
  <div class="max-w-screen-lg mx-auto py-4 px-6 pt-5">
    <div
      id="changes-view"
      class="w-full mx-auto flex flex-col justify-center border rounded-md shadow-lg p-6"
    >
      <div class="flex items-center mb-6 ml-1 font-bold text-2xl">
        <Icon name="material-symbols:book-2-outline" class="mr-1" />
        <h2>Wiki 贡献记录</h2>
      </div>
      <ConfirmPopup></ConfirmPopup>
      <!-- 奖杯组功能导航菜单 -->
      <div
        class="mt-3 mb-5 flex gap-5"
        v-if="route.query.resource == 'trophies' && route.query.resource_id > 0"
      >
        <button
          class="bg-sky-500 text-white hover:bg-sky-600 px-5 py-2 rounded-md"
          @click="router.push(`/laboratory/contributions/trophies/${route.params.resource_id}`)"
        >
          返回奖杯组功能页面
        </button>
        <button
          class="bg-pink-500 text-white hover:bg-pink-600 px-5 py-2 rounded-md"
          @click="
            router.push({
              name: 'trophies-detail',
              params: { id: route.params.resource_id },
            })
          "
        >
          返回奖杯组页面
        </button>
      </div>
      <div class="flex mb-5 ml-3 flex-wrap gap-4">
        <div class="flex items-center">
          <RadioButton v-model="statusFilter" value="all" inputId="statusAll" />
          <label for="statusAll" class="ml-2">全部</label>
        </div>
        <div class="flex items-center">
          <RadioButton v-model="statusFilter" value="pending" inputId="statusPending" />
          <label for="statusPending" class="ml-2">待审核</label>
        </div>
        <div class="flex items-center">
          <RadioButton v-model="statusFilter" value="accepted" inputId="statusAccepted" />
          <label for="statusAccepted" class="ml-2">已通过</label>
        </div>
        <div class="flex items-center">
          <RadioButton v-model="statusFilter" value="rejected" inputId="statusRejected" />
          <label for="statusRejected" class="ml-2">被拒绝</label>
        </div>
      </div>
      <NoDataFound v-if="data?.contributions?.length <= 0" />
      <ul class="break-all" v-else>
        <Paginator
          :first="offset"
          :totalRecords="data.totalRecords"
          :rows="20"
          @page="changePage"
        ></Paginator>
        <WikiChangesItem
          v-bind="contribution"
          v-for="(contribution, i) in data.contributions"
          @changeStatus="changeStatus($event, i)"
        />
        <Paginator
          v-if="data.totalRecords > 3"
          :first="offset"
          :totalRecords="data.totalRecords"
          :rows="20"
          @page="changePage"
        ></Paginator>
      </ul>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['require-auth'],
});

const route = useRoute();
const router = useRouter();
const api = useApi();
const statusFilter = ref(route.query.status || 'all');
const currentPage = ref(route.query.page || 1);

const offset = computed({
  get() {
    return (currentPage.value - 1) * 20;
  },
  set(newValue) {
    return (currentPage.value = newValue / 20 - 1);
  },
});

function changePage(PageState) {
  currentPage.value = PageState.page + 1;
  router.push({
    query: { ...route.query, page: currentPage.value },
  });
  refresh();
  document.getElementById('changes-view').scrollIntoView({
    behavior: 'smooth',
  });
}

const { data, error, refresh } = await useAsyncData(
  'wiki-database-changes',
  fetchTrophySetChanges,
  { watch: [statusFilter], deep: true },
);

async function fetchTrophySetChanges() {
  const res = await api.get(`/contribution/changes`, {
    params: {
      ...route.query,
      status: statusFilter.value,
      page: currentPage.value,
    },
  });
  return res.data;
}

function changeStatus(newData, i) {
  data.value.contributions[i].accepted = newData.status;
  data.value.contributions[i].reward = newData.reward;
}

watch(statusFilter, () => {
  currentPage.value = 1;
  router.push({
    query: { ...route.query, page: currentPage.value },
  });
});
</script>
