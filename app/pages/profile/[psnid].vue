<template>
  <ProfileNotFound v-if="error || !profile" :psnid="psnid" />
  <div v-else class="max-w-screen-2xl mx-auto py-4 px-6">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-y-5 lg:gap-x-5">
      <div class="col-span-1">
        <ProfileSidebar :profile="profile" />
      </div>
      <div class="col-span-3">
        <ProfileOverview :profile="profile" />

        <ProfileGameList
          :recently-played="play.recentlyPlayed"
          :psnid="profile.psnid"
          :total-records="totalRecords"
          :offset="offset"
          @page-change="changePage"
        />
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
const router = useRouter();
const psnid = route.params.psnid;
const currentPage = ref(route.query.page || 1);

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

const { data: play, refresh } = await useAsyncData(
  psnid + '-play-' + currentPage.value,
  async () => {
    if (!profile.value) return { recentlyPlayed: [], totalPages: 0 };

    const res = await api.get(`/profile/play?psnid=${psnid}`, {
      params: { page: currentPage.value },
    });
    return res.data;
  },
  {
    transform: data => {
      data.recentlyPlayed.forEach(game => {
        game.last_updated_at = format(fromUnixTime(game.last_updated_at), 'yyyy-MM-dd HH:mm:ss');
        if (Object.prototype.hasOwnProperty.call(game, 'trophySet')) {
          const { owners, platinum_achievers, completed_players, trophyTitlePlatform } =
            game.trophySet;
          game.trophySet.platform = trophyTitlePlatform.split(',');
          if (owners !== 0) {
            game.trophySet.platinumRate = ((platinum_achievers / owners) * 100).toFixed(1);
            if (completed_players != platinum_achievers) {
              game.trophySet.completedRate = ((completed_players / owners) * 100).toFixed(1);
            }
          } else {
            game.trophySet.platinumRate = 0.0;
          }
        }
      });
      return data;
    },
  },
);

function changePage(PageState) {
  currentPage.value = PageState.page + 1;
  router.push({
    name: route.name,
    query: { ...route.query, page: currentPage.value },
  });
  refresh();
}

const offset = computed({
  get() {
    return (currentPage.value - 1) * 50;
  },
  set(newValue) {
    return (currentPage.value = newValue / 50 - 1);
  },
});

const totalRecords = computed(() => {
  return play.value?.totalPages ? play.value.totalPages * 50 : 0;
});
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
