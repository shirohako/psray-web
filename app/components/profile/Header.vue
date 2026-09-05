<script setup lang="ts">
import { Crown } from 'lucide'
import type { Profile } from '~/services/profile'

const props = defineProps<{ profile: Profile, followPending?: boolean }>()
defineEmits<{ toggleFollow: [] }>()

// Banner image: per-user custom banner, else the global default from `app.config.ts`.
const appConfig = useAppConfig()
const bannerImage = computed(() => props.profile.banner_url || appConfig.profile.defaultBanner)
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <!-- Banner -->
    <div
      class="relative h-48 bg-slate-300 bg-cover bg-center sm:h-64"
      :style="{ backgroundImage: `url(${bannerImage})` }"
    >
      <div class="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-black/5" />

      <!-- Top-right badges -->
      <div class="absolute right-4 top-4 z-10 flex items-center gap-2">
        <Tooltip v-if="profile.is_plus" :content="$t('profile.identity.notRealtime')" placement="bottom">
          <span class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-400/95 px-3 text-sm font-bold text-amber-950 shadow-sm backdrop-blur-md">
            <LucideIcon :icon="Crown" class="size-4" /> PS+
          </span>
        </Tooltip>
        <CardPreviewButton
          v-if="profile.is_profile_public"
          kind="profile"
          :slug="profile.psnid.toLowerCase()"
          :caption="profile.psnid"
        />
        <QrCodeButton :title="$t('profile.qrTitle')" :caption="profile.psnid" />
      </div>

      <ProfileHeaderActions
        :profile="profile"
        :follow-pending="followPending"
        @toggle-follow="$emit('toggleFollow')"
      />
    </div>

    <!-- Body -->
    <div class="px-4 pb-5 sm:px-6">
      <ProfileHeaderIdentity :profile="profile" />
      <ProfileHeaderStats :profile="profile" class="mt-4" />
      <ProfileHeaderTrophySummary :profile="profile" class="mt-3" />

      <!-- Private profile notice (replaces the hidden trophy columns below) -->
      <PrivateProfileNotice v-if="!profile.is_profile_public" class="mt-5" />
    </div>
  </section>
</template>
