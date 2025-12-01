<template>
  <div class="w-full mx-auto flex flex-col justify-center border rounded-md shadow-lg p-8">
    <div class="flex items-center mb-6 ml-1 font-bold text-2xl">
      <img src="https://i.psray.net/i/2024/07/20/669b471328b9f.png" class="w-10 mr-2" />
      <h2>{{ $t('dashboard.my_tips.name') }}</h2>
    </div>
    <ul v-if="data?.myTips?.length > 0">
      <Paginator
        :first="offset"
        :totalRecords="data.total"
        :rows="50"
        :rowsPerPageOptions="[50]"
        @page="changePage"
      ></Paginator>
      <li v-for="tip in data.myTips" class="p-2 border-b-2 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <img :src="tip.trophy.trophyIconUrl" class="w-12 h-12" />
          <div>
            <h3 class="text-lg font-semibold">{{ tip.trophy.trophyName }}</h3>
            <div class="flex flex-col">
              <div class="flex items-center">
                <Icon name="ic:outline-update" class="mr-0.5 text-lg text-blue-400"></Icon>
                <span class="text-sm">
                  {{ $t('dashboard.my_tips.release_date') }}
                  {{ format(fromUnixTime(tip.updated_at), 'yyyy-MM-dd HH:mm') }}
                </span>
              </div>
              <div class="flex items-center" v-if="tip.vote_up > 0">
                <Icon name="material-symbols:favorite" class="mr-0.5 text-lg text-red-400"></Icon>
                <span class="text-sm">
                  {{ $t('dashboard.my_tips.helpful', { vote: tip.vote_up }) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="shrink-0">
          <Button class="text-sm" @click="router.push(`/trophy/${tip.trophy_id}`)">
            {{ $t('dashboard.my_tips.button') }}
          </Button>
        </div>
      </li>
    </ul>
    <NoDataFound v-else />
  </div>
</template>

<script setup>
import { format, formatISO9075, fromUnixTime } from 'date-fns';

const api = useApi();
const router = useRouter();
const route = useRoute();
const currentPage = ref(route.query.page || 1);

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const { data, error, refresh } = await useAsyncData('my-tips', fetchMyTips);

const offset = computed({
  get() {
    return (currentPage.value - 1) * 50;
  },
  set(newValue) {
    currentPage.value = newValue / 50 - 1;
  },
});

async function fetchMyTips() {
  const res = await api.get(`/user/tip/list`, {
    params: {
      page: currentPage.value,
    },
  });
  return res.data;
}

function changePage(PageState) {
  currentPage.value = PageState.page + 1;
  router.push({
    name: route.name,
    query: { ...route.query, page: currentPage.value },
  });
  refresh();
}
</script>
