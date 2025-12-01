<template>
  <div class="max-w-screen-lg mx-auto py-4 px-6">
    <!-- 导航面包屑 -->
    <div class="text-xl font-bold my-2">{{ $t('public_log.title') }}</div>
    <div class="relative p-2">
      <div
        class="w-full h-full rounded-md bg-gray-900/30 z-10 absolute transition duration-700 ease-in-out"
        :class="[{ hidden: status === 'success' }]"
      ></div>
      <Paginator
        :first="offset"
        :totalRecords="totalRecords"
        :rows="50"
        :rowsPerPageOptions="[50]"
        @page="changePage"
      />

      <table class="table-auto w-full text-center overflow-x-auto">
        <thead class="text-gray-700 uppercase">
          <tr class="bg-gray-50">
            <th class="px-6 py-3">ID</th>
            <th class="px-6 py-3">类别</th>
            <th class="px-6 py-3">封面</th>
            <th class="px-6 py-3">标题</th>
            <th class="px-6 py-3">创建时间</th>
            <th class="px-6 py-3">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="trophies in data.historyData"
            class="odd:bg-white even:bg-slate-50 border-b border-gray-100"
          >
            <td>{{ trophies.id }}</td>
            <td>{{ trophies.operation }}</td>
            <td class="flex justify-center py-2">
              <img :src="trophies.trophySetData.trophyTitleIconUrl" class="w-24 rounded" />
            </td>
            <td>{{ trophies.trophySetData.trophyTitleName }}</td>
            <td>{{ formatISO9075(fromUnixTime(trophies.created_at)) }}</td>
            <td>
              <Button
                size="small"
                severity="contrast"
                class="flex justify-center items-center text-sm"
                @click="
                  router.push({
                    name: 'trophies-detail',
                    params: { id: trophies.trophySetData.id },
                  })
                "
              >
                <Icon name="ph:magnifying-glass-bold" class="text-md" />
                <span>Check</span>
              </Button>
            </td>
          </tr>
        </tbody>
      </table>

      <Paginator
        :first="offset"
        :totalRecords="totalRecords"
        :rows="50"
        :rowsPerPageOptions="[50]"
        @page="changePage"
      />
    </div>
  </div>
</template>

<script setup>
import { formatISO9075, fromUnixTime } from 'date-fns';

useSeoMeta({
  title: '奖杯更新记录',
  description: '在这里可以查看新的发售的游戏和新增加的PSN奖杯组。',
});

const route = useRoute();
const router = useRouter();
const api = useApi();

const currentPage = ref(route.query.page || 1);

const { data, status } = await useAsyncData('trophy-set-log', fetchData, {
  watch: [currentPage],
});

async function fetchData() {
  const res = await api.get('/log/trophies', {
    params: {
      page: currentPage.value,
    },
  });
  return res.data;
}

const offset = computed({
  get() {
    return (currentPage.value - 1) * 50;
  },
  set(newValue) {
    return (currentPage.value = newValue / 50 - 1);
  },
});

const totalRecords = computed(() => {
  return data.value.pagination.totalPages * 50;
});

function changePage(PageState) {
  currentPage.value = PageState.page + 1;
  router.push({
    name: route.name,
    query: { ...route.query, page: currentPage.value },
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>
