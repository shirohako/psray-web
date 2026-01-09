<template>
  <div class="announcement-card">
    <div class="announcement-card__header">
      <Icon name="material-symbols:campaign-outline" class="announcement-card__icon" />
      <h3 class="announcement-card__title">{{ title }}</h3>
    </div>

    <div class="announcement-card__list">
      <div
        v-for="announcement in announcements"
        :key="announcement.id"
        class="announcement-item"
      >
        <div class="announcement-item__header">
          <div class="announcement-item__badge">
            {{ announcement.type }}
          </div>
          <span class="announcement-item__date">{{ announcement.date }}</span>
        </div>
        <h4 class="announcement-item__title">{{ announcement.title }}</h4>
      </div>

      <div v-if="announcements.length === 0" class="announcement-empty">
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Announcement {
  id: number;
  type: string;
  title: string;
  date: string;
}

interface Props {
  title?: string;
  announcements?: Announcement[];
  emptyText?: string;
}

withDefaults(defineProps<Props>(), {
  title: '最近公告',
  announcements: () => [],
  emptyText: '暂无公告',
});
</script>

<style scoped>
.announcement-card {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  border: 1px solid #f1f1f4;
}

.announcement-card__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgb(229 231 235);
}

.announcement-card__icon {
  font-size: 1.5rem;
  color: rgb(37 99 235);
}

.announcement-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(30 41 59);
}

.announcement-card__list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.announcement-item {
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: rgb(249 250 251);
  transition: all 0.2s;
  cursor: pointer;
}

.announcement-item:hover {
  background-color: rgb(243 244 246);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.announcement-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.announcement-item__badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
  background-color: rgb(37 99 235);
  color: white;
}

.announcement-item__date {
  font-size: 0.75rem;
  color: rgb(107 114 128);
}

.announcement-item__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(30 41 59);
  line-height: 1.4;
}

.announcement-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: rgb(156 163 175);
  font-size: 0.875rem;
}
</style>
