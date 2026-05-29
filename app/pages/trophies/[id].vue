<template>
  <div class="max-w-screen-2xl mx-auto py-4 px-6">
    <div class="flex flex-row flex-wrap lg:flex-nowrap gap-5 items-start">
      <!-- 左侧 -->
      <div class="basis-full lg:basis-4/12 border rounded-md shadow-lg p-6 max-w-full">
        <BaseInfo :trophySet="data.trophyTitle" :trophyTitle="trophyTitle" />
        <RegionTags :trophySet="data.trophyTitle" />
        <TrophiesGameInfo :game="data.game" v-if="data.game" />
        <SimilarTrophies
          :similarTrophies="data.similarTrophies"
          v-if="data.similarTrophies?.length > 0"
        />
        <TrophiesPlayerRanking />
        <Contribute />
        <TrophiesHowLongToBeat :game="data.game" v-if="data.game" class="mt-8" />
        <RecentPlayers :recentPlayers="data.recentPlayers" v-if="data.recentPlayers?.length > 0" />
      </div>
      <!-- 右侧 -->
      <div class="basis-full lg:basis-8/12 border rounded-md shadow-lg p-3">
        <TrophiesStatistics :trophySet="trophySet" />
        <TrophiesPlayerProgress
          v-if="trackedUser?.trophySummary"
          :trackedUser="trackedUser"
          :trophySet="trophySet"
          :earnedTrophies="earnedTrophies"
          :unearnedTrophies="unearnedTrophies"
        />
        <TrophiesLanguageSwitch
          v-if="trophySet?.default_language"
          :trophySet="trophySet"
          :language="language"
          @change-language="changeTrophyLanguage"
          @default-language="defaultTrophyLanguage"
        />
        <div v-for="trophyGroup in trophyGroups" :key="trophyGroup.trophyGroupId">
          <div class="p-4 mt-2">
            <div class="flex items-center mb-4">
              <img
                src="https://i.psray.net/i/2023/09/10/64fda2bd068aa.png"
                class="mr-3"
                style="width: 28px"
              />
              <h2 class="text-lg font-medium">{{ trophyGroup.trophyTitleName }}</h2>
            </div>
            <TrophiesGroup
              :trophies="trophyGroup.trophy_list"
              :translation="data.trophyTranslation"
              :earnedTrophies="earnedTrophies"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BaseInfo from '~/components/trophies/BaseInfo.vue';
import Contribute from '~/components/trophies/Contribute.vue';
import RecentPlayers from '~/components/trophies/RecentPlayers.vue';
import RegionTags from '~/components/trophies/RegionTags.vue';
import SimilarTrophies from '~/components/trophies/SimilarTrophies.vue';

const route = useRoute();
const router = useRouter();
const language = ref(route.query.language || route.params.language);
const psnid = ref(route.query.psnid);
const api = useApi();
const { getTrophySetTitleSlug } = usePsn();

async function changeTrophyLanguage(newLanguage) {
  language.value = newLanguage.language_code;
  router.replace({
    name: route.name,
    params: {
      ...route.params,
      language: language.value,
      title: getTrophySetTitleSlug(newLanguage.localized_title),
    },
    query: route.query,
  });
  refresh();
}

async function defaultTrophyLanguage() {
  language.value = trophySet.value?.default_language;
  router.replace({
    name: route.name,
    params: {
      ...route.params,
      language: trophySet.value?.default_language,
      title: getTrophySetTitleSlug(trophySet.value?.trophyTitleName),
    },
    query: route.query,
  });
  refresh();
}

const { data, refresh } = await useAsyncData(
  'trophy-set-' + route.params.id + '-' + route.params.language,
  fetchTrophySet,
);

const trophySet = computed(() => data.value?.trophyTitle);
const trophyGroups = computed(() => data.value?.trophyGroups ?? []);

const trackedUser = computed(() => data.value?.user);

const trophyTitle = computed(() => {
  if (data.value?.trophyTranslation?.length > 0) {
    for (const translate of data.value.trophyTranslation) {
      if (translate.default_group === 1) return translate.localized_title;
    }
  }
  return trophySet.value?.trophyTitleName ?? '';
});

useSeoMeta({
  title: () => trophySet.value?.trophyTitleName ?? '',
  description: () =>
    trophySet.value
      ? `${trophySet.value.trophyTitlePlatform}游戏「${trophySet.value.trophyTitleName}」的奖杯组。`
      : '',
});

async function fetchTrophySet() {
  const res = await api.get(`/trophies/get/${route.params.id}`, {
    params: { language: language.value, psnid: psnid.value },
  });
  return normalizeTrophySetResponse(res.data);
}

function normalizeTrophySetResponse(data) {
  if (!data) return data;

  normalizeTrophySet(data.trophyTitle);
  data.trophyGroups = (data.trophyGroups ?? data.trophyTitle?.trophyGroups ?? []).map(
    normalizeTrophyGroup,
  );

  if (data.similarTrophies?.length) {
    data.similarTrophies = data.similarTrophies.map(normalizeTrophySet);
  }

  if (data.recentPlayers?.length) {
    data.recentPlayers = data.recentPlayers.map(player => {
      normalizeUserProfile(player.user_profile);
      return player;
    });
  }

  data.user = Array.isArray(data.user) ? data.user[0] : data.user;
  if (data.user) {
    normalizeUserProfile(data.user.profile);
    data.user.trophySummary = data.user.trophySummary ?? data.user.trophy_summary;
    data.user.trophyLog = data.user.trophyLog ?? data.user.trophy_log;
  }

  return data;
}

function normalizeTrophySet(trophySet) {
  if (!trophySet) return trophySet;

  trophySet.npCommunicationId = trophySet.npCommunicationId ?? trophySet.np_communication_id;
  trophySet.trophySetVersion = trophySet.trophySetVersion ?? trophySet.trophy_set_version;
  trophySet.trophyTitlePlatform = trophySet.trophyTitlePlatform ?? trophySet.trophy_title_platform;
  trophySet.trophyTitleName = trophySet.trophyTitleName ?? trophySet.trophy_title_name;
  trophySet.trophyTitleDetail = trophySet.trophyTitleDetail ?? trophySet.trophy_title_detail;
  trophySet.trophyTitleIconUrl = trophySet.trophyTitleIconUrl ?? trophySet.trophy_title_icon_url;
  trophySet.hasTrophyGroups = trophySet.hasTrophyGroups ?? trophySet.has_trophy_groups;
  trophySet.npServiceName = trophySet.npServiceName ?? trophySet.np_service_name;
  trophySet.definedTrophies = trophySet.definedTrophies ?? trophySet.defined_trophies;
  trophySet.gameId = trophySet.gameId ?? trophySet.game_id;
  trophySet.onWishlist = trophySet.onWishlist ?? trophySet.on_wishlist;
  trophySet.recentPlayers = trophySet.recentPlayers ?? trophySet.recent_players;
  trophySet.averageProgress = trophySet.averageProgress ?? trophySet.average_progress;
  trophySet.completedPlayers = trophySet.completedPlayers ?? trophySet.completed_players;
  trophySet.platinumAchievers = trophySet.platinumAchievers ?? trophySet.platinum_achievers;

  return trophySet;
}

function normalizeTrophyGroup(group) {
  if (!group) return group;

  group.npCommunicationId = group.npCommunicationId ?? group.np_communication_id;
  group.trophyGroupId = group.trophyGroupId ?? group.trophy_group_id;
  group.trophyTitleName = group.trophyTitleName ?? group.trophy_title_name;
  group.trophyTitleDetail = group.trophyTitleDetail ?? group.trophy_title_detail;
  group.trophyTitleIconUrl = group.trophyTitleIconUrl ?? group.trophy_title_icon_url;
  group.definedTrophies = group.definedTrophies ?? group.defined_trophies;
  group.trophy_list = (group.trophy_list ?? []).map(normalizeTrophy);

  return group;
}

function normalizeTrophy(trophy) {
  if (!trophy) return trophy;

  trophy.trophyGroupId = trophy.trophyGroupId ?? trophy.trophy_group_id;
  trophy.trophyType = trophy.trophyType ?? trophy.trophy_type;
  trophy.npCommunicationId = trophy.npCommunicationId ?? trophy.np_communication_id;
  trophy.npGroupId = trophy.npGroupId ?? trophy.np_group_id;
  trophy.trophyId = trophy.trophyId ?? trophy.trophy_id;
  trophy.trophyName = trophy.trophyName ?? trophy.trophy_name;
  trophy.trophyDetail = trophy.trophyDetail ?? trophy.trophy_detail;
  trophy.trophyIconUrl = trophy.trophyIconUrl ?? trophy.trophy_icon_url;
  trophy.trophyHidden = trophy.trophyHidden ?? trophy.trophy_hidden;
  trophy.trophyEarnedRate = trophy.trophyEarnedRate ?? trophy.trophy_earned_rate;

  return trophy;
}

function normalizeUserProfile(profile) {
  if (!profile) return profile;

  profile.avatarUrl = profile.avatarUrl ?? profile.avatar_url;
  profile.aboutMe = profile.aboutMe ?? profile.about_me;
  profile.trophyLevel = profile.trophyLevel ?? profile.trophy_level;

  return profile;
}

const earnedTrophies = computed(() => {
  if (!trophyGroups.value.length || !trackedUser.value?.trophyLog?.length) {
    return new Map();
  }

  const trophiesById = {};
  for (const group of trophyGroups.value) {
    for (const trophy of group.trophy_list ?? []) {
      trophiesById[trophy.id] = trophy;
    }
  }

  const earned = new Map();
  for (const t of trackedUser.value.trophyLog) {
    if (t.earned == 1) {
      earned.set(t.trophy_id, { ...trophiesById[t.trophy_id], earnedDateTime: t.earned_at });
    }
  }
  return earned;
});

const unearnedTrophies = computed(() => {
  if (!trophyGroups.value.length || !trackedUser.value?.trophyLog?.length) {
    return [];
  }

  const trophiesById = {};
  for (const group of trophyGroups.value) {
    for (const trophy of group.trophy_list ?? []) {
      trophiesById[trophy.id] = trophy;
    }
  }

  return trackedUser.value.trophyLog.filter(t => t.earned == 0).map(t => trophiesById[t.trophy_id]);
});
</script>
