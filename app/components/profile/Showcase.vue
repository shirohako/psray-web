<script setup lang="ts">
import type { Profile, ShowcaseKey } from '~/services/profile'

/**
 * One profile showcase, picked by key. The API only lists showcases that are
 * on and have something to show (`profile.showcases`); each branch still
 * checks its data, so a stale or partial response renders nothing rather than
 * an empty card.
 */
defineProps<{ showcase: ShowcaseKey; profile: Profile; psnid: string }>()
</script>

<template>
  <ProfileTrophyCalendar v-if="showcase === 'calendar' && profile.calendar?.length" :calendar="profile.calendar" />
  <ProfileShowcaseRarest
    v-else-if="showcase === 'rarest' && profile.rarest_trophies?.length"
    :psnid="psnid"
    :trophies="profile.rarest_trophies"
  />
  <ProfileShowcaseFeatured
    v-else-if="showcase === 'featured' && profile.featured_trophies?.length"
    :psnid="psnid"
    :trophies="profile.featured_trophies"
  />
  <ProfileRecentTips
    v-else-if="showcase === 'tips' && profile.recent_tips"
    :psnid="psnid"
    :tip-count="profile.tip_count"
    :tips="profile.recent_tips"
  />
  <ProfileSocialCard v-else-if="showcase === 'social'" :profile="profile" />
</template>
