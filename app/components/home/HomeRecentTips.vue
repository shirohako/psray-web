<template>
  <div class="h-fit rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div class="mb-4 flex items-center gap-2 border-b border-slate-200 pb-3">
      <Icon name="mdi:lightbulb-on" class="text-xl text-amber-400" />
      <h3 class="text-[0.9375rem] font-semibold text-slate-800">{{ title }}</h3>
    </div>

    <div v-if="pending" class="py-8 text-center text-sm text-slate-400">
      <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
    </div>

    <div v-else-if="error" class="py-8 text-center text-sm text-red-500">
      {{ errorText }}
    </div>

    <div v-else-if="tips && tips.length > 0" class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <NuxtLink
        v-for="tip in tips"
        :key="tip.id"
        :to="`/trophy/${tip.trophy.id}`"
        class="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50"
      >
        <div class="shrink-0">
          <img
            :src="tip.trophy.iconUrl"
            :alt="tip.trophy.name"
            class="h-8 w-8 rounded-md object-cover shadow-sm"
          />
        </div>
        <div class="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <div class="truncate text-xs font-medium leading-snug text-slate-800">{{ tip.trophy.name }}</div>
          <div class="flex items-center gap-1 text-[0.625rem] text-slate-500">
            <img
              :src="tip.author.avatarUrl"
              :alt="tip.author.onlineId"
              class="h-3 w-3 rounded-full border border-slate-200 object-cover"
            />
            <span class="max-w-[70px] truncate font-medium">{{ tip.author.onlineId }}</span>
            <span class="text-slate-300">·</span>
            <span class="shrink-0 text-slate-400">{{ formatTime(tip.createdAt) }}</span>
          </div>
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

interface Tip {
  id: string;
  trophy: {
    id: number | string;
    name: string;
    iconUrl: string;
  };
  author: {
    onlineId: string;
    avatarUrl: string;
  };
  createdAt: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '最近发布的小贴士',
  limit: 6,
  emptyText: '暂无数据',
  errorText: '加载失败',
});

const api = useApi();

// 格式化时间
const formatTime = (dateString: string) => {
  const now = Date.now();
  const date = new Date(dateString);
  const diff = now - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return `${months}个月前`;
};

const { data: tips, pending, error } = await useAsyncData('home-recent-tips', async () => {
  try {
    const res = await api.get('/trophies/tips/recent', {
      params: {
        limit: props.limit,
      },
    });

    return (
      res.data?.tips?.map((tip: any) => ({
        id: String(tip.id),
        trophy: {
          id: tip.trophy?.id ?? '',
          name: tip.trophy?.trophyName ?? '',
          iconUrl: tip.trophy?.trophyIconUrl ?? '',
        },
        author: {
          onlineId: tip.user?.psnid ?? '',
          avatarUrl: tip.user?.avatarUrl ?? '',
        },
        createdAt: new Date(Number(tip.created_at) * 1000).toISOString(),
      })) || []
    );
  } catch (err) {
    console.error('Failed to fetch recent tips:', err);
    throw err;
  }
});
</script>
