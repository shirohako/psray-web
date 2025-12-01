<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-5"
      :style="{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }"
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      <div class="mx-auto max-w-5xl rounded-lg border border-gray-200 bg-white shadow-lg">
        <div
          class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5"
        >
          <p class="text-sm text-gray-700 sm:flex-1">
            {{ message }}
            <NuxtLink
              to="/policies/privacy"
              class="underline hover:no-underline"
              v-if="learnMoreLabel"
            >
              {{ learnMoreLabel }}
            </NuxtLink>
          </p>
          <div
            class="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:shrink-0 sm:flex-none sm:min-w-[220px]"
          >
            <button
              type="button"
              class="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 sm:px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto whitespace-nowrap"
              @click="dismiss(false)"
            >
              {{ rejectLabel }}
            </button>
            <button
              type="button"
              class="inline-flex min-h-10 items-center justify-center rounded-md bg-blue-600 px-4 sm:px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 w-full sm:w-auto whitespace-nowrap"
              @click="dismiss(true)"
            >
              {{ acceptLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
const { t: $t } = useI18n();

const t = (key: string, fallback: string) => {
  try {
    return $t(key);
  } catch {
    return fallback;
  }
};

const consent = useCookie<string | null>('cookie_consent', {
  path: '/',
  sameSite: 'lax',
  // 365 days
  maxAge: 60 * 60 * 24 * 365,
});

const visible = computed(() => !consent.value);

const message = computed(() =>
  t('cookie.banner.message', '我们使用 Cookie 来改进网站体验。继续浏览即表示你同意使用 Cookie。'),
);
const acceptLabel = computed(() => t('cookie.banner.accept', '接受'));
const rejectLabel = computed(() => t('cookie.banner.reject', '拒绝'));
const learnMoreLabel = computed(() => t('cookie.banner.learn_more', '了解更多'));

function dismiss(accepted: boolean) {
  consent.value = accepted ? 'accepted' : 'rejected';
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
