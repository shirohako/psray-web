<template>
  <div class="max-w-screen-lg mx-auto py-4 px-6 pt-5 flex flex-col gap-5">
    <ConfirmPopup></ConfirmPopup>
    <div class="playthroughs-box p-5 rounded-md">
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
              <span class="ms-1 text-sm font-medium text-gray-500 md:ms-2 dark:text-gray-400"
                >标记游戏时间和难度</span
              >
            </div>
          </li>
        </ol>
      </nav>
      <h2 class="font-bold text-lg my-2">标记游戏时间和难度</h2>
      <p>您可以提供自己的通关游戏时间、白金时间。这能给所有想玩这个游戏的玩家作为参考</p>
      <p>最终结果会排除极端数据，取平均时间计算，越多玩家标记将越接近实际情况</p>
      <p>提交最少需要填写一个，不强制填写所有内容</p>
      <div v-if="data?.game && authenticated">
        <div class="flex flex-col gap-3 mt-5 pl-5 border-l-2 border-blue-500 rounded-sm">
          <!-- 通关时间 -->
          <div class="flex items-center gap-2">
            <div class="flex flex-col justify-center gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <label>您的<b>通关</b>时间（小时）：</label>
                <InputNumber v-model="stroy" :min="0" :max="9999" class="h-8" />
                <button
                  class="bg-pink-50 text-pink-500 px-2 py-1 text-sm rounded-md border border-pink-200"
                  @click="stroy = null"
                >
                  清除
                </button>
              </div>
              <small class="text-gray-500">主线剧情通关所需要的时间</small>
            </div>
          </div>
          <!-- 白金时间 -->
          <div class="flex items-center gap-2">
            <div class="flex flex-col justify-center gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <label>您的<b>白金</b>时间（小时）：</label>
                <InputNumber v-model="completionist" :min="0" :max="9999" class="h-8" />
                <button
                  class="bg-pink-50 text-pink-500 px-2 py-1 text-sm rounded-md border border-pink-200"
                  @click="completionist = null"
                >
                  清除
                </button>
              </div>
              <small class="text-gray-500">预计达成白金奖杯奖杯需要的时间</small>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex flex-col justify-center gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <label>最短白周目数：</label>
                <InputNumber v-model="playthrough" :min="1" :max="99" inputClass="h-8 w-16" />
                <button
                  class="bg-pink-50 text-pink-500 px-2 py-1 text-sm rounded-md border border-pink-200"
                  @click="playthrough = null"
                >
                  清除
                </button>
              </div>
              <small class="text-gray-500">达成白金奖杯需要的游戏流程最低体验次数</small>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <div class="flex flex-col justify-center gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <label>难度评估：</label>
                <InputNumber v-model="difficulty" :min="0" :max="10" inputClass="h-8 w-16" />
                <button
                  class="bg-pink-50 text-pink-500 px-2 py-1 text-sm rounded-md border border-pink-200"
                  @click="difficulty = null"
                >
                  清除
                </button>
              </div>
              <small class="text-gray-500">0~10分，10分为最难</small>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <div class="flex flex-col justify-center gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <label>我所玩的平台：</label>
                <SelectButton
                  v-model="platform"
                  :options="platforms"
                  aria-labelledby="basic"
                  class="flex-wrap gap-1 md:gap-0"
                >
                  <template #option="slotProps">
                    <span class="text-sm">{{ slotProps.option }}</span>
                  </template>
                </SelectButton>
              </div>
              <small class="text-gray-500"
                >单选，不强制选。各平台和版本可能不同，可以使数据更有参考价值</small
              >
            </div>
          </div>
        </div>
        <!-- 功能按钮组 -->
        <div class="mt-5 mb-5 flex gap-5">
          <button
            class="bg-sky-500 text-white hover:bg-sky-600 px-5 py-2 rounded-md"
            @click="submit"
          >
            提交/更新游戏时间
          </button>
          <button
            class="bg-purple-500 text-white hover:bg-purple-600 px-5 py-2 rounded-md"
            @click="confirmRemove($event)"
          >
            删除我提交的时间
          </button>
        </div>
      </div>
      <div v-if="!data?.game" class="my-5 px-4 py-5 bg-blue-100/70 text-blue-500 rounded-md">
        <div class="text-lg mb-2 text-blue-700 flex gap-2 items-center">
          <Icon name="mdi:information-slab-circle" class="text-xl text-blue-500"></Icon>
          <span>需要先关联游戏</span>
        </div>
        <ul class="list-disc list-inside text-sm pl-3">
          <li>为了减少相同奖杯组的重复工作，PSRay直接为标记游戏标记时间</li>
          <li>完全相同的奖杯组，将共享标记的时间</li>
          <li>这个奖杯组还未关联任何游戏</li>
        </ul>
      </div>
      <div v-if="!authenticated" class="my-5 px-4 py-5 bg-pink-100/70 text-pink-500 rounded-md">
        <div class="text-lg mb-2 text-pink-700 flex gap-2 items-center">
          <Icon name="mdi:information-slab-circle" class="text-xl text-pink-500"></Icon>
          <span>需要登录</span>
        </div>
        <ul class="list-disc list-inside text-sm pl-3">
          <li>登录后，可提交您的游戏时长</li>
        </ul>
      </div>
    </div>

    <div class="playthroughs-box p-5 rounded-md">
      <h2 class="font-bold text-lg my-2">用户提交记录</h2>
      <div v-if="data?.playthroughs?.length > 0" class="overflow-x-auto">
        <table class="table-auto w-full playthroughs-table">
          <thead>
            <tr class="bg-slate-100">
              <td>更新时间</td>
              <td>提交用户</td>
              <td>主线时长 (小时)</td>
              <td>白金时长 (小时)</td>
              <td>最低周目</td>
              <td>难度</td>
              <td>平台</td>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reocrd in data.playthroughs">
              <td>
                {{ format(fromUnixTime(reocrd.updated_at), 'yyyy-MM-dd HH:mm') }}
              </td>
              <td class="flex flex-col md:flex-row flex-wrap items-center gap-2">
                <img :src="reocrd.avatarUrl" class="w-8 h-8 rounded-full" />
                <span>{{ reocrd.psnid }}</span>
              </td>
              <td>{{ reocrd.stroy }}</td>
              <td>{{ reocrd.completionist }}</td>
              <td>{{ reocrd.playthrough }}</td>
              <td>
                <span v-if="reocrd.difficulty"> {{ reocrd.difficulty }} / 10 </span>
              </td>
              <td>
                {{ reocrd.platform }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <NoDataFound v-else></NoDataFound>
    </div>
  </div>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';

const userStore = useUserStore();
const { user, authenticated } = storeToRefs(userStore);

const route = useRoute();
const router = useRouter();
const api = useApi();
const confirm = useConfirm();

const stroy = ref(null);
const completionist = ref(null);
const playthrough = ref(null);
const difficulty = ref(null);
const toast = useToast();

const contributed = ref(false);
const loading = ref(false);

const platform = ref(null);
const platforms = ref(['PS3', 'PS4', 'PS5', 'PSVITA', 'PSVR', 'NS', 'XBOX', 'PC', 'Other']);

const { data, error, refresh } = await useAsyncData('trophy-set-playthroughs', fetchTrophySet);

async function fetchTrophySet() {
  const res = await api.get(`/laboratory/trophies/playthroughs`, {
    params: {
      id: route.query.id,
    },
  });
  return res.data;
}

function submit() {
  if (!stroy.value && !completionist.value && !playthrough.value && !difficulty.value) {
    return;
  }

  loading.value = true;
  api
    .post('/contribution/trophies/update-playthrough', {
      id: route.query.id,
      stroy: stroy.value,
      completionist: completionist.value,
      playthrough: playthrough.value,
      difficulty: difficulty.value,
      platform: platform.value,
    })
    .then(res => {
      refresh();
      contributed.value = true;
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: '提交成功',
        life: 8000,
      });
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
    message: '确定要移除已经提交的数据吗',
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
        .post('/contribution/trophies/remove-playthrough', {
          id: route.query.id,
        })
        .then(res => {
          refresh();
          contributed.value = true;
          toast.add({
            severity: 'success',
            summary: 'Success',
            detail: '提交成功',
            life: 8000,
          });
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

<style lang="postcss" scoped>
.playthroughs-box {
  box-shadow:
    rgba(0, 0, 0, 0.1) 0px 0px 5px 0px,
    rgba(0, 0, 0, 0.1) 0px 0px 1px 0px;
}
.playthroughs-table {
  min-width: 520px;
}
.playthroughs-table td {
  @apply px-2 py-1.5;
}
</style>
