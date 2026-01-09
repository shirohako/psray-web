<template>
  <div class="recent-games">
    <div class="recent-games__header">
      <h3 class="recent-games__title">{{ title }}</h3>
    </div>

    <div v-if="pending" class="recent-games__loading">
      <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
    </div>

    <div v-else-if="error" class="recent-games__error">
      {{ errorText }}
    </div>

    <div v-else-if="games && games.length > 0" class="recent-games__grid">
      <NuxtLink
        v-for="game in games"
        :key="game.id"
        :to="{
          name: 'trophies-detail',
          params: {
            id: game.id,
            language: game.default_language,
            title: getTrophySetTitleSlug(game.trophyTitleName),
          },
        }"
        class="game-card"
      >
        <div class="game-card__cover-wrapper">
          <img :src="game.trophyTitleIconUrl" :alt="game.trophyTitleName" class="game-card__cover" />
          <div class="game-card__platforms">
            <span
              v-if="containsPlatform(game.trophyTitlePlatform, 'PS4')"
              class="platform-badge platform-badge--ps4"
            >
              PS4
            </span>
            <span
              v-if="containsPlatform(game.trophyTitlePlatform, 'PS5')"
              class="platform-badge platform-badge--ps5"
            >
              PS5
            </span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="recent-games__empty">
      {{ emptyText }}
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  limit?: number;
  emptyText?: string;
  errorText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '最近添加',
  limit: 10,
  emptyText: '暂无数据',
  errorText: '加载失败',
});

const api = useApi();
const { getTrophySetTitleSlug } = usePsn();
const { containsPlatform } = useGame();

// 获取最近添加的游戏列表
const { data: games, pending, error } = await useAsyncData(
  'home-recent-games',
  async () => {
    try {
      const res = await api.get('/trophies/overview');
      // 从 recently_added_trophy 中取前 N 个游戏
      return res.data?.recently_added_trophy?.slice(0, props.limit) || [];
    } catch (err) {
      console.error('Failed to fetch recent games:', err);
      throw err;
    }
  }
);
</script>

<style scoped>
.recent-games {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  border: 1px solid #f1f1f4;
}

.recent-games__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgb(229 231 235);
}

.recent-games__icon {
  font-size: 1.5rem;
  color: rgb(34 197 94);
}

.recent-games__title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(30 41 59);
}

.recent-games__loading,
.recent-games__error,
.recent-games__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: rgb(156 163 175);
  font-size: 0.875rem;
}

.recent-games__error {
  color: rgb(239 68 68);
}

.recent-games__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .recent-games__grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .recent-games__grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (min-width: 1280px) {
  .recent-games__grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

.game-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  transition: transform 0.2s;
}

.game-card:hover {
  transform: translateY(-4px);
}

.game-card__cover-wrapper {
  position: relative;
}

.game-card__cover {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.1);
}

.game-card:hover .game-card__cover {
  box-shadow: 0 4px 8px 0 rgb(0 0 0 / 0.15);
}

.game-card__platforms {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  display: flex;
  gap: 0.25rem;
}

.platform-badge {
  font-size: 0.5rem;
  font-weight: 700;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
}

.platform-badge--ps4 {
  background-color: rgba(224, 242, 254, 0.9);
  color: rgb(3 105 161);
}

.platform-badge--ps5 {
  background-color: rgba(219, 234, 254, 0.9);
  color: rgb(29 78 216);
}
</style>
