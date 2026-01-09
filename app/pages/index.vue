<template>
  <div class="home-page">
    <HomeHeader :title="$t('home.title')" :descriptions="headerDescriptions" />

    <div class="home-page__content">
      <div class="home-page__column">
        <HomeAnnouncementCard
          :title="$t('home.announcements.title')"
          :announcements="announcements"
          :empty-text="$t('home.announcements.empty')"
        />

        <HomeRecentSyncUsers
          :title="$t('home.recent_sync.title')"
          :limit="8"
          :empty-text="$t('home.recent_sync.empty')"
          :error-text="$t('home.recent_sync.error')"
        />
      </div>

      <div class="home-page__column">
        <HomeHotGames
          :title="$t('home.hot_games.title')"
          :limit="8"
          :empty-text="$t('home.hot_games.empty')"
          :error-text="$t('home.hot_games.error')"
          :players-text="$t('home.hot_games.players')"
        />

        <HomeRecentGames
          :title="$t('home.recent_games.title')"
          :limit="8"
          :empty-text="$t('home.recent_games.empty')"
          :error-text="$t('home.recent_games.error')"
        />

        <HomeRecentTips
          :title="$t('home.recent_tips.title')"
          :limit="6"
          :empty-text="$t('home.recent_tips.empty')"
          :error-text="$t('home.recent_tips.error')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HomeAnnouncementCard from '~/components/home/HomeAnnouncementCard.vue';
import HomeHeader from '~/components/home/HomeHeader.vue';
import HomeHotGames from '~/components/home/HomeHotGames.vue';
import HomeRecentGames from '~/components/home/HomeRecentGames.vue';
import HomeRecentTips from '~/components/home/HomeRecentTips.vue';
import HomeRecentSyncUsers from '~/components/home/HomeRecentSyncUsers.vue';

const { t } = useI18n();

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

// 从后端获取公告数据
const api = useApi();
const { data: announcementData } = await useAsyncData(
  'home-announcements',
  async () => {
    try {
      const res = await api.get('/announcement/list');
      const items = res.data?.data?.data;
      return Array.isArray(items) ? items : [];
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      return [];
    }
  }
);

// 格式化公告数据，只显示最新的3个
const announcements = computed(() => {
  if (!Array.isArray(announcementData.value) || announcementData.value.length === 0) {
    return [];
  }

  return announcementData.value.slice(0, 3).map((item: any) => {
    // 格式化日期
    let formattedDate = '';
    if (item.published_at) {
      const dateStr = new Date(item.published_at * 1000).toISOString().split('T')[0];
      formattedDate = dateStr || '';
    }

    return {
      id: item.id,
      type: t('home.announcements.type.notice'),
      title: item.title || '',
      date: formattedDate,
    };
  });
});
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 64px);
  background-color: rgb(243 244 246);
  padding-bottom: 3rem;
}

.home-page__content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.25rem;
  margin-top: -4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .home-page__content {
    flex-direction: row;
    align-items: start;
  }
}

.home-page__column {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.home-page__column:first-child {
  flex: 0 0 auto;
}

.home-page__column:last-child {
  flex: 1;
}

@media (min-width: 1024px) {
  .home-page__column:first-child {
    width: 320px;
  }
}
</style>
