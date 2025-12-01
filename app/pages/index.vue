<template>
  <div class="home-page">
    <HomeHeader :title="$t('home.title')" :descriptions="headerDescriptions" />

    <div class="home-page__content">
      <div class="home-page__main">
        <HomeSyncCard
          :title="{
            line1: $t('home.card_1.text_1'),
            line2: $t('home.card_1.text_2'),
          }"
          :button-text="$t('home.sync_psn_account')"
        />

        <HomeAuthCard
          v-if="!authenticated"
          class="mt-5"
          :title="{
            line1: $t('home.card_2.text_1'),
            line2: $t('home.card_2.text_2'),
          }"
          :login-text="$t('common.login')"
          :signup-text="$t('common.sign_up_now')"
        />

        <HomeProfileCard
          v-else
          class="mt-5"
          :title="$t('home.card_2.logged_in_text')"
          :ranking-label="$t('home.card_2.my_ranking')"
          :user="user"
        />
      </div>

      <HomeFunctionGrid :cards="functionCards" />
    </div>
  </div>
</template>

<script setup lang="ts">
import HomeAuthCard from '~/components/home/HomeAuthCard.vue';
import HomeFunctionGrid from '~/components/home/HomeFunctionGrid.vue';
import HomeHeader from '~/components/home/HomeHeader.vue';
import HomeProfileCard from '~/components/home/HomeProfileCard.vue';
import HomeSyncCard from '~/components/home/HomeSyncCard.vue';

const { t } = useI18n();
const userStore = useUserStore();
const { authenticated, user } = storeToRefs(userStore);

useSeoMeta({
  description: '源于玩家，服务玩家。',
});

const headerDescriptions = computed(() => [
  {
    icon: 'carbon:game-wireless',
    text: t('home.description_1'),
  },
  {
    icon: 'solar:danger-triangle-outline',
    text: t('home.description_2'),
  },
]);

const functionCards = computed(() => [
  {
    title: t('home.function_card.player_leaderboard'),
    icon: 'ph:ranking',
    color: 'text-blue-500',
    link: '/leaderboard',
  },
  {
    title: t('home.function_card.search_trophies'),
    icon: 'uil:trophy',
    color: 'text-green-500',
    link: '/trophies/overview',
  },
  {
    title: t('home.function_card.rate_games'),
    icon: 'carbon:review',
  },
  {
    title: t('home.function_card.game_walkthroughs'),
    icon: 'ph:note-blank-bold',
  },
  {
    title: t('home.function_card.find_friends'),
    icon: 'material-symbols:person-add-outline-rounded',
  },
  {
    title: t('home.function_card.find_answers'),
    icon: 'ph:question-bold',
  },
]);
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 64px);
  background-color: rgb(243 244 246);
}

.home-page__content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.25rem;
  margin-top: -4rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .home-page__content {
    flex-wrap: nowrap;
    flex-direction: row-reverse;
  }
}

.home-page__main {
  width: 100%;
}

@media (min-width: 768px) {
  .home-page__main {
    width: 66.666667%;
  }
}
</style>
