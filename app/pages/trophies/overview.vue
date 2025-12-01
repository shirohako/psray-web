<template>
  <div class="max-w-screen-xl mx-auto p-6">
    <!-- 导航面包屑 -->
    <!-- 搜索 -->
    <div class="mb-5 mt-5">
      <div class="text-xl font-bold mb-6 flex items-center gap-2">
        <img class="size-8" src="https://i.psray.net/i/2024/10/20/6714e47fee7ff.png" />
        <h2 class="ml-2">{{ $t('trophies.overview.title') }}</h2>
      </div>
      <div class="data-card rounded-xl px-8 py-6 flex flex-col gap-5">
        <div class="font-bold text-lg text-center md:text-left flex flex-col gap-1">
          <span>{{ $t('trophies.overview.search') }}</span>
          <div class="text-xs text-gray-600 flex items-center gap-1 font-normal">
            <Icon name="mdi:information-slab-circle-outline" class="text-gray-500"></Icon>
            {{ $t('trophies.overview.search_tip') }}
          </div>
        </div>
        <div class="flex flex-col items-center md:flex-row gap-5 md:gap-10">
          <IconField>
            <InputIcon> <Icon name="material-symbols:search" /></InputIcon>
            <InputText
              v-model="searchKeyword"
              placeholder="Search"
              class="w-48 lg:w-96"
              @keydown.enter="search"
            />
          </IconField>
          <!-- 搜索按钮 -->
          <button
            @click="search"
            class="group p-5 cursor-pointer relative text-xl font-normal border-0 flex items-center justify-center bg-transparent text-red-500 h-auto w-[170px] overflow-hidden transition-all duration-100"
          >
            <span
              class="group-hover:w-full absolute left-0 h-full w-5 border-y border-l border-red-500 transition-all duration-500"
            >
            </span>

            <p
              class="group-hover:opacity-0 group-hover:translate-x-[-100%] absolute translate-x-0 transition-all duration-200"
            >
              {{ $t('trophies.search.button') }}
            </p>

            <span
              class="group-hover:translate-x-0 group-hover:opacity-100 absolute translate-x-full opacity-0 transition-all duration-200"
            >
              {{ $t('trophies.search.button') }}
            </span>

            <span
              class="group-hover:w-full absolute right-0 h-full w-5 border-y border-r border-red-500 transition-all duration-500"
            >
            </span>
          </button>
        </div>
      </div>
    </div>
    <!-- 概况 -->
    <div class="mb-5">
      <div class="text-xl font-bold mb-6 flex items-center gap-2">
        <img class="size-8" src="https://i.psray.net/i/2024/08/21/66c5df9cdc7a8.png" />
        <h2 class="ml-2">{{ $t('trophies.overview.summary.title') }}</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="data-card rounded-xl px-5 py-4 flex flex-col gap-6">
          <img class="size-8" src="https://i.psray.net/i/2024/08/22/66c6a10adb5f6.png" />
          <div>
            <p class="font-bold text-2xl">
              {{ summary.tracked_trophy_set_count }}
            </p>
            <p>{{ $t('trophies.overview.summary.trophy_set_count') }}</p>
          </div>
        </div>
        <div class="data-card rounded-xl px-5 py-4 flex flex-col gap-6">
          <img class="size-8" src="https://i.psray.net/i/2023/09/10/64fda1d94ba7e.png" />
          <div>
            <p class="font-bold text-2xl">{{ summary.translate_count }}</p>
            <p>{{ $t('trophies.overview.summary.translations') }}</p>
          </div>
        </div>
        <div class="data-card rounded-xl px-5 py-4 flex flex-col gap-6">
          <img class="size-8" src="https://i.psray.net/i/2024/08/22/66c6a09c8042f.png" />
          <div>
            <p class="font-bold text-2xl">{{ summary.tracked_trophy_count }}</p>
            <p>{{ $t('trophies.overview.summary.trophy_count') }}</p>
          </div>
        </div>
        <div class="data-card rounded-xl px-5 py-4 flex flex-col gap-4">
          <img class="size-8" src="https://i.psray.net/i/2024/08/22/66c69f65472be.png" />
          <div>
            <p class="font-bold text-2xl">{{ summary.game_play_count }}</p>
            <p>{{ $t('trophies.overview.summary.game_play_count') }}</p>
          </div>
        </div>
      </div>
    </div>
    <!-- 数据 -->
    <div class="mb-5">
      <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
        <img class="size-8" src="https://i.psray.net/i/2024/08/21/66c5dedcc5cf5.png" />
        <span class="ml-2">{{ $t('trophies.overview.data.title') }}</span>
      </h2>
      <!-- 这里是搜索 -->
      <div class="flex flex-col gap-5">
        <!-- 这里是奖杯组平台分析 -->
        <PlatformAnalysis :data="platform" :summary="summary.tracked_trophy_set_count" />
        <LanguageAnalysis :data="localization" :summary="summary.translate_count" />
      </div>
    </div>
    <!-- 热门奖杯组 -->
    <div class="mb-5">
      <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
        <img class="size-8" src="https://i.psray.net/i/2024/08/21/66c5dffcacc98.png" />
        <span class="ml-2">{{ $t('trophies.overview.popular') }}</span>
      </h2>
      <div>
        <ul class="grid sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          <li
            v-for="trophies in popularGamesLastWeek"
            class="flex flex-col justify-center items-center pt-8 pb-4 px-3 border rounded-2xl shadow-md"
          >
            <NuxtLink
              class="flex flex-col justify-center items-center"
              :to="{
                name: 'trophies-detail',
                params: {
                  id: trophies.id,
                  language: trophies.default_language,
                  title: getTrophySetTitleSlug(trophies.trophyTitleName),
                },
              }"
            >
              <div class="flex justify-center items-center w-40 h-40 max-w-full">
                <div class="">
                  <img class="trophies-cover" :src="trophies.trophyTitleIconUrl" />
                </div>
              </div>
              <div class="flex flex-col justify-center items-center my-2 grow">
                <div class="text-center">{{ trophies.trophyTitleName }}</div>
                <div class="my-2 flex gap-2">
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
                </div>
                <div class="mt-2">
                  {{
                    $t('trophies.overview.playing', {
                      headcount: trophies.player,
                    })
                  }}
                </div>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
    <!-- 最近被添加的的奖杯组 -->
    <div class="mb-5">
      <h2 class="text-xl font-bold mb-6 flex items-center gap-2">
        <img class="size-8" src="https://i.psray.net/i/2024/08/21/66c5e8442df5f.png" />
        <span class="ml-2">{{ $t('trophies.overview.recent') }}</span>
      </h2>

      <div>
        <ul class="grid sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
          <li
            v-for="trophies in recentlyAddedTrophy"
            class="flex flex-col justify-center items-center pt-8 pb-4 px-3 border rounded-2xl shadow-md"
          >
            <NuxtLink
              class="flex flex-col justify-center items-center"
              :to="{
                name: 'trophies-detail',
                params: {
                  id: trophies.id,
                  language: trophies.default_language,
                  title: getTrophySetTitleSlug(trophies.trophyTitleName),
                },
              }"
            >
              <div class="flex justify-center items-center w-40 h-40 max-w-full">
                <div class="">
                  <img class="trophies-cover max-w-full" :src="trophies.trophyTitleIconUrl" />
                </div>
              </div>
              <div class="flex flex-col justify-center items-center my-2 grow">
                <div class="text-center">{{ trophies.trophyTitleName }}</div>
                <div class="my-2 flex gap-2">
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
                </div>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
useSeoMeta({
  title: `奖杯组`,
  description: `探索这个广阔的世界，确认和寻找新的目标。`,
});

const { getTrophySetTitleSlug } = usePsn();

const api = useApi();
const router = useRouter();
const { data } = await useAsyncData('trophies-overview', fetchData);

const popularGamesLastWeek = toRef(() => data.value.popular_games_last_week);
const recentlyAddedTrophy = toRef(() => data.value.recently_added_trophy);
const summary = toRef(() => data.value.summary);
const platform = toRef(() => data.value.platform);
const localization = toRef(() => data.value.localization);

const searchKeyword = ref('');

const { containsPlatform } = useGame();

async function fetchData() {
  const res = await api.get('/trophies/overview');
  return res.data;
}

function search() {
  if (searchKeyword.value.length > 1) {
    router.push({
      path: '/trophies/search',
      query: { q: searchKeyword.value },
    });
  }
}
</script>

<style scoped>
.data-card {
  box-shadow: 0px 3px 4px 0px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f1f4;
  background-image: url('https://i.psray.net/i/2024/08/21/66c5c9f63c993.png');
  background-repeat: no-repeat;
  background-position: right top -1.7rem;
  background-size: cover;
}
</style>
