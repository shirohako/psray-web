<template>
  <div class="w-full mx-auto flex flex-col justify-center border rounded-md shadow-lg p-8">
    <div class="flex items-center mb-6 ml-1 font-bold text-2xl">
      <img src="https://i.psray.net/i/2024/08/20/66c390b0351f3.png" class="w-10 mr-2" />
      <h2>{{ $t('dashboard.following_users.name') }}</h2>
    </div>
    <div v-if="data.totalRecords > 0">
      <Paginator
        :first="offset"
        :totalRecords="data.totalRecords"
        :rows="30"
        @page="changePage"
      ></Paginator>
      <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <li
          v-for="user in data.follows"
          class="flex flex-col items-center justify-center gap-1 border p-4 rounded-md"
        >
          <img :src="user.avatarUrl" class="w-12 h-12 rounded-full" />
          <p class="font-bold text-lg">{{ user.psnid }}</p>
          <span v-if="user.mutual != 1" class="px-2 py-1 bg-gray-100 rounded-md text-xs">
            {{ $t('dashboard.following_users.following') }}
          </span>
          <span v-else class="px-2 py-1 bg-gray-100 rounded-md text-xs">{{
            $t('dashboard.following_users.mutual')
          }}</span>
          <div class="flex gap-5 mt-2">
            <div class="flex gap-1.5 items-center">
              <Icon
                :name="'flag:' + user.country.toLowerCase() + '-4x3'"
                class="text-lg rounded-sm"
              />
              <span class="font-bold text-sm">{{ user.country }}</span>
            </div>
            <div class="flex gap-1.5 items-center">
              <Icon name="ph:ranking-bold" class="text-xl rounded-sm" />
              <span class="font-bold text-sm">{{ user.trophyLevel }}</span>
            </div>
          </div>
          <button
            class="button-55 mt-2"
            @click="
              navigateTo({
                name: 'player-profile',
                params: { psnid: user.psnid },
              })
            "
          >
            {{ $t('dashboard.following_users.button') }}
          </button>
        </li>
      </ul>
    </div>
    <NoDataFound v-else />
  </div>
</template>

<script setup>
const api = useApi();
const route = useRoute();
const router = useRouter();
const currentPage = ref(route.query.page || 1);
const offset = computed({
  get() {
    return (currentPage.value - 1) * 30;
  },
  set(newValue) {
    return (currentPage.value = newValue / 30 - 1);
  },
});

const { data, error, refresh } = await useAsyncData('my-followers', fetchMyTips);
async function fetchMyTips() {
  const res = await api.get(`/user/following`, {
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
}
</script>
