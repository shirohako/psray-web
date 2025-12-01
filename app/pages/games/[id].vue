<template>
  <div class="min-h-screen text-gray-900 max-w-screen-2xl mx-auto px-4 pt-6 pb-6">
    <main class="flex gap-4 flex-wrap md:flex-nowrap">
      <!-- 左栏 (约 2/3) -->
      <div class="w-full md:w-3/5 md:mb-0 flex flex-col space-y-4 order-2 md:order-1">
        <GameGalleria :images="data.images" />

        <GameDetail :game="data" />

        <GameTrophy :trophies="data.trophies" v-if="data.trophies?.length" />

        <GameReviews :reviews="reviews" v-if="reviews.status === 'success'" />
      </div>

      <!-- 右栏 (约 1/3) -->
      <div class="w-full md:w-2/5 md:mt-0 space-y-4 order-1 md:order-2">
        <GameInfo :game="data" />

        <GameReleases :releases="data.releases" v-if="data.releases?.length" />

        <div class="p-4 bg-white rounded border shadow-sm">
          <HowLongToBeat :game="data" />
        </div>

        <GameLinks :game="data" />
      </div>
    </main>
  </div>
</template>

<script setup>
// 左边
import GameGalleria from '~/components/game/GameGalleria.vue';
import GameDetail from '~/components/game/GameDetail.vue';
import GameTrophy from '~/components/game/GameTrophy.vue';

// 右边
import GameInfo from '~/components/game/GameInfo.vue';
import GameLinks from '~/components/game/GameLinks.vue';
import GameReleases from '~/components/game/GameReleases.vue';
import HowLongToBeat from '~/components/trophies/HowLongToBeat.vue';

const api = useApi();
const route = useRoute();
const gameId = route.params.id;

const { data } = await useAsyncData('game-' + gameId, fetchGame);
const reviews = ref(false);

if (data.value.review_count) {
  reviews.value = await useAsyncData('game-review-' + gameId, fetchReview);
}

async function fetchGame() {
  const id = route.params.id;
  const res = await api.get(`/games/get/${id}`);
  return res.data;
}

async function fetchReview() {
  const id = route.params.id;
  const res = await api.get(`/review/list?game=${id}`);
  return res.data;
}
</script>
