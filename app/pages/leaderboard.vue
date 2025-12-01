<template>
  <div class="max-w-screen-lg mx-auto p-4">
    <!-- 导航面包屑 -->
    <AppBreadcrumb />
    <div class="text-xl font-bold my-2">{{ $t('leaderboard.title') }}</div>
    <div class="my-2 flex justify-content-center">
      <Select
        v-model="region"
        optionValue="code"
        :options="getAllRegions()"
        optionLabel="name"
        placeholder="Select a Region"
        :highlightOnSelect="true"
        class="w-full md:w-96"
        @update:modelValue="changeSever"
      >
        <template #value="slotProps">
          <div class="flex items-center">
            <Icon
              :name="`flag:${slotProps.value.toLowerCase()}-4x3`"
              v-if="slotProps.value.toLowerCase() != 'global'"
              class="border"
            />
            <Icon name="fxemoji:asiaaustraliaglobe" v-else />
            <div class="ml-3">
              {{ getRegionName(slotProps.value) }}
            </div>
          </div>
        </template>
        <template #option="slotProps">
          <div class="flex items-center">
            <Icon
              :name="`flag:${slotProps.option.code.toLowerCase()}-4x3`"
              v-if="slotProps.option.code.toLowerCase() != 'global'"
              class="border"
            />
            <Icon name="fxemoji:asiaaustraliaglobe" v-else />
            <div class="ml-3">{{ slotProps.option.name }}</div>
          </div>
        </template>
      </Select>
    </div>
    <div>
      <Paginator
        :first="offset"
        :totalRecords="totalRecords"
        :rows="50"
        :rowsPerPageOptions="[50]"
        @page="changePage"
      ></Paginator>
      <ul class="leaderboard my-3 overflow-x-scroll lg:overflow-hidden">
        <li
          v-for="player in data.rankedUserList"
          class="flex flex-nowrap gap-3 py-3 px-4 border-b hover:bg-slate-50 items-center"
        >
          <div class="w-16 shrink-0 text-center">
            <span
              class="bg-slate-200 rounded-lg py-1 px-2 inline-flex justify-center items-center min-w-8"
            >
              {{ player.rank }}
            </span>
          </div>
          <div class="w-20 flex shrink-0 justify-center items-center">
            <Icon :name="`flag:${player.country.toLowerCase()}-4x3`" class="text-2xl border" />
          </div>
          <div class="w-48 shrink-0 grow">
            <NuxtLink
              class="flex items-center"
              :to="{ name: 'player-profile', params: { psnid: player.psnid } }"
            >
              <img class="rounded-full w-11" :src="player.avatarUrl" />
              <span class="ml-3">{{ player.psnid }}</span>
            </NuxtLink>
          </div>
          <div class="w-14 shrink-0 text-center">
            <Icon
              name="mdi:check-decagram"
              class="text-xl text-gray-400"
              :class="{ 'text-green-500': player.joined_at }"
            />
          </div>
          <div class="w-14 shrink-0 text-center flex flex-col justify-center items-center">
            <Icon name="material-symbols:family-star" class="text-yellow-400 text-2xl" />
            {{ player.trophyLevel }}
          </div>
          <div class="w-14 shrink-0 text-center">
            <img :src="getTrophyIcon('platinum')" class="size-7 mx-auto" />
            {{ player.platinum }}
          </div>
          <div class="w-14 shrink-0 text-center">
            <img :src="getTrophyIcon('gold')" class="size-7 mx-auto" />
            {{ player.gold }}
          </div>
          <div class="w-14 shrink-0 text-center">
            <img :src="getTrophyIcon('silver')" class="size-7 mx-auto" />
            {{ player.silver }}
          </div>
          <div class="w-14 shrink-0 text-center">
            <img :src="getTrophyIcon('bronze')" class="size-7 mx-auto" />
            {{ player.bronze }}
          </div>
          <div class="w-28 shrink-0 text-center flex flex-col justify-center items-center">
            <Icon name="akar-icons:coin" class="text-gray-600 mr-2 text-xl" />
            {{ player.points }}
          </div>
        </li>
      </ul>
      <Paginator
        :v-if="data.rankedUserList.length > 10"
        :first="offset"
        :totalRecords="totalRecords"
        :rows="50"
        :rowsPerPageOptions="[50]"
        @page="changePage"
      ></Paginator>
    </div>
  </div>
</template>

<script setup>
import _ from 'lodash';

useSeoMeta({
  title: '用户排行榜',
  description: '在这个世界的尽头闪耀，因为有你。',
});

const route = useRoute();
const router = useRouter();
const api = useApi();
const { getAllRegions, getRegionName } = usePsn();
const { getTrophyIcon } = usePsn();

const currentPage = ref(route.query.page || 1);
const region = ref(route.query.region || 'Global');

const { data } = await useAsyncData('leaderboard', fetchData, {
  watch: [region, currentPage],
});

async function fetchData() {
  const res = await api.get('/leaderboard', {
    params: {
      page: currentPage.value,
      region: region.value,
    },
  });
  return res.data;
}

const offset = computed({
  get() {
    return (currentPage.value - 1) * 50;
  },
  set(newValue) {
    currentPage.value = newValue / 50 - 1;
  },
});

const totalRecords = computed(() => {
  return data.value.pagination.totalPages * 50;
});

function changeSever(region) {
  currentPage.value = 1;
  router.push({ name: route.name, query: { page: 1, region } });
}

function changePage(PageState) {
  currentPage.value = PageState.page + 1;
  router.push({
    name: route.name,
    query: { ...route.query, page: currentPage.value },
  });
}
</script>
