<template>
  <div class="border rounded-md shadow-lg p-5">
    <ProfileUserInfo :profile="profile" />

    <ProfileStats :profile="profile" />

    <ProfileRewards :profile="profile" />

    <ProfileSyncInfo :sync-next="profile.sync_next" />

    <ProfileSocialAccounts :social-account="profile.social_account" />

    <Milestones :milestones="profile.milestones" v-if="profile?.milestones" />
  </div>
</template>

<script setup>
import ProfileUserInfo from './ProfileUserInfo.vue';
import ProfileStats from './ProfileStats.vue';
import ProfileRewards from './ProfileRewards.vue';
import ProfileSyncInfo from './ProfileSyncInfo.vue';
import ProfileSocialAccounts from './ProfileSocialAccounts.vue';
import Milestones from './Milestones.vue';

defineProps({
  profile: {
    type: Object,
    required: true,
  },
});
</script>
