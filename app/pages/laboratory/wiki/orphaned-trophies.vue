<template>
  <div class="max-w-screen-lg mx-auto py-4 px-6 relative select-text mb-5">
    <div class="border rounded-md shadow-lg p-6">
      <div class="flex flex-col gap-2">
        <!-- 导航面包屑 -->
        <div class="mb-2 flex flex-row items-center text-sm gap-0.5">
          <NuxtLink to="/" class="text-gray-600 hover:text-gray-950">
            <div class="flex items-center gap-0.5">
              <Icon name="material-symbols:home-outline" class="text-base text-cyan-600" />
              <span class="leading-relaxed">主页</span>
            </div>
          </NuxtLink>
          <Icon name="material-symbols:chevron-right" class="text-lg text-gray-400" />
          <NuxtLink to="/laboratory" class="text-gray-600 hover:text-gray-950">
            <div class="flex items-center gap-0.5">
              <Icon name="ph:flask" class="text-base text-blue-500" />
              <span class="leading-relaxed">社区实验室</span>
            </div>
          </NuxtLink>

          <Icon name="material-symbols:chevron-right" class="text-lg text-gray-400" />
          <NuxtLink to="#" class="text-gray-600 hover:text-gray-950">
            <div class="flex items-center gap-0.5">
              <img src="https://i.psray.net/i/2024/08/14/66bbbc551374e.png" class="size-4" />
              <span class="leading-relaxed">无关联的奖杯组 </span>
            </div>
          </NuxtLink>
        </div>
        <h2 class="font-bold text-xl flex gap-2 my-2 items-center" id="trophies-result">
          <img src="https://i.psray.net/i/2024/08/14/66bbbc551374e.png" class="w-8 h-8" />
          这些奖杯组还没有关联到游戏
        </h2>
        <p>总共还有 {{ data.totalRecords }} 奖杯组，还没有关联任何游戏</p>
        <p>
          数据库一共 {{ data.totalTrophies }} 套奖杯组，目前完善度:
          {{ (((data.totalTrophies - data.totalRecords) / data.totalTrophies) * 100).toFixed(2) }}
          %
        </p>
        <p>关联游戏后，同一个游戏下的相同奖杯组，功能将合并在一起</p>

        <div class="flex flex-col max-w-screen-sm w-full mx-auto gap-3">
          <Paginator
            :first="offset"
            :totalRecords="data.totalRecords"
            :rows="rows"
            :rowsPerPageOptions="[rows]"
            @page="changePage"
          ></Paginator>
          <div
            v-for="(trophySet, index) in data.trohphies"
            class="border rounded-md flex flex-col md:flex-row items-center px-4 py-5 gap-4"
          >
            <div class="text-center mx-3">
              <span class="px-3 py-2 bg-gray-100 rounded-md">
                {{ (currentPage - 1) * 30 + ++index }}
              </span>
            </div>
            <div class="flex flex-1 flex-col md:flex-row items-center gap-2">
              <img :src="trophySet.trophyTitleIconUrl" class="w-32" />
              <div class="flex flex-col items-center md:items-start justify-center gap-2">
                <span class="font-medium text-center md:text-start">{{
                  trophySet.trophyTitleName
                }}</span>
                <div class="flex gap-3">
                  <div
                    class="bg-sky-100 font-medium text-sky-700 px-2 py-1 rounded-md text-sm"
                    v-if="containsPlatform(trophySet.trophyTitlePlatform, 'PS4')"
                  >
                    PS4
                  </div>
                  <div
                    class="bg-blue-100 font-medium text-blue-700 px-2 py-1 rounded-md text-sm"
                    v-if="containsPlatform(trophySet.trophyTitlePlatform, 'PS5')"
                  >
                    PS5
                  </div>
                  <div
                    class="bg-red-100 font-medium text-red-700 px-2 py-1 rounded-md text-sm"
                    v-if="containsPlatform(trophySet.trophyTitlePlatform, 'PS3')"
                  >
                    PS3
                  </div>
                  <div
                    class="bg-green-100 font-medium text-green-700 px-2 py-1 rounded-md text-sm"
                    v-if="containsPlatform(trophySet.trophyTitlePlatform, 'PSVITA')"
                  >
                    PSVITA
                  </div>
                </div>
              </div>
            </div>
            <div>
              <button
                class="bg-blue-500 text-white px-4 py-1.5 rounded-md"
                @click="openTrophies(trophySet.id)"
              >
                查看
              </button>
            </div>
          </div>
          <Paginator
            :first="offset"
            :totalRecords="data.totalRecords"
            :rows="rows"
            :rowsPerPageOptions="[rows]"
            @page="changePage"
          ></Paginator>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const api = useApi();
const router = useRouter();
const route = useRoute();
const { containsPlatform } = useGame();

const rows = ref(30);
const currentPage = ref(route.query.page || 1);
const offset = computed({
  get() {
    return (currentPage.value - 1) * rows.value;
  },
  set(newValue) {
    return (currentPage.value = newValue / rows.value - 1);
  },
});

const { data, refresh } = await useAsyncData('orphaned-trophies', fetchData, {
  watch: [currentPage],
});

async function fetchData() {
  const res = await api.get(`/laboratory/trophies/orphaned-trophies`, {
    params: { page: currentPage.value },
  });
  return res.data;
}

function changePage(PageState) {
  currentPage.value = PageState.page + 1;
  router.push({
    name: route.name,
    query: { ...route.query, page: currentPage.value },
  });
  document.getElementById('trophies-result').scrollIntoView({
    behavior: 'smooth',
  });
}

function openTrophies(id) {
  const path = router.resolve({ name: 'trophies-detail', params: { id } });
  window.open(path.fullPath);
}
</script>
