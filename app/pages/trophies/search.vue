<template>
  <div class="max-w-screen-md mx-auto p-4">
    <!-- 导航面包屑 -->
    <div class="flex items-center justify-center gap-2 text-center mb-3">
      <h2 class="text-lg font-bold">{{ $t('trophies.search.title') }}</h2>
      <Icon
        name="mdi:information-slab-circle-outline"
        class="text-gray-500 text-base cursor-pointer"
        @click="toggleTip"
      ></Icon>

      <Popover ref="op">
        <div class="flex flex-col gap-4 w-[25rem]">
          <h2 class="font-bold text-lg">
            {{ $t('trophies.search.help_text_1') }}
          </h2>
          <p class="text-sm text-gray-400">- {{ $t('trophies.search.help_text_2') }}</p>
          <p class="text-sm text-gray-400">- {{ $t('trophies.search.help_text_3') }}</p>
          <p class="text-sm text-gray-400">- {{ $t('trophies.search.help_text_4') }}</p>
          <p class="text-sm text-gray-400">- {{ $t('trophies.search.help_text_5') }}</p>
          <p class="text-xs text-gray-800">
            {{ $t('trophies.search.help_text_6') }}
          </p>
        </div>
      </Popover>
    </div>
    <div class="flex flex-col items-center justify-center md:flex-row gap-3 md:gap-10">
      <IconField>
        <InputIcon> <Icon name="material-symbols:search" /></InputIcon>
        <InputText
          v-model="searchKeyword"
          placeholder="Search"
          class="w-full lg:w-96"
          @keydown.enter="search"
        />
      </IconField>
      <!-- 搜索按钮 -->
      <button
        @click="search"
        class="group p-5 cursor-pointer relative text-xl font-normal border-0 flex items-center justify-center bg-transparent text-sky-500 h-auto w-[170px] overflow-hidden transition-all duration-100"
      >
        <span
          class="group-hover:w-full absolute left-0 h-full w-5 border-y border-l border-sky-500 transition-all duration-500"
        >
        </span>

        <p
          class="group-hover:opacity-0 group-hover:translate-x-[-100%] absolute translate-x-0 transition-all duration-200"
        >
          {{ $t('trophies.search.button') }}
        </p>

        <span
          class="group-hover:translate-x-0 group-hover:opacity-100 absolute translate-x-full opacity-0 transition-all duration-200"
          >{{ $t('trophies.search.button') }}
        </span>

        <span
          class="group-hover:w-full absolute right-0 h-full w-5 border-y border-r border-sky-500 transition-all duration-500"
        >
        </span>
      </button>
    </div>
    <div
      class="max-w-96 mx-auto px-8 py-2 mt-5 text-center bg-red-50 text-red-500 border border-red-300 rounded-md"
      v-if="errorTip"
    >
      {{ $t('error.31005') }}
    </div>
    <NoDataFound v-if="data.totalRecords <= 0" />
    <div class="mt-3 flex flex-col gap-5" v-else>
      <Paginator
        :first="data.offset"
        :totalRecords="data.totalRecords"
        :rows="data.recordsPerPage"
        @page="changePage"
      ></Paginator>
      <ul id="serach-result" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <li
          v-for="trophies in data.trophies"
          class="flex flex-col gap-1 justify-center items-center break-all border p-6 rounded-md hover:bg-gray-50"
        >
          <img :src="trophies.trophyTitleIconUrl" class="w-1/3 lg:w-1/2" />
          <h2 class="text-lg line-clamp-1 font-bold">
            {{ trophies.trophyTitleName }}
          </h2>
          <div class="flex gap-3">
            <div
              class="bg-sky-100 font-medium text-sky-700 px-2 py-1 rounded-md text-sm"
              v-if="containsPlatform(trophies.trophyTitlePlatform, 'PS4')"
            >
              PS4
            </div>
            <div
              class="bg-blue-100 font-medium text-blue-700 px-2 py-1 rounded-md text-sm"
              v-if="containsPlatform(trophies.trophyTitlePlatform, 'PS5')"
            >
              PS5
            </div>
            <div
              class="bg-red-100 font-medium text-red-700 px-2 py-1 rounded-md text-sm"
              v-if="containsPlatform(trophies.trophyTitlePlatform, 'PS3')"
            >
              PS3
            </div>
            <div
              class="bg-green-100 font-medium text-green-700 px-2 py-1 rounded-md text-sm"
              v-if="containsPlatform(trophies.trophyTitlePlatform, 'PSVITA')"
            >
              PSVITA
            </div>
            <div
              class="bg-orange-100 font-medium text-orange-700 px-2 py-1 rounded-md text-sm"
              v-if="containsPlatform(trophies.trophyTitlePlatform, 'PSPC')"
            >
              PSPC
            </div>
          </div>
          <div class="flex justify-center my-2 gap-4">
            <div class="flex gap-1">
              <img class="size-5" :src="getTrophyIcon('platinum')" />
              <span class="text-base">
                {{ trophies.definedTrophies.platinum }}
              </span>
            </div>
            <div class="flex gap-1">
              <img :src="getTrophyIcon('gold')" class="size-5" />
              <span class="text-base">
                {{ trophies.definedTrophies.gold }}
              </span>
            </div>
            <div class="flex gap-1">
              <img :src="getTrophyIcon('silver')" class="size-5" />
              <span class="text-base">
                {{ trophies.definedTrophies.silver }}
              </span>
            </div>
            <div class="flex gap-1">
              <img :src="getTrophyIcon('bronze')" class="size-5" />
              <span class="text-base">
                {{ trophies.definedTrophies.bronze }}
              </span>
            </div>
          </div>
          <div class="flex gap-0.5 items-center">
            <Icon name="material-symbols:person-rounded" class="text-gray-400" />
            <span class="text-sm">{{ trophies.owners }}</span>
          </div>
          <NuxtLink :to="{ name: 'trophies-detail', params: { id: trophies.id } }" target="_blank">
            <button class="button-55 mt-2 tracking-widest">
              {{ $t('trophies.search.view_button') }}
            </button>
          </NuxtLink>
        </li>
      </ul>
      <Paginator
        :first="data.offset"
        :totalRecords="data.totalRecords"
        :rows="data.recordsPerPage"
        @page="changePage"
        v-if="data.trophies?.length >= 6"
      ></Paginator>
    </div>
  </div>
</template>

<script setup>
const api = useApi();
const route = useRoute();
const router = useRouter();
const { getTrophyIcon } = usePsn();
const currentPage = ref(route.query.page || 1);
const searchKeyword = ref(route.query.q);
const errorTip = ref(false);
const op = ref();

const { containsPlatform } = useGame();

const { data, error, refresh } = await useAsyncData('trophies-search', fetchData);

async function fetchData() {
  const res = await api.get('/trophies/simple-search', {
    params: {
      name: searchKeyword.value,
      page: currentPage.value,
    },
  });
  return res.data;
}

function search() {
  if (searchKeyword.value.length > 1) {
    router.push({
      query: { q: searchKeyword.value, page: 1 },
    });
    errorTip.value = false;
    refresh();
  } else {
    errorTip.value = true;
  }
}

function changePage(PageState) {
  currentPage.value = PageState.page + 1;
  router.push({
    query: { ...route.query, page: currentPage.value },
  });
  refresh();
}

const toggleTip = event => {
  op.value.toggle(event);
};
</script>
