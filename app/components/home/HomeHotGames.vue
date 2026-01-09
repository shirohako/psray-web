<template>
  <div class="hot-games">
    <div class="hot-games__header">
      <Icon name="material-symbols:trending-up" class="hot-games__icon" />
      <h3 class="hot-games__title">{{ title }}</h3>
    </div>

    <div v-if="pending" class="hot-games__loading">
      <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
    </div>

    <div v-else-if="error" class="hot-games__error">
      {{ errorText }}
    </div>

    <div v-else-if="games && games.length > 0" class="hot-games__grid">
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
        <img :src="game.trophyTitleIconUrl" :alt="game.trophyTitleName" class="game-card__cover" />
        <h4 class="game-card__title">{{ game.trophyTitleName }}</h4>
      </NuxtLink>
    </div>

    <div v-else class="hot-games__empty">
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
  playersText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '热门游戏',
  limit: 10,
  emptyText: '暂无数据',
  errorText: '加载失败',
  playersText: '人在玩',
});

const api = useApi();
const { getTrophySetTitleSlug } = usePsn();

// 获取热门游戏列表
const { data: games, pending, error } = await useAsyncData(
  'home-hot-games',
  async () => {
    try {
      const res = await api.get('/trophies/overview');
      // 从 popular_games_last_week 中取前 N 个游戏
      return res.data?.popular_games_last_week?.slice(0, props.limit) || [];
    } catch (err) {
      console.error('Failed to fetch hot games:', err);
      throw err;
    }
  }
);
</script>

<style scoped>
.hot-games {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  border: 1px solid #f1f1f4;
}

.hot-games__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgb(229 231 235);
}

.hot-games__icon {
  font-size: 1.5rem;
  color: rgb(239 68 68);
}

.hot-games__title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(30 41 59);
}

.hot-games__loading,
.hot-games__error,
.hot-games__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: rgb(156 163 175);
  font-size: 0.875rem;
}

.hot-games__error {
  color: rgb(239 68 68);
}

.hot-games__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .hot-games__grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .hot-games__grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (min-width: 1280px) {
  .hot-games__grid {
    grid-template-columns: repeat(8, 1fr);
  }
}

.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  text-decoration: none;
  transition: transform 0.2s;
}

.game-card:hover {
  transform: translateY(-4px);
}

.game-card__cover {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.1);
  margin-bottom: 0.5rem;
}

.game-card:hover .game-card__cover {
  box-shadow: 0 4px 8px 0 rgb(0 0 0 / 0.15);
}

.game-card__title {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(30 41 59);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
