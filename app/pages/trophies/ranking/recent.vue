<template>
  <div>
    <h2 class="flex items-center justify-center gap-3 font-bold text-xl mb-3">
      <img src="https://i.psray.net/i/2024/08/21/66c541bd44283.png" class="w-8 h-8" />
      {{ $t('trophies.ranking.recent_players') }}
    </h2>
    <NoDataFound v-if="data.totalRecords == 0" />
    <div v-else>
      <Paginator
        :first="data.offset"
        :totalRecords="data.totalRecords"
        :rows="data.recordsPerPage"
        @page="changePage"
      ></Paginator>
      <ul>
        <li
          v-for="userPlayRecord in data.ranking"
          class="flex flex-wrap items-center gap-3 mb-2 border px-2 py-2 rounded-md hover:bg-stone-50"
        >
          <NuxtLink
            :to="{
              name: 'player-profile',
              params: { psnid: userPlayRecord.psnid },
            }"
          >
            <img :src="userPlayRecord.avatarUrl" class="w-10 h-10 rounded-full mx-2" />
          </NuxtLink>
          <Icon
            :name="`flag:${userPlayRecord.country.toLowerCase()}-4x3`"
            class="text-2xl border"
          />
          <div class="w-32 grow">
            <NuxtLink
              :to="{
                name: 'trophies-detail',
                params: { id: route.query.trophies },
                query: { psnid: userPlayRecord.psnid },
              }"
              >{{ userPlayRecord.psnid }}
            </NuxtLink>
          </div>
          <div class="w-12">
            <GameProgess :value="userPlayRecord.progress" />
          </div>
          <div class="ranking-time">
            {{ format(fromUnixTime(userPlayRecord.last_updated_at), 'yyyy-MM-dd HH:mm:ss') }}
          </div>
        </li>
      </ul>
      <Paginator
        v-if="data.ranking.lenght > 10"
        :first="data.offset"
        :totalRecords="data.totalRecords"
        :rows="data.recordsPerPage"
        @page="changePage"
      ></Paginator>
    </div>
  </div>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';

const route = useRoute();
const router = useRouter();
const api = useApi();
const currentPage = ref(route.query.page || 1);
const { data, error, refresh } = await useAsyncData('ranking-pioneers', fetchData);

async function fetchData() {
  const res = await api.get(`/trophies/ranking/recent`, {
    params: {
      trophies: route.query.trophies,
      page: currentPage.value,
    },
  });
  return res.data;
}

function changePage(PageState) {
  currentPage.value = PageState.page + 1;
  router.push({
    query: { ...route.query, page: currentPage.value },
  });
  refresh();
}
</script>

<style lang="postcss" scoped>
ul li:nth-child(even) {
  @apply bg-gray-50;
}
</style>
