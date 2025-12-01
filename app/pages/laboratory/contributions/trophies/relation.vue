<template>
  <div class="max-w-screen-lg mx-auto py-4 px-6 pt-5">
    <ConfirmPopup></ConfirmPopup>
    <!-- 标题和功能介绍 -->
    <div>
      <!-- 导航 -->
      <nav class="flex" aria-label="Breadcrumb">
        <ol class="inline-flex items-center flex-wrap gap-2 md:space-x-2 rtl:space-x-reverse">
          <li class="inline-flex items-center">
            <a
              href="/"
              class="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              <Icon name="material-symbols:home-outline-rounded" class="text-gray-700 text-base" />
              <span>Home</span>
            </a>
          </li>
          <li>
            <div class="flex items-center">
              <Icon name="material-symbols:chevron-right" class="text-xl text-gray-500" />
              <a
                href="/laboratory"
                class="flex items-center gap-1 ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
              >
                <Icon name="ph:flask"></Icon>
                <span>社区实验室</span>
              </a>
            </div>
          </li>
          <li>
            <div class="flex items-center">
              <Icon name="material-symbols:chevron-right" class="text-xl text-gray-500" />
              <NuxtLink
                :to="{
                  name: 'trophies-detail',
                  params: { id: route.query.id },
                }"
                class="flex items-center gap-1 ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
              >
                <Icon name="material-symbols:trophy-outline"></Icon>
                <span>奖杯组 (#{{ route.query.id }})</span>
              </NuxtLink>
            </div>
          </li>
          <li>
            <div class="flex items-center">
              <Icon name="material-symbols:chevron-right" class="text-xl text-gray-500" />
              <NuxtLink
                :to="`/laboratory/contributions/trophies/${route.query.id}`"
                class="flex items-center gap-1 ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400 dark:hover:text-white"
              >
                <Icon name="material-symbols:note-alt-outline"></Icon>
                <span>编辑奖杯组</span>
              </NuxtLink>
            </div>
          </li>
          <li aria-current="page">
            <div class="flex items-center">
              <svg
                class="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
              <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400">
                关联游戏
              </span>
            </div>
          </li>
        </ol>
      </nav>
      <h2 class="text-2xl font-bold my-2">为奖杯组关联一个游戏</h2>
      <div class="mt-5 border p-3 rounded-md bg-blue-100 border-blue-300 text-blue-500">
        <h2 class="text-xl mb-2 text-blue-600 font-bold">关联到游戏</h2>
        <p>PSRay的游戏数据库，使用IGDB (igdb.com) 作为基础。在贡献前请先了解它</p>
        <p>您只需提交IGDB的游戏ID，即可实现关联。系统会自动从IGDB数据库内，获取游戏信息</p>
        <div class="border border-blue-200 my-1.5"></div>
        <p>
          IGDB ID 是纯数字，可以在IGDB游戏详情内找到，例如 The Last of Us Remastered 的 IGDB ID 是
          6036
        </p>
        <p>
          如果IGDB不存在游戏信息时，目前暂时没有提供创建自定义游戏创建界面，您可以现在IGDB创建游戏
        </p>
        <div class="border border-blue-200 my-1.5"></div>
        <p>多个奖杯组使用同一个IGDB ID时，会自动标记成类似的游戏</p>
      </div>
    </div>
    <!-- 奖励提示 -->
    <div class="mt-5 border p-3 rounded-md bg-green-100 border-green-300 text-green-600">
      <h2 class="text-xl mb-2 text-green-700 font-bold">PSRay 贡献奖励</h2>
      <p>PSRay采用了人工审核策略，您的修改申请提交后，将由管理员确认后才会生效</p>
      <p>您可以在右上角菜单【我的贡献】中，查看自己的提交是否被通过</p>
      <p>审核通过后，您将获得社区贡献奖励（贤者之石）</p>
    </div>
    <!-- 功能按钮组 -->
    <div class="mt-3 mb-5 flex gap-5">
      <button class="bg-sky-500 text-white hover:bg-sky-600 px-5 py-2 rounded-md" @click="edit">
        修改关联
      </button>
      <button
        class="bg-purple-500 text-white hover:bg-purple-600 px-5 py-2 rounded-md"
        @click="
          router.push(
            `/laboratory/wiki/changes?action=trophies-relation&resource=trophies&resourceId=${route.query.id}`,
          )
        "
      >
        该奖杯组游戏关联变更记录
      </button>

      <button
        class="bg-pink-500 text-white hover:bg-pink-600 px-5 py-2 rounded-md"
        @click="
          router.push({
            name: 'trophies-detail',
            params: { id: route.query.id },
          })
        "
      >
        返回奖杯组页面
      </button>
    </div>
    <!-- 更新输入框 -->
    <div class="flex flex-col gap-2" v-if="editorShow && !contributed">
      <div class="mt-5 border p-5 rounded-md">
        <p class="mb-3 font-bold text-lg">更新关联</p>
        <div class="my-3">
          <label class="mr-3">IGDB Game ID:</label>
          <InputNumber v-model="newIgdbId" :useGrouping="false" :min="1" inputId="integeronly" />
        </div>
        <button
          class="bg-green-500 text-white hover:green-purple-600 px-5 py-2 rounded-md flex items-center gap-2"
          @click="submit"
        >
          <Icon name="iconamoon:send" v-if="!loading" />
          <Icon name="svg-spinners:90-ring-with-bg" v-else />
          提交更新
        </button>
      </div>
      <div class="mt-5 border p-5 rounded-md" v-if="isAdmin">
        <p class="mb-3 font-bold text-lg">移除当前关联（仅管理员）</p>
        <p>提示：如果关联错误，无需删除，提交正确的IGDB ID即可</p>
        <p>该功能仅适用于【当前奖杯组无法关联到任何有效游戏】的时候</p>
        <p>此操作会回收【与这个奖杯组相关的】贤者之石</p>
        <p>该操作仅管理员可用，无需审核立即生效</p>
        <button
          class="mt-5 bg-red-500 text-white hover:green-purple-600 px-5 py-2 rounded-md flex items-center gap-2"
          @click="confirmRemove($event)"
        >
          确认移除
        </button>
      </div>
    </div>
    <!-- 当前关联 -->
    <div
      class="mt-10 flex flex-col md:flex-row items-center justify-center mb-5"
      v-if="!editorShow && !contributed"
    >
      <div class="border p-5 w-72">
        <img :src="trophySet.trophyTitleIconUrl" />
        <p>奖杯组：{{ trophySet.trophyTitleName }}</p>
        <p class="text-sm text-gray-700">ID: {{ trophySet.id }}</p>
      </div>

      <div class="w-32 px-3 my-6">
        <div class="flex flex-col justify-center items-center" v-if="trophySet.game_id">
          <Icon name="ph:plugs-connected-bold" class="text-blue-500 text-2xl" />
          <div class="border my-1 w-full"></div>
          <div>已关联</div>
        </div>
        <div class="flex flex-col justify-center items-center" v-else>
          <Icon name="fluent:plug-disconnected-16-filled" class="text-gray-500 text-2xl" />
          <div class="border my-1 w-full"></div>
          <div>未关联</div>
        </div>
      </div>

      <div class="border p-5 w-72 flex flex-col" v-if="game">
        <img :src="getGameCover(game.igdb_image_id)" />
        <p>游戏：{{ game.title }}</p>
        <p class="text-sm text-gray-700">IGDB ID: {{ game.igdb_game_id }}</p>
        <p class="text-sm text-gray-700">PSRay Game ID: {{ game.id }}</p>
      </div>
      <div class="border p-5 w-72 flex items-center justify-center self-stretch" v-else>
        <Icon name="material-symbols:help-outline" class="text-5xl" />
      </div>
    </div>
    <!-- 更新成功提示 -->
    <div
      v-if="contributed"
      class="border border-gray-200 mt-5 relative p-4 bg-sky-50 text-center rounded-lg shadow dark:bg-gray-800"
    >
      <div
        class="w-12 h-12 rounded-full bg-sky-200 dark:bg-sky-900 p-2 flex items-center justify-center mx-auto mb-3.5"
      >
        <Icon name="material-symbols:check-rounded" class="text-5xl text-sky-900" />
        <span class="sr-only">Success</span>
      </div>
      <p class="mb-4 text-lg font-semibold text-gray-700 dark:text-white">
        感谢您的提交，管理员检查后会立即生效，这需要一点时间。
      </p>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const api = useApi();
const { getGameCover } = useGame();
const confirm = useConfirm();

const toast = useToast();
const userStore = useUserStore();
const { authenticated, isAdmin } = storeToRefs(userStore);

const contributed = ref(false);
const editorShow = ref(false);
const loading = ref(false);
const newIgdbId = ref(null);

const { data, error, refresh } = await useAsyncData('trophy-set-relation', fetchTrophySet);

async function fetchTrophySet() {
  const res = await api.get(`/trophies/get/${route.query.id}`);
  return res.data;
}

const trophySet = toRef(data.value, 'trophyTitle');
const game = toRef(data.value, 'game');

if (!game) {
  editorShow.value = true;
}

function edit() {
  if (!authenticated.value) {
    navigateTo('/auth/login');
  } else {
    editorShow.value = true;
  }
}

function submit() {
  if (newIgdbId.value <= 0) {
    return;
  }
  loading.value = true;
  api
    .post('/contribution/trophies/relation', {
      resource_id: route.query.id,
      new_value: newIgdbId.value,
    })
    .then(res => {
      contributed.value = true;
    })
    .catch(e => {
      let message = '发生了错误';
      if (e?.response?.data?.error?.message) {
        message = e.response.data.error.message;
      }
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: message,
        life: 8000,
      });
    })
    .finally(() => {
      loading.value = false;
    });
}

const confirmRemove = event => {
  confirm.require({
    target: event.currentTarget,
    message: '确定要移除这个奖杯组已经关联的游戏吗',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Delete',
      severity: 'danger',
    },
    accept: () => {
      api
        .post('/admin/trophies/remove-game', {
          id: route.query.id,
        })
        .then(res => {
          contributed.value = true;
        })
        .catch(e => {
          let message = '发生了错误';
          if (e?.response?.data?.error?.message) {
            message = e.response.data.error.message;
          }
          toast.add({
            severity: 'error',
            summary: 'Error',
            detail: message,
            life: 8000,
          });
        });
    },
  });
};
</script>

<style></style>
