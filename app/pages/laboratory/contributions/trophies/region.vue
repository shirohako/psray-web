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
                标记奖杯组地区
              </span>
            </div>
          </li>
        </ol>
      </nav>
      <h2 class="text-2xl font-bold my-2">为奖杯组设置一个地区</h2>
      <div class="mt-5 border p-3 rounded-md bg-blue-100 border-blue-300 text-blue-500">
        <h2 class="text-xl mb-2 text-blue-600 font-bold">关联到游戏</h2>
        <p>同一个游戏可能有多套奖杯，不同奖杯组可能对应不同地区商店售卖的版本</p>
        <p>为了方便识别，PSRay可以为奖杯组标记地区TAG</p>
        <div class="border border-blue-200 my-1.5"></div>
        <p>如果预设TAG没有能匹配当前奖杯组，可以和管理员取得联系。我们会根据实际情况增加可用TAG</p>
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
        修改地区标识
      </button>
      <button
        class="bg-purple-500 text-white hover:bg-purple-600 px-5 py-2 rounded-md"
        @click="
          router.push(
            `/laboratory/wiki/changes?action=trophies-region&resource=trophies&resourceId=${route.query.id}`,
          )
        "
      >
        该奖杯组地区标识变更记录
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
    <!-- 修改 -->
    <div class="flex flex-col gap-2" v-if="editorShow && !contributed">
      <div class="mt-5 border p-5 rounded-md">
        <p class="mb-3 font-bold text-lg">修改地区标识</p>
        <p class="mb-3 text-gray-600 text-sm">请在下面选择一个预设的标识，最多可以选3个</p>

        <!-- 常用 -->
        <p class="font-semibold my-3">常用</p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="region-tag" v-for="tag in regionTagsA" @click="addTag(tag.code)">
            <div class="flex items-center gap-3">
              <!-- 地区图片 -->
              <div class="flex items-center">
                <img v-if="tag.iconType == 'image'" :src="tag.icon" class="size-8" />
                <Icon :name="tag.icon" class="text-lg rounded-sm border" v-else />
              </div>
              <!-- 文字描述 -->
              <div class="flex flex-col gap-0.5">
                <div class="flex items-baseline gap-1">
                  <span class="font-bold text-lg font-mono">{{ tag.code }}</span>
                  <span class="text-xs text-gray-400">{{ tag.name }}</span>
                </div>
                <div class="text-gray-700 text-sm">{{ tag.description }}</div>
              </div>
            </div>
            <!-- 是否被选中 -->
            <div class="w-5 flex items-center justify-center">
              <Icon
                name="material-symbols:check-circle-rounded"
                class="text-lg"
                :class="[hasTag(tag.code) ? 'text-blue-400' : 'text-gray-400/60']"
              />
            </div>
          </div>
        </div>

        <!-- 其他 -->
        <p class="font-semibold my-3">其他地区</p>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="region-tag" v-for="tag in regionTagsB" @click="addTag(tag.code)">
            <div class="flex items-center gap-3">
              <!-- 地区图片 -->
              <div class="flex items-center">
                <img v-if="tag.iconType == 'image'" :src="tag.icon" class="size-8" />
                <Icon :name="tag.icon" class="text-lg rounded-sm border" v-else />
              </div>
              <!-- 文字描述 -->
              <div class="flex flex-col gap-0.5">
                <div class="flex items-baseline gap-1">
                  <span class="font-bold text-lg font-mono">{{ tag.code }}</span>
                  <span class="text-xs text-gray-400">{{ tag.name }}</span>
                </div>
                <div class="text-gray-700 text-sm">{{ tag.description }}</div>
              </div>
            </div>
            <!-- 是否被选中 -->
            <div class="w-5 flex items-center justify-center">
              <Icon
                name="material-symbols:check-circle-rounded"
                class="text-lg"
                :class="[hasTag(tag.code) ? 'text-blue-400' : 'text-gray-400/60']"
              />
            </div>
          </div>
        </div>

        <!-- 按载体 -->
        <p class="font-semibold my-3">按发行载体</p>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="region-tag" v-for="tag in regionTagsC" @click="addTag(tag.code)">
            <div class="flex items-center gap-3">
              <!-- 地区图片 -->
              <div class="flex items-center">
                <img v-if="tag.iconType == 'image'" :src="tag.icon" class="size-8" />
                <Icon :name="tag.icon" class="text-lg rounded-sm border" v-else />
              </div>
              <!-- 文字描述 -->
              <div class="flex flex-col gap-0.5">
                <div class="flex items-baseline gap-1">
                  <span class="font-bold text-lg font-mono">{{ tag.code }}</span>
                  <span class="text-xs text-gray-400">{{ tag.name }}</span>
                </div>
                <div class="text-gray-700 text-sm">{{ tag.description }}</div>
              </div>
            </div>
            <!-- 是否被选中 -->
            <div class="w-5 flex items-center justify-center">
              <Icon
                name="material-symbols:check-circle-rounded"
                class="text-lg"
                :class="[hasTag(tag.code) ? 'text-blue-400' : 'text-gray-400/60']"
              />
            </div>
          </div>
        </div>

        <!-- 提交更新 -->
        <div class="mt-5">
          <button
            class="bg-lime-500 text-white hover:green-purple-600 px-5 py-2 rounded-md flex items-center gap-2"
            @click="submit($event)"
          >
            <Icon name="iconamoon:send" v-if="!loading" />
            <Icon name="svg-spinners:90-ring-with-bg" v-else />
            提交更新
          </button>
        </div>
      </div>
    </div>
    <!-- 当前关联 -->
    <div
      class="mt-10 flex border p-5 items-center justify-center mb-5"
      v-if="!editorShow && !contributed"
    >
      <div class="font-bold text-lg">当前关联TAG:</div>
      <div class="ml-2">
        <div class="flex gap-1" v-if="trophySet.region">
          <span
            class="px-2 py-1 bg-blue-50 text-blue-600 rounded-md ml-2"
            v-for="region in trophySet.region.split(',')"
          >
            {{ region }}
          </span>
        </div>
        <span v-else>暂未标记</span>
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
const confirm = useConfirm();

const { getRegionTagA, getRegionTagB, getRegionTagC } = useTrophies();

const toast = useToast();
const userStore = useUserStore();
const { authenticated } = storeToRefs(userStore);

const contributed = ref(false);
const editorShow = ref(false);
const loading = ref(false);
const confirmDeleted = ref(false);

const selectedTags = ref(new Set());

const regionTagsA = getRegionTagA();

const regionTagsB = getRegionTagB();

const regionTagsC = getRegionTagC();

const confirmRemove = event => {
  confirm.require({
    target: event.currentTarget,
    message: '当前一个TAG都没被选中，你确认要删除所有TAG吗',
    rejectProps: {
      label: '我忘记选了',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: '是的 (请再次点提交)',
      severity: 'danger',
    },
    accept: () => {
      confirmDeleted.value = true;
    },
    reject: () => {
      confirmDeleted.value = false;
    },
  });
};

const { data, error, refresh } = await useAsyncData('trophy-set-region', fetchTrophySet);

async function fetchTrophySet() {
  const res = await api.get(`/trophies/get/${route.query.id}`);
  return res.data;
}

const trophySet = toRef(data.value, 'trophyTitle');

function edit() {
  if (!authenticated.value) {
    navigateTo('/auth/login');
  } else {
    editorShow.value = true;
  }
}

function submit($event) {
  if (selectedTags.value.size <= 0 && confirmDeleted.value == false) {
    return confirmRemove($event);
  }

  loading.value = true;
  api
    .post('/contribution/trophies/region', {
      resource_id: route.query.id,
      region: Array.from(selectedTags.value).join(','),
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

function addTag(tag) {
  confirmDeleted.value = false;
  if (selectedTags.value.has(tag)) {
    selectedTags.value.delete(tag);
  } else {
    if (selectedTags.value.size >= 3) {
      return toast.add({
        severity: 'warn',
        summary: 'Warn',
        detail: '目前最多只能选中3个TAG哦',
        life: 8000,
      });
    } else {
      selectedTags.value.add(tag);
    }
  }
}

function hasTag(tag) {
  return selectedTags.value.has(tag);
}
</script>

<style lang="postcss" scoped>
.region-tag {
  @apply border px-4 py-3 rounded-md flex items-center justify-between cursor-pointer;
}
.region-tag.actived {
  @apply bg-slate-800 text-white;
}
</style>
