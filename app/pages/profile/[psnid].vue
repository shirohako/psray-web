<template>
  <ProfileNotFound v-if="error || !profile" :psnid="psnid" />
  <div v-else class="max-w-screen-2xl mx-auto py-4 px-6">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-y-5 lg:gap-x-5">
      <div class="col-span-1">
        <ProfileSidebar :profile="profile" />
      </div>
      <div class="col-span-3">
        <ProfileOverview :profile="profile" />

        <ProfileGameList :psnid="profile.psnid" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';
import _ from 'lodash';

import ProfileNotFound from '~/components/profile/ProfileNotFound.vue';
import ProfileSidebar from '~/components/profile/ProfileSidebar.vue';
import ProfileOverview from '~/components/profile/ProfileOverview.vue';
import ProfileGameList from '~/components/profile/ProfileGameList.vue';

const { t } = useI18n();
const api = useApi();
const route = useRoute();
const psnid = route.params.psnid;

const { data: profile, error } = await useAsyncData(
  'profile',
  async () => {
    const res = await api.get(`/profile/get/${psnid}`);
    return res.data;
  },
  {
    transform: profile => {
      if (!profile) return null;

      const { bronze, silver, gold, platinum } = profile;
      if (profile.sync_next > 0) {
        profile.sync_next = format(fromUnixTime(profile.sync_next + 60), 'yyyy-MM-dd HH:mm');
      } else {
        profile.sync_next = t('profile.auto_update_disabled');
      }
      profile.updated_at = format(fromUnixTime(profile.updated_at), 'yyyy-MM-dd HH:mm:ss');
      profile.first_trophy = format(fromUnixTime(profile.first_trophy), 'yyyy-MM-dd HH:mm');
      profile.last_trophy = format(fromUnixTime(profile.last_trophy), 'yyyy-MM-dd HH:mm:ss');
      profile.trophyLevel = profile.trophyLevel ?? profile.trophy_level;
      profile.avatarUrl = profile.avatarUrl ?? profile.avatar_url;
      profile.aboutMe = profile.aboutMe ?? profile.about_me;
      profile.earnedTrophiesCount = bronze + silver + gold + platinum;
      profile.completionRate = `${((profile.completed_games / profile.games_played) * 100).toFixed(
        1,
      )}%`;

      if (profile?.milestones) {
        profile.milestones = _.orderBy(profile.milestones, ['earned_at'], ['desc']);
      }

      return profile;
    },
  },
);

if (profile.value) {
  useSeoMeta({
    title: `${psnid}'s PSN Profile`,
    description: `${psnid}的PSN个人主页。${psnid}最近正在玩的游戏，奖杯和排名。`,
  });
} else {
  const event = useRequestEvent();

  // event will be undefined in the browser
  if (event) {
    // Set the status code to 404 for a custom 404 page
    setResponseStatus(event, 404);
  }
}
</script>

<style scoped>
@media (min-width: 1024px) {
  .PS5 > .hanamaru {
    bottom: 25%;
  }

  .PS4 > .hanamaru {
    bottom: 15%;
  }
}

.milestones-expand-btn {
  position: absolute;
  bottom: 0;
  z-index: 10;
  width: 100%;
  padding: 3px 0;
  background: linear-gradient(180deg, rgba(246, 248, 250, 0.6), rgba(246, 248, 250, 0.9));
  text-align: center;
  cursor: pointer;
}
</style>
