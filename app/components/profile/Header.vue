<script setup lang="ts">
import { Crown, LockKeyhole } from 'lucide'
import type { Profile } from '~/services/profile'

const props = defineProps<{ profile: Profile, followPending?: boolean }>()
defineEmits<{ toggleFollow: [] }>()

// Banner image: per-user custom banner, else the global default from `app.config.ts`.
const appConfig = useAppConfig()
const bannerImage = computed(() => props.profile.banner_url || appConfig.profile.defaultBanner)
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <!-- Banner. The image sits on its own layer so a private profile can mute
         it (desaturated, a little darker) without touching the badges. -->
    <div class="relative h-48 overflow-hidden bg-slate-300 sm:h-64">
      <div
        class="absolute inset-0 bg-cover bg-center transition duration-500"
        :class="{ 'scale-105 saturate-[.35] brightness-90': !profile.is_profile_public }"
        :style="{ backgroundImage: `url(${bannerImage})` }"
      />
      <div class="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-black/5" />
      <div v-if="!profile.is_profile_public" class="absolute inset-0 bg-linear-to-br from-slate-900/30 via-transparent to-slate-900/20" />

      <!-- Top-left: private marker, frosted to sit on any banner -->
      <span
        v-if="!profile.is_profile_public"
        class="absolute left-4 top-4 z-10 inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/25 backdrop-blur-md"
      >
        <LucideIcon :icon="LockKeyhole" class="size-4" />
        {{ $t('profile.private.badge') }}
      </span>

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
      <template v-if="profile.is_profile_public">
        <ProfileHeaderStats :profile="profile" class="mt-4" />
        <ProfileHeaderTrophySummary :profile="profile" class="mt-3" />
      </template>
      <!-- Private: the ranks and trophy totals come back zeroed, so the row
           keeps its shape with the figures redacted and says why. -->
      <ProfileHeaderPrivateSummary v-else class="mt-4" />
    </div>
  </section>
</template>
