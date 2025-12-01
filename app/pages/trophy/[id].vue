<template>
  <div class="max-w-screen-xl mx-auto py-4 px-3 md:px-6">
    <ConfirmDialog>
      <template #icon="slotProps">
        <Icon name="solar:info-circle-linear" class="text-4xl ml-3" />
      </template>
    </ConfirmDialog>
    <div class="w-full border rounded-md shadow-lg p-6">
      <!-- 导航面包屑 -->
      <div class="my-2 flex flex-row items-center text-sm gap-0.5">
        <NuxtLink to="/" class="text-gray-600 hover:text-gray-950">
          <div class="flex items-center gap-0.5">
            <Icon name="mdi:home" class="text-lg text-cyan-600 size-4" />
            <span class="leading-relaxed">主页</span>
          </div>
        </NuxtLink>
        <Icon name="material-symbols:chevron-right" class="text-lg text-gray-400" />
        <NuxtLink
          :to="{
            name: 'trophies-detail',
            params: { id: trophySet.id },
          }"
          class="text-gray-600 hover:text-gray-950"
        >
          <div class="flex items-center gap-0.5">
            <span class="leading-relaxed">奖杯组 (#{{ trophySet.id }})</span>
          </div>
        </NuxtLink>
        <Icon name="material-symbols:chevron-right" class="text-lg text-gray-400" />
        <NuxtLink
          :to="{
            name: 'trophy',
            params: { id: trophy.id },
          }"
          class="text-gray-600 hover:text-gray-950"
        >
          <div class="flex items-center gap-0.5">
            <span class="leading-relaxed">奖杯 (#{{ trophy.id }})</span>
          </div>
        </NuxtLink>
      </div>
      <!-- 奖杯组信息 -->
      <div class="mt-3 flex justify-between items-center mb-5">
        <div class="flex">
          <img :src="trophySet?.trophyTitleIconUrl" style="max-height: 80px" />
          <div class="flex flex-col ml-3 justify-center">
            <!-- 奖杯组标题 -->
            <div class="text-base font-medium text-center">
              {{ trophySet?.trophyTitleName }}
            </div>
            <!-- 平台 -->
            <div class="flex justify-center sm:justify-start my-1">
              <div
                class="mr-2 ml-0 bg-indigo-500 text-white px-3 py-1 rounded-sm text-xs"
                v-for="platform in trophySet.trophyTitlePlatform?.split(',')"
              >
                {{ platform }}
              </div>
            </div>
            <!-- 奖杯数量（小屏幕） -->
            <div class="justify-start mt-2 flex md:hidden gap-1.5">
              <div class="flex gap-1">
                <img class="size-5" :src="getTrophyIcon('platinum')" />
                <span class="text-base">
                  {{ trophySet?.definedTrophies.platinum }}
                </span>
              </div>
              <div class="flex gap-1">
                <img class="size-5" :src="getTrophyIcon('gold')" />

                <span class="text-base">{{ trophySet?.definedTrophies.gold }}</span>
              </div>
              <div class="flex gap-1">
                <img class="size-5" :src="getTrophyIcon('silver')" />
                <span class="text-base">{{ trophySet?.definedTrophies.silver }}</span>
              </div>
              <div class="flex gap-1">
                <img class="size-5" :src="getTrophyIcon('bronze')" />
                <span class="text-base">{{ trophySet?.definedTrophies.bronze }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 奖杯数量 -->
        <div class="justify-center mt-2 hidden md:flex gap-1.5">
          <div class="flex gap-1">
            <img class="size-5" :src="getTrophyIcon('platinum')" />

            <span class="text-base">{{ trophySet?.definedTrophies.platinum }}</span>
          </div>
          <div class="flex gap-1">
            <img class="size-5" :src="getTrophyIcon('gold')" />
            <span class="text-base">{{ trophySet?.definedTrophies.gold }}</span>
          </div>
          <div class="flex gap-1">
            <img class="size-5" :src="getTrophyIcon('silver')" />
            <span class="text-base">{{ trophySet?.definedTrophies.silver }}</span>
          </div>
          <div class="flex gap-1">
            <img class="size-5" :src="getTrophyIcon('bronze')" />
            <span class="text-base">{{ trophySet?.definedTrophies.bronze }}</span>
          </div>
        </div>
      </div>
      <!-- 奖杯信息 -->
      <TrophiesTrophy :trophy="trophy"></TrophiesTrophy>
    </div>

    <!-- Tips -->
    <div class="mt-5 w-full border rounded-md shadow-lg p-4 md:p-6">
      <!-- 标题 -->
      <div class="flex items-center mb-6">
        <img
          src="https://i.psray.net/i/2023/09/22/650cf02986273.png"
          class="mr-3"
          style="width: 28px"
        />
        <span class="text-lg font-medium">社区Tips</span>
      </div>
      <!-- 注意事项 -->
      <div class="border p-3 rounded-md bg-sky-400/10 border-sky-700">
        <div class="divide-y divide-gray-300/50 pt-2">
          <div class="space-y-4 pb-2 pl-2 text-base leading-7 text-gray-600">
            <p class="text-base font-medium">
              {{ $t('trophy.tips.description_html') }}
            </p>
            <ul class="space-y-4 text-sm">
              <li class="flex items-center">
                <svg
                  class="h-6 w-6 flex-none fill-sky-100 stroke-red-500 stroke-2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="11" />
                  <path d="m8 8 l8 8" fill="none" />
                  <path d="m16 8 l-8 8" fill="none" />
                </svg>
                <p class="ml-2">{{ $t('trophy.tips.not_good_1') }}</p>
              </li>
              <li class="flex items-center">
                <svg
                  class="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="11" />
                  <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none" />
                </svg>
                <p class="ml-2">{{ $t('trophy.tips.good_1') }}</p>
              </li>
              <li class="flex items-center">
                <svg
                  class="h-6 w-6 flex-none fill-sky-100 stroke-sky-500 stroke-2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="11" />
                  <path d="m8 13 2.165 2.165a1 1 0 0 0 1.521-.126L16 9" fill="none" />
                </svg>
                <p class="ml-2">{{ $t('trophy.tips.good_2') }}</p>
              </li>
            </ul>
            <p class="text-xs text-gray-500">
              {{ $t('trophy.tips.warning') }}
            </p>
          </div>
          <!-- 已登录时候的编辑和新发布 -->
          <div class="pl-2 pt-4 text-base font-semibold" v-if="authenticated">
            <div v-if="!myTip.id" class="text-sm">
              <p class="mb-2 text-gray-600">
                {{ $t('trophy.tips.not_posted_yet') }}
              </p>
              <button class="bg-green-600 text-white px-3 py-1.5 rounded-md" @click="showTipEditor">
                {{ $t('trophy.tips.write_new_tip_button') }}
              </button>
            </div>
            <div v-else>
              <div class="mb-4 text-gray-600 flex items-center gap-1 text-lg">
                <Icon name="material-symbols:check-circle" class="text-green-500" />
                <span>{{ $t('trophy.tips.posted') }}</span>
              </div>
              <div class="flex gap-2 text-sm">
                <button
                  class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md flex items-center"
                  @click="showTipEditor"
                >
                  <Icon name="material-symbols:edit-note" class="text-lg mr-1" />
                  <span>{{ $t('trophy.tips.edit_button') }}</span>
                </button>
                <button
                  class="bg-red-400 hover:bg-red-500 text-white px-3 py-1.5 rounded-md flex items-center"
                  @click="confirmDelete"
                >
                  <Icon name="material-symbols:delete-outline" class="text-lg mr-1" />
                  <span>{{ $t('trophy.tips.delete_button') }}</span>
                </button>
                <button
                  v-if="editorVisible"
                  class="bg-purple-400 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md flex items-center"
                  @click="editorVisible = false"
                >
                  <Icon name="material-symbols:edit-off" class="text-lg mr-1" />
                  <span>{{ $t('trophy.tips.hidden_editor') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Tip 未登录状态编辑块 -->
      <div class="mt-3" v-if="!authenticated">
        <div class="flex p-6 border rounded-md border-gray-300">
          <div class="trophy-tip-guest">
            <div class="font-semibold text-xl flex items-center">
              <span>{{ $t('trophy.tips.not_logged_in') }}</span>
            </div>
            <div class="mt-5 space-x-3">
              <button
                class="bg-green-600 text-white px-3 py-1.5 rounded-md"
                @click="router.push('/auth/login')"
              >
                <span>{{ $t('common.login') }}</span>
              </button>
              <button
                class="bg-sky-500 text-white px-3 py-1.5 rounded-md"
                @click="router.push('/auth/signup')"
              >
                <span>{{ $t('common.sign_up') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- 编辑器 -->
      <div class="mt-5 rounded-lg" v-if="editorVisible">
        <ClientOnly>
          <div class="text-xl font-bold leading-7 mb-5 pl-1 flex items-center">
            <Icon name="material-symbols:edit-note" class="text-lg mr-1" />
            <span>{{ $t('trophy.tips.edit_my_tip') }}</span>
          </div>
          <MyEditor
            class="mx-1 rounded-lg shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px]"
            v-model="myTip.content"
          ></MyEditor>
          <!-- 语言 -->
          <div class="flex flex-col gap-3 mt-5 px-2">
            <div class="flex flex-col md:flex-row gap-1 md:items-center">
              <p>{{ $t('trophy.tip_editor.language') }}：</p>
              <Select
                v-model="myTip.language"
                :options="languages"
                optionLabel="nativeName"
                optionValue="localeCode"
                placeholder="Select a Language"
                checkmark
                :highlightOnSelect="false"
                class="w-full md:w-56 text-sm"
              />
            </div>
            <div class="flex flex-col md:flex-row gap-1 md:items-center">
              <p>{{ $t('trophy.tip_editor.missable') }}：</p>
              <SelectButton
                v-model="myTip.tags"
                :options="missable"
                optionLabel="name"
                optionValue="value"
                aria-labelledby="Trophy Missable Mark"
                class="text-sm"
              />
            </div>
            <div class="flex items-center">
              <p>{{ $t('trophy.tip_editor.spoilers') }}：</p>
              <ToggleSwitch v-model="myTip.spoiler" />
            </div>
            <div class="flex gap-2 mt-1">
              <button
                class="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm flex items-center"
                @click="updateMyTip"
              >
                <Icon name="ic:sharp-file-upload" class="mr-1 text-lg"></Icon>
                <span>{{ $t('trophy.tip_editor.post_button') }}</span>
              </button>
            </div>
          </div>
        </ClientOnly>
      </div>
      <!-- 已发布的Tip -->
      <div class="mt-5">
        <div
          v-for="userTrophyTip in trophyTips"
          class="flex flex-col md:flex-row gap-2 p-4 md:p-6 mb-6 border rounded-md border-gray-300 bg-sky-50 bg-opacity-10 hover:bg-opacity-40"
        >
          <!-- 左侧头像和PSNID -->
          <div class="flex flex-col items-center gap-1">
            <NuxtLink
              class="font-medium"
              :to="{
                name: 'player-profile',
                params: { psnid: userTrophyTip.user.psnid },
              }"
            >
              <img :src="userTrophyTip.user.avatarUrl" class="w-12 md:w-24" />
            </NuxtLink>
            <NuxtLink
              class="font-medium"
              :to="{
                name: 'player-profile',
                params: { psnid: userTrophyTip.user.psnid },
              }"
            >
              <span>{{ userTrophyTip.user.psnid }}</span>
            </NuxtLink>
          </div>
          <!-- 右侧 -->
          <div class="flex flex-col justify-between grow">
            <div class="space-y-3">
              <!-- 时间 语言 标记 -->
              <div class="flex flex-col bg-slate-100/30 px-3 py-2 border rounded-md">
                <!-- 投稿时间 / 语言 -->
                <div
                  class="text-gray-600 text-xs font-bold flex flex-col md:flex-row items-center gap-2"
                >
                  <!-- 投稿时间 -->
                  <div class="flex items-center">
                    <Icon name="ic:twotone-update" class="text-lg mr-1 text-fuchsia-500" />
                    <span v-if="userTrophyTip.created_at == userTrophyTip.updated_at">
                      {{ $t('trophy.tip.post_date') }}
                      {{ formatISO9075(fromUnixTime(userTrophyTip.created_at)) }}
                    </span>
                    <span v-else>
                      {{ $t('trophy.tip.eidted_date') }}
                      {{ formatISO9075(fromUnixTime(userTrophyTip.updated_at)) }}
                    </span>
                  </div>
                  <!-- 语言 -->
                  <div class="flex items-center">
                    <Icon name="material-symbols:translate" class="text-lg mr-1 text-green-500" />
                    <span class="text-color-highlight">
                      {{ $t('trophy.tip.language') }}
                      {{ userTrophyTip.language }}.
                    </span>
                  </div>
                </div>
                <!-- 用户标记 -->
                <div
                  class="text-gray-600 text-xs font-bold flex items-center justify-center md:justify-start mt-2"
                  v-if="userTrophyTip.spoiler == 1 || userTrophyTip.tags"
                >
                  <Icon name="material-symbols:add-location" class="text-lg mr-1" />
                  <div class="flex items-center space-x-2">
                    <span>{{ $t('trophy.tip.mark.name') }}</span>
                    <span
                      v-if="userTrophyTip.spoiler === 1"
                      class="inline-flex items-center py-0.5 px-2.5 rounded-md text-xs font-medium bg-indigo-500 text-white"
                    >
                      {{ $t('trophy.tip.mark.spoiler') }}
                    </span>
                    <span
                      v-if="userTrophyTip.tags === 'MISSABLE'"
                      class="inline-flex items-center py-0.5 px-2.5 rounded-md text-xs font-medium bg-pink-500 text-white"
                    >
                      {{ $t('trophy.tip.mark.missbale') }}
                    </span>
                    <span
                      v-if="userTrophyTip.tags === 'UNMISSABLE'"
                      class="inline-flex items-center py-0.5 px-2.5 rounded-md text-xs font-medium bg-green-600 text-white"
                    >
                      {{ $t('trophy.tip.mark.unmissbale') }}
                    </span>
                  </div>
                </div>
              </div>
              <!-- Tip 内容 -->
              <div class="py-2 px-2 pb-3 prose-base" v-html="userTrophyTip.content"></div>
            </div>
            <!-- 点赞和喜欢 -->
            <div class="text-sm text-gray-600 mt-3 border-t border-gray-300 pt-2 mx-auto md:mx-0">
              <div class="text-xs text-gray-600 mt-2">
                {{ $t('trophy.tip.is_helpful') }}
              </div>
              <div class="my-1">
                <button
                  type="button"
                  @click="voteTip(userTrophyTip, 1)"
                  :class="[
                    userTrophyTip?.myVote && userTrophyTip?.myVote.helpful == 1
                      ? 'text-white bg-blue-500'
                      : 'text-blue-500 bg-blue-100',
                  ]"
                  class="m-1 ml-0 py-1 px-2 inline-flex justify-center items-center gap-2 rounded-md border border-transparent font-semibold hover:text-white hover:bg-blue-500 focus:outline-none focus:ring-2 ring-offset-white focus:ring-blue-100 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800"
                >
                  <Icon name="tabler:thumb-up" class="text-lg" />
                  <span>Yes</span>
                </button>
                <button
                  type="button"
                  @click="voteTip(userTrophyTip, -1)"
                  :class="[
                    userTrophyTip?.myVote && userTrophyTip?.myVote.helpful == -1
                      ? 'text-white bg-purple-500'
                      : 'text-purple-500 bg-blue-100',
                  ]"
                  class="m-1 ml-0 py-1 px-2 inline-flex justify-center items-center gap-2 rounded-md bg-purple-100 border border-transparent font-semibold text-purple-500 hover:text-white hover:bg-purple-500 focus:outline-none focus:ring-2 ring-offset-white focus:ring-purple-100 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800"
                >
                  <Icon name="tabler:thumb-down" class="text-lg" />
                  <span>No</span>
                </button>
              </div>
              <div class="mt-1 flex items-center">
                <Icon name="material-symbols:favorite" class="mr-1 text-red-400 cursor-pointer" />
                <span>{{ $t('trophy.tip.like', { count: userTrophyTip.vote_up }) }}</span>
              </div>
              <div class="mt-1 flex items-center">
                <Icon name="ph:thumbs-down" class="mr-1 text-green-400 cursor-pointer" />
                <span>{{ $t('trophy.tip.like', { count: userTrophyTip.vote_down }) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import _ from 'lodash';
import { format, formatISO9075, fromUnixTime } from 'date-fns';

const route = useRoute();
const router = useRouter();
const api = useApi();
const userStore = useUserStore();
const toast = useToast();
const confirm = useConfirm();
const { user, authenticated } = storeToRefs(userStore);
const { getTrophyIcon } = usePsn();

const languages = [
  {
    nativeName: 'English',
    englishName: 'English',
    localeCode: 'en',
  },
  {
    nativeName: 'Français',
    englishName: 'French',
    localeCode: 'fr',
  },
  {
    nativeName: 'Deutsch',
    englishName: 'German',
    localeCode: 'de',
  },
  {
    nativeName: '中文',
    englishName: 'Chinese',
    localeCode: 'zh',
  },
  {
    nativeName: '日本語',
    englishName: 'Japanese',
    localeCode: 'ja',
  },
  {
    nativeName: '한국어',
    englishName: 'Korean',
    localeCode: 'ko',
  },
  {
    nativeName: 'Español',
    englishName: 'Spanish',
    localeCode: 'es',
  },
];

const { data, refresh } = await useAsyncData('trophy', fetchData);

const trophy = toRef(data.value, 'trophy');
const trophySet = toRef(data.value, 'trophySet');
const trophyTips = toRef(data.value, 'trophyTip');
const editorVisible = ref(false);
const myTip = data.value?.myTip
  ? toRef(data.value, 'myTip')
  : ref({
      id: null,
      language: 'en',
      tags: '',
      spoiler: false,
      content: '<p>光芒日渐黯淡 你的所在是如此遥远</p><p>于烈焰与寒冰之间 我向着你的方向前行</p>',
    });

const missable = [
  { name: '不标记', value: '' },
  { name: '可能错过', value: 'MISSABLE' },
  { name: '不会错过', value: 'UNMISSABLE' },
];

useSeoMeta({
  title: `${trophy.value.trophyName} - ${trophySet.value.trophyTitleName}`,
  description: `${trophySet.value.trophyTitlePlatform}游戏「${trophySet.value.trophyTitleName}」的奖杯成就「${trophy.value.trophyName}」`,
});

async function fetchData() {
  const res = await api.get(`/trophy/get/${route.params.id}`, {
    params: route.query,
  });
  return res.data;
}

function showTipEditor() {
  editorVisible.value = true;
}

function updateMyTip() {
  if (!myTip.value.content || !myTip.value.language) {
    return toast.add({
      severity: 'warn',
      summary: '缺少标记或内容',
      detail: '是不是忘记标记Tip的语言或填写Tip的内容？',
      life: 3000,
    });
  }
  api
    .post(`/user/tip/modify`, {
      trophyId: route.params.id,
      language: myTip.value.language,
      spoiler: Number(myTip.value.spoiler) || 0,
      tags: myTip.value.tags,
      content: myTip.value.content,
    })
    .then(response => {
      myTip.value.id = response.data.trophyTipId;
      editorVisible.value = false;
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: '发布成功！',
        life: 3000,
      });
      refresh().then(() => {
        trophyTips.value = data.value.trophyTip;
      });
    });
}

function confirmDelete() {
  confirm.require({
    message: '你确认要删除已发布的内容吗？这个操作不可恢复。',
    header: '请确认',
    rejectLabel: 'Cancel',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger',
    },
    accept: deleteMyTip,
  });
}

function deleteMyTip() {
  api
    .post(`/user/tip/delete`, {
      trophyId: route.params.id,
    })
    .then(response => {
      myTip.value = {
        id: null,
        spoiler: false,
        content: '',
      };
      toast.add({
        severity: 'info',
        summary: '已删除',
        detail: '删除成功！',
        life: 3000,
      });
      refresh().then(() => {
        trophyTips.value = data.value.trophyTip;
      });
      editorVisible.value = false;
    });
}

function voteTip(_trophyTip, helpful) {
  const { progress, isLoading, start, finish, clear } = useLoadingIndicator();
  if (!authenticated.value) {
    return router.push('/auth/login');
  }
  if (_trophyTip?.myVote && _trophyTip.myVote.helpful == helpful) {
    helpful = 0;
  }
  start();
  api
    .post(`/user/tip/helpful`, {
      trophyTipId: _trophyTip.id,
      helpful,
    })
    .then(response => {
      _trophyTip.myVote = { helpful };
      _trophyTip.vote_up = response.data.voteUp;
      _trophyTip.vote_down = response.data.voteDown;
      finish();
    });
}
</script>
