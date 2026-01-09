<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
    <section class="mx-auto max-w-6xl px-6 pb-10 pt-12">
      <div class="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        <span class="text-slate-700">PSRay</span>
        <span class="h-3 w-px bg-slate-300" />
        <span>{{ t('announcements_page.title') }}</span>
      </div>

      <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div class="space-y-3">
          <h1 class="text-3xl font-semibold text-slate-900 md:text-4xl">{{ t('announcements_page.title') }}</h1>
          <div class="flex flex-wrap gap-2">
            <span class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <span class="h-2 w-2 rounded-full bg-cyan-500" />
              {{ t('home.announcements.type.notice') }}
            </span>
            <span class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <span class="h-2 w-2 rounded-full bg-emerald-500" />
              {{ t('home.announcements.type.update') }}
            </span>
            <span class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <span class="h-2 w-2 rounded-full bg-amber-500" />
              {{ t('home.announcements.type.feature') }}
            </span>
          </div>
        </div>

        <div class="grid w-full max-w-sm grid-cols-2 gap-3 sm:max-w-md">
          <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p class="text-xs uppercase tracking-[0.18em] text-slate-400">{{ t('announcements_page.count_label') }}</p>
            <p class="mt-2 text-3xl font-semibold text-slate-900">{{ announcements.length }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p class="text-xs uppercase tracking-[0.18em] text-slate-400">{{ t('home.announcements.title') }}</p>
            <p class="mt-2 text-base font-semibold text-slate-900">{{ latestDate || '--' }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-6 pb-14">
      <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="p-6">
          <AnnouncementList
            :announcements="announcements"
            :pending="pending"
            :error="error"
            :empty-text="t('announcements_page.empty')"
            :error-text="t('announcements_page.error')"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import AnnouncementList from '~/components/announcement/AnnouncementList.vue';

const { t } = useI18n();
const { formatTimestamp } = useTime();
const api = useApi();

useSeoMeta({
  title: t('announcements_page.title'),
  description: t('announcements_page.subtitle'),
});

const { data, pending, error } = await useAsyncData('announcements-page', async () => {
  try {
    const res = await api.get('/announcement/list');
    const items = res.data?.data?.data;
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.error('Failed to fetch announcements:', err);
    throw err;
  }
});

const announcements = computed(() => (Array.isArray(data.value) ? data.value : []));

const latestDate = computed(() => {
  const timestamps = announcements.value
    .map((item: any) => Number(item?.published_at ?? item?.updated_at ?? item?.created_at))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!timestamps.length) return '';

  const newest = Math.max(...timestamps);

  try {
    return formatTimestamp(newest).split(' ')[0];
  } catch (err) {
    return '';
  }
});
</script>
