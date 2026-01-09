<template>
  <div class="active-users">
    <div class="active-users__header">
      <Icon name="mdi:account-group" class="active-users__icon" />
      <h3 class="active-users__title">{{ title }}</h3>
    </div>

    <div v-if="pending" class="active-users__loading">
      <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
    </div>

    <div v-else-if="error" class="active-users__error">
      {{ errorText }}
    </div>

    <div v-else-if="users && users.length > 0" class="active-users__list">
      <NuxtLink
        v-for="user in users"
        :key="user.accountId"
        :to="`/profile/${user.accountId}`"
        class="user-item"
      >
        <img :src="user.avatarUrl" :alt="user.onlineId" class="user-item__avatar" />
        <div class="user-item__info">
          <div class="user-item__name">{{ user.onlineId }}</div>
          <div class="user-item__stats">
            <Icon name="mdi:trophy" class="user-item__icon" />
            <span>{{ user.earnedTrophies?.bronze || 0 }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="active-users__empty">
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

interface User {
  accountId: string;
  onlineId: string;
  avatarUrl: string;
  earnedTrophies: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  title: '活跃用户',
  limit: 5,
  emptyText: '暂无数据',
  errorText: '加载失败',
});

// 模拟活跃用户数据
const mockUsers = [
  {
    accountId: 'mock-user-1',
    onlineId: 'ProGamer2024',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    earnedTrophies: {
      bronze: 156,
      silver: 89,
      gold: 42,
      platinum: 12,
    },
  },
  {
    accountId: 'mock-user-2',
    onlineId: 'TrophyHunter',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    earnedTrophies: {
      bronze: 234,
      silver: 145,
      gold: 67,
      platinum: 23,
    },
  },
  {
    accountId: 'mock-user-3',
    onlineId: 'EldenLord',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    earnedTrophies: {
      bronze: 198,
      silver: 112,
      gold: 54,
      platinum: 18,
    },
  },
  {
    accountId: 'mock-user-4',
    onlineId: 'SpiderManFan',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
    earnedTrophies: {
      bronze: 287,
      silver: 178,
      gold: 89,
      platinum: 31,
    },
  },
  {
    accountId: 'mock-user-5',
    onlineId: 'GodOfWarrior',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    earnedTrophies: {
      bronze: 312,
      silver: 201,
      gold: 98,
      platinum: 42,
    },
  },
  {
    accountId: 'mock-user-6',
    onlineId: 'HorizonZero',
    avatarUrl: 'https://i.pravatar.cc/150?img=6',
    earnedTrophies: {
      bronze: 167,
      silver: 95,
      gold: 38,
      platinum: 9,
    },
  },
  {
    accountId: 'mock-user-7',
    onlineId: 'LastOfUs_Pro',
    avatarUrl: 'https://i.pravatar.cc/150?img=7',
    earnedTrophies: {
      bronze: 245,
      silver: 156,
      gold: 72,
      platinum: 27,
    },
  },
  {
    accountId: 'mock-user-8',
    onlineId: 'GhostOfTsushima',
    avatarUrl: 'https://i.pravatar.cc/150?img=8',
    earnedTrophies: {
      bronze: 189,
      silver: 118,
      gold: 61,
      platinum: 15,
    },
  },
];

// 模拟加载延迟
const pending = ref(true);
const error = ref(false);
const users = ref<User[]>([]);

onMounted(() => {
  setTimeout(() => {
    users.value = mockUsers.slice(0, props.limit);
    pending.value = false;
  }, 500);
});
</script>

<style scoped>
.active-users {
  background-color: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  border: 1px solid #f1f1f4;
}

.active-users__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgb(229 231 235);
}

.active-users__icon {
  font-size: 1.5rem;
  color: rgb(59 130 246);
}

.active-users__title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(30 41 59);
}

.active-users__loading,
.active-users__error,
.active-users__empty {
  text-align: center;
  padding: 2rem 1rem;
  color: rgb(156 163 175);
  font-size: 0.875rem;
}

.active-users__error {
  color: rgb(239 68 68);
}

.active-users__list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  text-decoration: none;
  transition: background-color 0.2s;
}

.user-item:hover {
  background-color: rgb(249 250 251);
}

.user-item__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-item__info {
  flex: 1;
  min-width: 0;
}

.user-item__name {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(30 41 59);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-item__stats {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: rgb(107 114 128);
  margin-top: 0.125rem;
}

.user-item__icon {
  font-size: 0.875rem;
  color: rgb(202 138 4);
}
</style>
