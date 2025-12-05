<template>
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
        @click="handleFollow(1)"
      >
        {{ $t('profile.follow') }}
      </button>
      <div
        v-else
        class="relative py-1.5 text-white rounded-md flex items-center cursor-pointer bg-violet-500 hover:bg-violet-600"
        @click="toggleFollowMenu"
      >
        <div class="grow text-center">{{ $t('profile.followed') }}</div>
        <Icon name="ic:baseline-keyboard-arrow-down" class="absolute right-0 w-8"></Icon>
      </div>
      <Menu ref="followMenu" id="overlay_menu" :popup="true">
        <template #start>
          <div class="pt-1 px-1">
            <button
              class="block w-full p-1 rounded-md text-center text-sm font-medium bg-red-400 hover:bg-red-500 text-white"
              @click="handleFollow(-1)"
            >
              {{ $t('profile.unfollow') }}
            </button>
          </div>
        </template>
      </Menu>
      <button
        class="text-gray-600 rounded-md border-solid border-2 px-6 py-1 border-gray-400 hover:bg-slate-100 mt-2 cursor-pointer"
        @click="handleSyncClick"
      >
        {{ $t('profile.sync_psn_trophies') }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  profile: {
    type: Object,
    required: true,
  },
});

const router = useRouter();
const route = useRoute();
const toast = useToast();
const api = useApi();
const followMenu = ref();

const userStore = useUserStore();
const { user, authenticated } = storeToRefs(userStore);

const toggleFollowMenu = (event) => {
  followMenu.value.toggle(event);
};

const handleFollow = (action) => {
  if (!authenticated.value) {
    return navigateTo('/auth/login');
  }

  if (user.value.psnid == props.profile.psnid) {
    return toast.add({
      severity: 'info',
      summary: '失败了喵',
      detail: '不能关注自己哦',
      life: 3000,
    });
  }

  api
    .post('/user/subscribe', {
      psnid: props.profile.psnid,
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
      props.profile.is_following = Boolean(action > 0);
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
};

const handleSyncClick = () => {
  router.push(`/sync?psnid=${route.params.psnid}`);
};
</script>
