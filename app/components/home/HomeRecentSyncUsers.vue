<template>
  <div class="h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
      <Icon name="material-symbols:sync" class="text-xl text-sky-500" />
      <h3 class="text-[0.9375rem] font-semibold text-slate-800">{{ title }}</h3>
    </div>

    <div v-if="pending" class="py-8 text-center text-sm text-slate-400">
      <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
    </div>

    <div v-else-if="error" class="py-8 text-center text-sm text-red-500">
      {{ errorText }}
    </div>

    <div v-else-if="users.length > 0" class="flex flex-col gap-2">
      <NuxtLink
        v-for="user in users"
        :key="user.psnid"
        :to="`/p/${user.psnid}`"
        class="flex items-center justify-between rounded-lg border border-transparent px-2 py-1.5 transition hover:border-slate-200 hover:bg-slate-50"
      >
        <div class="flex min-w-0 items-center gap-2">
          <img
            :src="user.avatarUrl"
            :alt="user.psnid"
            class="h-8 w-8 rounded-full border border-slate-200 object-cover"
          />
          <div class="min-w-0">
            <div class="truncate text-xs font-medium text-slate-800">{{ user.psnid }}</div>
          </div>
        </div>
        <div class="shrink-0 text-[0.625rem] text-slate-400">
          {{ formatUpdatedAt(user.updatedAt) }}
        </div>
      </NuxtLink>
    </div>

    <div v-else class="py-8 text-center text-sm text-slate-400">
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

interface SyncUser {
  psnid: string;
  avatarUrl: string;
  updatedAt: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: '最近被同步的玩家',
  limit: 8,
  emptyText: '暂无数据',
  errorText: '加载失败',
});

const api = useApi();
const { timeAgoShort } = useTime();

const { data, pending, error } = await useAsyncData(
  'home-recent-sync-users',
  async () => {
    try {
      const res = await api.get('/trophies/sync/recent', {
        params: {
          limit: props.limit,
        },
      });

      return (
        res.data?.users?.map((user: any) => ({
          psnid: user.psnid ?? '',
          avatarUrl: user.avatarUrl ?? '',
          updatedAt: Number(user.updated_at),
        })) || []
      );
    } catch (err) {
      console.error('Failed to fetch recent sync users:', err);
      throw err;
    }
  }
);

const users = computed(() => data.value ?? []);

const formatUpdatedAt = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '-';
  }

  return timeAgoShort(value);
};
</script>
