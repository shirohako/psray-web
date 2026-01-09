<template>
  <div class="space-y-4">
    <div
      v-if="pending"
      class="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-slate-500"
    >
      <ProgressSpinner style="width: 32px; height: 32px" strokeWidth="4" />
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-100 bg-red-50 px-6 py-8 text-center text-sm font-medium text-red-600"
    >
      {{ errorText }}
    </div>

    <div v-else-if="announcements.length > 0" class="space-y-4">
      <AnnouncementItem
        v-for="announcement in announcements"
        :key="announcement.id ?? `${announcement.title}-${announcement.published_at}`"
        :announcement="announcement"
      />
    </div>

    <div
      v-else
      class="rounded-xl border border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500"
    >
      {{ emptyText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import AnnouncementItem from '~/components/announcement/AnnouncementItem.vue';

interface Props {
  announcements: any[];
  pending?: boolean;
  error?: boolean | Error | null;
  emptyText?: string;
  errorText?: string;
}

withDefaults(defineProps<Props>(), {
  announcements: () => [],
  pending: false,
  error: null,
  emptyText: '暂无公告',
  errorText: '加载失败',
});
</script>
