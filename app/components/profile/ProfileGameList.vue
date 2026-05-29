<template>
  <div id="game-list" class="border rounded-md shadow-lg p-8 mt-5">
    <div class="flex items-center mb-6">
      <img
        src="https://i.psray.net/i/2023/09/05/64f745d3732d2.png"
        class="mr-3"
        style="width: 28px"
      />
      <span class="text-lg font-medium">{{ $t('profile.recently_played') }}</span>
    </div>

    <Paginator
      :first="offset"
      :totalRecords="totalRecords"
      :rows="50"
      :rowsPerPageOptions="[50]"
      @page="handlePageChange"
    />

    <RecentlyPlayed :recentlyPlayed="play?.recentlyPlayed || []" :psnid="psnid" />

    <Paginator
      v-if="totalRecords >= 3"
      :first="offset"
      :totalRecords="totalRecords"
      :rows="50"
      :rowsPerPageOptions="[50]"
      @page="handlePageChangeToTop"
    />
  </div>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';

import RecentlyPlayed from './RecentlyPlayed.vue';

const props = defineProps({
  psnid: {
    type: String,
    required: true,
  },
});

const api = useApi();
const route = useRoute();
const router = useRouter();
const currentPage = ref(Number(route.query.page || 1));

const { data: play } = await useAsyncData(
  () => `${props.psnid}-play-${currentPage.value}`,
  async () => {
    const res = await api.get(`/profile/play?psnid=${props.psnid}`, {
      params: { page: currentPage.value },
    });
    return res.data;
  },
  {
    transform: data => {
      data.recentlyPlayed.forEach(game => {
        game.last_updated_at = format(fromUnixTime(game.last_updated_at), 'yyyy-MM-dd HH:mm:ss');
        if (game.trophy_set) {
          game.trophySet = game.trophy_set;
          game.trophySet.trophyTitleName =
            game.trophySet.trophyTitleName ?? game.trophySet.trophy_title_name;
          game.trophySet.trophyTitleIconUrl =
            game.trophySet.trophyTitleIconUrl ?? game.trophySet.trophy_title_icon_url;
          game.trophySet.trophyTitlePlatform =
            game.trophySet.trophyTitlePlatform ?? game.trophySet.trophy_title_platform;

          const { owners, platinum_achievers, completed_players, trophyTitlePlatform } =
            game.trophySet;
          game.trophySet.platform = trophyTitlePlatform ? trophyTitlePlatform.split(',') : [];
          if (owners !== 0) {
            game.trophySet.platinumRate = ((platinum_achievers / owners) * 100).toFixed(1);
            if (completed_players != platinum_achievers) {
              game.trophySet.completedRate = ((completed_players / owners) * 100).toFixed(1);
            }
          } else {
            game.trophySet.platinumRate = 0.0;
          }
        }
      });
      return data;
    },
    watch: [currentPage],
  },
);

const offset = computed(() => {
  return (currentPage.value - 1) * 50;
});

const totalRecords = computed(() => {
  return play.value?.totalPages ? play.value.totalPages * 50 : 0;
});

const handlePageChange = pageState => {
  currentPage.value = pageState.page + 1;
  router.push({
    name: route.name,
    query: { ...route.query, page: currentPage.value },
  });
};

const handlePageChangeToTop = pageState => {
  document.getElementById('game-list').scrollIntoView({
    behavior: 'smooth',
  });
  handlePageChange(pageState);
};

watch(
  () => route.query.page,
  page => {
    const nextPage = Number(page || 1);
    if (nextPage !== currentPage.value) {
      currentPage.value = nextPage;
    }
  },
);
</script>
