<template>
  <div class="max-w-screen-2xl mx-auto py-4 px-6">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-y-5 lg:gap-x-5">
      <div class="col-span-1">
        <!-- 左侧 -->
        <div class="border rounded-md shadow-lg p-5">
          <!-- 头像/用户ID/私信/关注 -->
          <div class="flex flex-col">
            <div class="w-full flex justify-center items-center">
              <img
                :src="profile.avatarUrl"
                class="rounded-full"
                style="max-width: 130px; width: 75%"
              />
            </div>
            <div class="text-2xl font-medium text-center my-2">
              {{ profile.psnid }}
            </div>
            <div class="mb-3 text-xs text-center" v-if="profile?.is_follower === true">
              <span class="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-800">
                {{ $t('profile.follow_you_back') }}
              </span>
            </div>
            <div class="mb-3 text-sm text-center" v-if="profile.aboutMe">
              {{ profile.aboutMe }}
            </div>
            <div class="grid">
              <button
                v-if="profile?.is_following === undefined || profile?.is_following === false"
                class="bg-violet-500 py-1.5 text-white rounded-md"
                @click="followThisUser(1)"
              >
                {{ $t('profile.follow') }}
              </button>
              <div
                v-else
                class="relative py-1.5 text-white rounded-md flex items-center cursor-pointer bg-violet-500 hover:bg-violet-600"
                @click="followMenuToggle"
              >
                <div class="grow text-center">{{ $t('profile.followed') }}</div>
                <Icon name="ic:baseline-keyboard-arrow-down" class="absolute right-0 w-8"></Icon>
              </div>
              <!-- 取消关注菜单 -->
              <Menu ref="followMenu" id="overlay_menu" :popup="true">
                <template #start>
                  <div class="pt-1 px-1">
                    <button
                      class="block w-full p-1 rounded-md text-center text-sm font-medium bg-red-400 hover:bg-red-500 text-white"
                      @click="followThisUser(-1)"
                    >
                      {{ $t('profile.unfollow') }}
                    </button>
                  </div>
                </template>
              </Menu>
              <!-- 同步按钮 -->
              <button
                class="text-gray-600 rounded-md border-solid border-2 px-6 py-1 border-gray-400 hover:bg-slate-100 mt-2 cursor-pointer"
                @click="router.push(`/sync?psnid=${route.params.psnid}`)"
              >
                {{ $t('profile.sync_psn_trophies') }}
              </button>
            </div>
          </div>

          <!-- 关注数/页面浏览数/粉丝量 -->
          <div class="mt-5">
            <div class="flex justify-between items-center">
              <span>{{ $t('profile.registered') }}</span>
              <Icon name="mdi:check-decagram" :class="{ 'text-green-500': profile.joined_at }" />
            </div>
            <div class="flex justify-between items-center">
              <span>{{ $t('profile.page_view') }}</span>
              <span>{{ profile.page_view }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span>{{ $t('profile.following') }}</span>
              <span>{{ profile.following }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span>{{ $t('profile.followers') }}</span>
              <span>{{ profile.followers }}</span>
            </div>
          </div>

          <!-- 用户已获得的奖励 -->
          <div class="mt-2 pt-4 border-t">
            <div class="font-semibold text-lg flex items-center">
              <img
                src="https://i.psray.net/i/2024/07/19/669a429dc981f.png"
                class="w-7 inline-block mr-2"
              />
              <span>{{ $t('profile.contribution_rewards') }}</span>
            </div>
            <div class="flex flex-col">
              <div class="mt-2 flex items-center">
                <img
                  src="https://i.psray.net/i/2024/07/17/6696acf994b94.png"
                  class="w-5 inline-block mr-2"
                />
                <span> {{ $t('profile.star_piece') }}： {{ profile.star_piece }} </span>
              </div>
              <div class="mt-2 flex items-center">
                <img
                  src="https://i.psray.net/i/2024/07/17/6696afa80d3c4.png"
                  class="w-5 inline-block mr-2"
                />
                <span> {{ $t('profile.rare_candy') }}： {{ profile.rare_candy }} </span>
              </div>
              <div class="mt-2 flex items-center">
                <img
                  src="https://i.psray.net/i/2024/08/02/66ac21691a054.png"
                  class="w-5 inline-block mr-2"
                />
                <span>
                  {{ $t('profile.philosophers_stone') }}：
                  {{ profile.philosophers_stone }}
                </span>
              </div>
              <div class="mt-2 flex items-center">
                <img
                  src="https://i.psray.net/i/2024/08/02/66ac244902d7c.png"
                  class="w-5 inline-block mr-2"
                />
                <span> {{ $t('profile.mira') }} ： {{ profile.mira }} </span>
              </div>
            </div>
          </div>

          <!-- 下次更新时间 -->
          <div class="mt-2 pt-4 border-t">
            <div class="flex flex-col">
              <div class="font-semibold text-lg">
                <img
                  src="https://i.psray.net/i/2024/05/24/664fa33d373ac.png"
                  class="w-7 inline-block mr-2"
                />
                <span>{{ $t('profile.next_auto_update_time') }}</span>
              </div>
              <div class="mt-2 flex items-center">
                {{ profile.sync_next }}
              </div>
            </div>
          </div>

          <!-- 关联游戏账号 -->
          <div class="mt-2 pt-4 border-t">
            <div class="flex items-center mb-6">
              <img
                src="https://i.psray.net/i/2023/09/05/64f74dad35bb7.png"
                class="mr-2"
                style="width: 28px"
              />
              <span class="text-base font-semibold">
                {{ $t('profile.linked_game_account') }}
              </span>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col xl:flex-row justify-between items-center gap-2">
                <div class="flex items-center gap-1">
                  <img src="https://i.psray.net/i/2023/09/06/64f756118b73e.png" class="size-5" />
                  <span class="font-semibold">Steam</span>
                </div>

                <span class="text-sm" v-if="!profile.social_account?.steam"> - </span>
                <a :href="steamLink" target="_blank" v-else>
                  {{ profile.social_account?.steam }}
                </a>
              </div>
              <div class="flex flex-col xl:flex-row justify-between items-center gap-2">
                <div class="flex items-center gap-1">
                  <img src="https://i.psray.net/i/2023/09/06/64f757bd6abd5.png" class="size-5" />
                  <span class="font-semibold">Xbox</span>
                </div>
                <span class="text-sm">
                  {{ profile.social_account?.xbox || '-' }}
                </span>
              </div>
              <div class="flex flex-col xl:flex-row justify-between items-center gap-2">
                <div class="flex items-center gap-1">
                  <img
                    src="https://i.psray.net/i/2023/09/06/64f757fb1f750.png"
                    class="size-5 mb-1"
                  />
                  <span class="font-semibold">NS</span>
                </div>
                <span class="text-sm">
                  {{ profile.social_account?.ns || '-' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 里程碑 -->
          <Milestones :milestones="profile.milestones" v-if="profile?.milestones" />
        </div>
      </div>
      <!-- 右侧 -->
      <div class="col-span-3">
        <!-- 概况 -->
        <div class="border rounded-md shadow-lg p-8">
          <!-- 服务器/排名/更新时间 -->
          <div>
            <!-- 大标题(排名) -->
            <div class="flex items-center mb-6">
              <img
                src="https://i.psray.net/i/2023/09/05/64f6007083bbf.png"
                class="mr-2"
                style="width: 28px"
              />
              <span class="text-lg font-medium">{{ $t('profile.ranking') }}</span>
            </div>
            <!-- 服务器/排名 -->
            <div class="grid grid-cols-8 gap-2 mb-5">
              <div
                class="col-span-8 md:col-span-4 flex justify-between items-center border rounded-md p-3"
              >
                <img
                  src="https://i.psray.net/i/2023/09/04/64f4fb0d2bd87.png"
                  style="width: 50px; height: 50px"
                />
                <div>
                  <div class="text-xl font-medium flex items-center" v-if="profile?.country">
                    <Icon :name="`flag:${profile.country.toLowerCase()}-4x3`" class="border" />
                    <span class="ml-3 inline-block">
                      {{ getRegionName(profile.country) }}
                    </span>
                  </div>
                  <div class="text-xs text-right">
                    {{ $t('profile.server_location') }}
                  </div>
                </div>
              </div>
              <div
                class="col-span-4 md:col-span-2 flex justify-between items-center border rounded-md p-3"
              >
                <img
                  src="https://i.psray.net/i/2023/09/04/64f4fdd26ce5c.png"
                  class="p-2"
                  style="width: 50px; height: 50px"
                />
                <div>
                  <div class="text-lg font-semibold text-right">
                    {{ profile.rank || '等待排名' }}
                  </div>
                  <div class="text-xs text-right">
                    {{ $t('profile.ranking') }}
                  </div>
                </div>
              </div>
              <div
                class="col-span-4 md:col-span-2 flex justify-between items-center border rounded-md p-3 flex-nowrap"
              >
                <img
                  src="https://i.psray.net/i/2023/09/04/64f5f04181fb0.png"
                  class="p-2"
                  style="width: 50px; height: 50px"
                />
                <div>
                  <div class="text-lg font-semibold text-right">
                    {{ profile.server_rank || '等待排名' }}
                  </div>
                  <div class="text-xs text-right">
                    {{ $t('profile.server_rannking') }}
                  </div>
                </div>
              </div>
            </div>
            <!-- 更新时间 -->
            <div class="grid grid-cols-6 gap-2 mb-5">
              <div
                class="col-span-3 flex flex-col md:flex-row justify-center md:justify-between items-center border rounded-md p-3"
              >
                <img
                  src="https://i.psray.net/i/2023/09/04/64f4ff11658cd.png"
                  style="width: 40px; height: 40px"
                />
                <div class="text-center md:text-right pt-2 md:pt-0">
                  <div class="text-md font-semibold">
                    {{ profile.updated_at }}
                  </div>
                  <div class="text-xs">{{ $t('profile.last_update_at') }}</div>
                </div>
              </div>
              <div
                class="col-span-3 flex flex-col md:flex-row justify-center md:justify-between items-center border rounded-md p-3"
              >
                <img
                  src="https://i.psray.net/i/2023/09/05/64f5ff0e52e77.png"
                  style="width: 40px; height: 40px"
                />
                <div class="text-center md:text-right pt-2 md:pt-0">
                  <div class="text-md font-semibold">
                    {{ profile.last_trophy }}
                  </div>
                  <div class="text-xs">
                    {{ $t('profile.last_trophy_earned_at') }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 奖杯概况 -->
          <div class="mt-5">
            <div class="flex items-center mb-6">
              <img
                src="https://i.psray.net/i/2023/09/04/64f4de7760775.png"
                class="mr-2"
                style="width: 28px"
              />
              <span class="text-lg font-medium">{{ $t('profile.trophy') }}</span>
            </div>
            <div class="grid grid-cols-4 gap-2 mb-5">
              <div
                class="flex flex-col md:flex-row justify-center md:justify-between items-center border rounded-md p-3 col-span-2"
              >
                <img
                  src="https://i.psray.net/i/2023/09/04/64f4f7a305dcd.png"
                  style="width: 40px; height: 40px"
                />
                <div class="text-center md:text-right pt-1 md:pt-0">
                  <div class="text-lg font-semibold">
                    {{ profile.first_trophy }}
                  </div>
                  <div class="text-xs">
                    {{ $t('profile.first_trophy_earned_at') }}
                  </div>
                </div>
              </div>
              <div
                class="flex flex-col md:flex-row justify-center md:justify-between items-center border rounded-md p-3"
              >
                <img
                  src="https://i.psray.net/i/2024/10/13/670b3e10d3fc1.png"
                  style="width: 40px; height: 40px"
                />
                <div class="text-center md:text-right pt-1 md:pt-0">
                  <div class="text-lg font-semibold">
                    {{ profile.trophyLevel }}
                  </div>
                  <div class="text-xs">{{ $t('profile.psn_level') }}</div>
                </div>
              </div>
              <div
                class="flex flex-col md:flex-row justify-center md:justify-between items-center border rounded-md p-3"
              >
                <img
                  src="https://i.psray.net/i/2023/09/04/64f4f8a59f6b2.png"
                  style="width: 40px; height: 40px"
                />
                <div class="text-center md:text-right pt-1 md:pt-0">
                  <div class="text-lg font-semibold">
                    {{ profile.earnedTrophiesCount }}
                  </div>
                  <div class="text-xs">
                    {{ $t('profile.earned_trophies_count') }}
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div class="flex justify-between items-center border rounded-md p-3">
                <img :src="getTrophyIcon('platinum')" class="size-10" />
                <div class="text-right">
                  <div class="text-md md:text-lg font-semibold">
                    {{ profile.platinum }}
                  </div>
                  <div class="text-xs">{{ $t('common.platinum') }}</div>
                </div>
              </div>
              <div class="flex justify-between items-center border rounded-md p-3">
                <img :src="getTrophyIcon('gold')" class="size-10" />
                <div class="text-right">
                  <div class="text-md md:text-lg font-semibold">
                    {{ profile.gold }}
                  </div>
                  <div class="text-xs">{{ $t('common.gold') }}</div>
                </div>
              </div>
              <div class="flex justify-between items-center border rounded-md p-3">
                <img :src="getTrophyIcon('silver')" class="size-10" />
                <div class="text-right">
                  <div class="text-md md:text-lg font-semibold">
                    {{ profile.silver }}
                  </div>
                  <div class="text-xs">{{ $t('common.silver') }}</div>
                </div>
              </div>
              <div class="flex justify-between items-center border rounded-md p-3">
                <img :src="getTrophyIcon('bronze')" class="size-10" />
                <div class="text-right">
                  <div class="text-md md:text-lg font-semibold">
                    {{ profile.bronze }}
                  </div>
                  <div class="text-xs">{{ $t('common.bronze') }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 游戏概况 -->
          <div class="mt-5">
            <div class="flex items-center mb-6">
              <img
                src="https://i.psray.net/i/2023/09/04/64f4f22726ce6.png"
                class="mr-3"
                style="width: 28px"
              />
              <span class="text-lg font-medium">{{ $t('profile.game') }}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <div class="flex justify-between items-center border rounded-md p-3">
                <img
                  src="https://i.psray.net/i/2023/09/04/64f4f2613f72f.png"
                  style="width: 45px; height: 45px"
                />
                <div class="text-right">
                  <div class="text-xl font-semibold">
                    {{ profile.games_played }}
                  </div>
                  <div class="text-xs">{{ $t('profile.game_played') }}</div>
                </div>
              </div>
              <div class="flex justify-between items-center border rounded-md p-3">
                <img
                  src="https://i.psray.net/i/2023/09/04/64f4f31164d69.png"
                  class="p-1"
                  style="width: 50px; height: 50px"
                />
                <div class="text-right">
                  <div class="text-xl font-semibold">
                    {{ profile.completionRate }}
                  </div>
                  <div class="text-xs">{{ $t('profile.completion_rate') }}</div>
                </div>
              </div>
              <div class="flex justify-between items-center border rounded-md p-3">
                <img
                  src="https://i.psray.net/i/2023/09/04/64f4f49b4d609.png"
                  class="p-1"
                  style="width: 50px; height: 50px"
                />
                <div class="text-right">
                  <div class="text-xl font-semibold">
                    {{ profile.abandoned_games }}
                  </div>
                  <div class="text-xs">
                    {{ $t('profile.less_than_10') }}
                  </div>
                </div>
              </div>
              <div class="flex justify-between items-center border rounded-md p-3">
                <img
                  src="https://i.psray.net/i/2023/09/04/64f4f5f5118fe.png"
                  class="py-1"
                  style="width: 50px; height: 50px"
                />
                <div class="text-right">
                  <div class="text-xl font-semibold">
                    {{ profile.trophy_tip }}
                  </div>
                  <div class="text-xs">{{ $t('profile.trophy_tips') }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 日历图 -->
          <div class="mt-2" v-if="calendar?.length > 0">
            <div class="flex items-center mt-6 gap-2">
              <img src="https://i.psray.net/i/2024/07/10/668e6517d2f8a.png" class="size-6" />
              <span class="text-lg font-medium">
                {{ $t('profile.trophy_calendar') }}
              </span>
            </div>
            <p class="text-xs lg:text-sm text-gray-400 my-3">
              {{ $t('profile.trophy_calendar_description')
              }}<span class="inline lg:hidden">，{{ $t('profile.swipe_left') }}</span>
            </p>
            <div class="max-w-full overflow-x-scroll lg:overflow-hidden">
              <calendar-heatmap
                class="min-w-[720px]"
                :values="calendar"
                :end-date="format(new Date(), 'yyyy-MM-dd')"
                :round="3"
                :max="50"
                tooltip-unit="奖杯"
                no-data-text="这一天没有获得奖杯"
                :tooltip-formatter="
                  v => {
                    return '在 ' + format(v.date, 'yyyy-MM-dd') + ` 获得了${v.count}个奖杯`;
                  }
                "
              />
            </div>
          </div>
        </div>

        <!-- 游戏列表 -->
        <div id="game-list" class="border rounded-md shadow-lg p-8 mt-5">
          <!-- 大标题 -->
          <div class="flex items-center mb-6">
            <img
              src="https://i.psray.net/i/2023/09/05/64f745d3732d2.png"
              class="mr-3"
              style="width: 28px"
            />
            <span class="text-lg font-medium">{{ $t('profile.recently_played') }}</span>
          </div>

          <!-- <div>
            <Button type="button" class="bg-black text-white text-sm" @click="drawer = true">
              <Icon name="lucide:settings" />
              更多设置
            </Button>
            <Setting />
          </div> -->

          <!-- 分页 -->
          <Paginator
            :first="offset"
            :totalRecords="totalRecords"
            :rows="50"
            :rowsPerPageOptions="[50]"
            @page="changePage"
          ></Paginator>

          <RecentlyPlayed :recentlyPlayed="play.recentlyPlayed" :psnid="profile.psnid" />

          <!-- 分页 -->
          <Paginator
            v-if="totalRecords >= 3"
            :first="offset"
            :totalRecords="totalRecords"
            :rows="50"
            :rowsPerPageOptions="[50]"
            @page="changePageToTop"
          ></Paginator>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { format, fromUnixTime } from 'date-fns';
import _ from 'lodash';

import { CalendarHeatmap } from 'vue3-calendar-heatmap';
import 'vue3-calendar-heatmap/dist/style.css';

import Milestones from '~/components/profile/Milestones.vue';
import RecentlyPlayed from '~/components/profile/RecentlyPlayed.vue';
import Setting from '~/components/profile/Setting.vue';

const { t } = useI18n();
const api = useApi();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const psnid = route.params.psnid;
const currentPage = ref(route.query.page || 1);

const drawer = useState('profile-prawer');

useSeoMeta({
  title: `${psnid}'s PSN Profile`,
  description: `${psnid}的PSN个人主页。${psnid}最近正在玩的游戏，奖杯和排名。`,
});

const { getTrophyIcon, getRegionName } = usePsn();

const userStore = useUserStore();
const { user, authenticated } = storeToRefs(userStore);

const calendar = computed(() => {
  const _calendar = profile.value.calendar;
  if (!_calendar) {
    return [];
  }
  return _calendar;
});

const steamLink = computed(() => {
  if (profile.value.social_account?.steam) {
    const steamId = profile.value.social_account.steam;

    // 检查是否是一个17位的数字字符串
    const isNumber = /^\d{17}$/.test(steamId);

    let inRange = false;

    if (isNumber) {
      // Steam64位ID的最小值
      const minSteam64Id = BigInt('76561197960265728');

      // 检查范围
      inRange = BigInt(steamId) >= minSteam64Id;
    }

    if (isNumber && inRange) {
      return `https://steamcommunity.com/profiles/${steamId}`;
    } else {
      return `https://steamcommunity.com/id/${steamId}`;
    }
  }

  return '#';
});

const { data: profile } = await useAsyncData('profile', fetchProfile, {
  transform: profile => {
    if (profile) {
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
    }

    return profile;
  },
});

const { data: play, refresh } = await useAsyncData(
  psnid + '-play-' + currentPage.value,
  fetchGame,
  {
    transform: data => {
      data.recentlyPlayed.forEach(game => {
        game.last_updated_at = format(fromUnixTime(game.last_updated_at), 'yyyy-MM-dd HH:mm:ss');
        if (Object.prototype.hasOwnProperty.call(game, 'trophySet')) {
          const { owners, platinum_achievers, completed_players, trophyTitlePlatform } =
            game.trophySet;
          game.trophySet.platform = trophyTitlePlatform.split(',');
          if (owners !== 0) {
            // Platinum Rate
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

async function fetchProfile() {
  const res = await api.get(`/profile/get/${psnid}`);
  return res.data;
}

async function fetchGame() {
  const res = await api.get(`/profile/play?psnid=${psnid}`, {
    params: { page: currentPage.value },
  });
  return res.data;
}

function changePageToTop(PageState) {
  document.getElementById('game-list').scrollIntoView({
    behavior: 'smooth',
  });
  changePage(PageState);
}

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
  return play.value.totalPages * 50;
});

// 关注这个用户
function followThisUser(action) {
  // 如果没有登录，跳转到登录界面
  if (!authenticated.value) {
    return navigateTo('/auth/login');
  }

  if (user.value.psnid == profile.value.psnid) {
    return toast.add({
      severity: 'info',
      summary: '失败了喵',
      detail: '不能关注自己哦',
      life: 3000,
    });
  }

  // 关注用户 / 取消关注用户
  api
    .post('/user/subscribe', {
      psnid: profile.value.psnid,
      action: action,
    })
    .then(res => {
      if (action == 1) {
        toast.add({
          severity: 'success',
          summary: '成功',
          detail: '关注成功',
          life: 3000,
        });
      }
      profile.value.is_following = Boolean(action > 0);
      if (action == -1) {
        followMenu.value.toggle();
      }
    })
    .catch(err => {
      toast.add({
        severity: 'error',
        summary: '失败',
        detail: '发生了错误',
        life: 3000,
      });
    });
}

// 打开菜单
const followMenuToggle = event => {
  followMenu.value.toggle(event);
};

const followMenu = ref();
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
