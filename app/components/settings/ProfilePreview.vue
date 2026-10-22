<script setup lang="ts">
/**
 * The signed-in user's profile header bar with these images; mirrors
 * components/profile/Header.vue. Blank URLs show what the real header would:
 * the default banner, and the PSN avatar (or the initial when there's none).
 */
const props = defineProps<{
  bannerUrl: string
  /** A custom avatar; blank for the PSN one. */
  avatarUrl: string
}>()

const { user } = useAuth()
const appConfig = useAppConfig()

const banner = computed(() => props.bannerUrl.trim() || appConfig.profile.defaultBanner)
const avatar = computed(() => props.avatarUrl.trim() || user.value?.avatar_url || '')
const initial = computed(() => user.value?.psnid?.slice(0, 1).toUpperCase() ?? '?')
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-slate-200 ring-1 ring-slate-900/5">
    <div
      class="relative h-48 bg-slate-300 bg-cover bg-center sm:h-64"
      :style="{ backgroundImage: `url(${banner})` }"
    >
      <div class="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-black/5" />
    </div>
    <div class="px-4 pb-4">
      <img
        v-if="avatar"
        :src="avatar"
        :alt="user?.psnid"
        class="relative z-10 -mt-18 size-24 rounded-xl border-4 border-white bg-white object-cover shadow-md sm:-mt-22 sm:size-28"
      />
      <span
        v-else
        class="relative z-10 -mt-18 grid size-24 place-items-center rounded-xl border-4 border-white bg-slate-900 text-2xl font-bold text-white shadow-md sm:-mt-22 sm:size-28"
      >
        {{ initial }}
      </span>
      <h3 class="mt-3 text-lg font-bold text-slate-900">{{ user?.psnid }}</h3>
    </div>
  </div>
</template>
