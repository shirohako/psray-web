<template>
  <div class="flex flex-wrap gap-3 p-2 max-w-screen-md mx-auto">
    <div class="w-full mt-3 border shadow-lg p-10 rounded-md mx-5 flex flex-col items-center">
      <!-- 标题 -->
      <div class="flex justify-center">
        <h2 class="text-xl font-extrabold text-weight-medium">
          {{ $t('sync.title') }}
        </h2>
        <span
          class="ml-2 inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold bg-purple-100 text-purple-800 shadow-sm"
        >
          Alpha
        </span>
      </div>

      <!-- 副标题 -->
      <div class="mt-1">{{ $t('sync.sub_title') }}</div>

      <!-- 输入框 -->
      <InputText type="text" v-model="psnid" class="mt-5 w-80" />

      <!-- 同步按钮 -->
      <button
        class="relative text-lg group mt-5 cursor-pointer"
        @click="syncPlayer"
        v-show="!syncing"
      >
        <span
          class="relative z-10 block px-5 py-3 overflow-hidden font-medium leading-tight text-gray-800 transition-colors duration-300 ease-out border-2 border-gray-900 rounded-lg group-hover:text-white"
        >
          <span class="absolute inset-0 w-full h-full px-5 py-3 rounded-lg bg-gray-50"></span>
          <span
            class="absolute left-0 w-48 h-48 -ml-2 transition-all duration-300 origin-top-right -rotate-90 -translate-x-full translate-y-12 bg-gray-900 group-hover:-rotate-180 ease"
          ></span>
          <span class="relative">{{ $t('sync.button') }}</span>
        </span>
        <span
          class="absolute bottom-0 right-0 w-full h-12 -mb-1 -mr-1 transition-all duration-200 ease-linear bg-gray-900 rounded-lg group-hover:mb-0 group-hover:mr-0"
          data-rounded="rounded-lg"
        ></span>
      </button>

      <!-- 同步成功的提示 -->
      <div
        v-show="syncSuccess"
        class="w-full mx-10 mt-5 relative p-4 bg-green-50 text-center boder border-gray-800 rounded-lg shadow dark:bg-gray-800 sm:p-5"
      >
        <div
          class="w-12 h-12 rounded-full bg-green-200 dark:bg-green-900 p-2 flex items-center justify-center mx-auto mb-3.5"
        >
          <svg
            aria-hidden="true"
            class="w-8 h-8 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span class="sr-only">Success</span>
        </div>
        <p class="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {{ $t('sync.success.title') }}
        </p>
        <p class="text-sm text-gray-500 dark:text-white">
          {{ $t('sync.success.text_1') }}
        </p>
        <p class="mb-4 text-sm text-gray-500 dark:text-white">
          {{ $t('sync.success.text_2') }}
        </p>
        <button
          data-modal-toggle="successModal"
          type="button"
          @click="$router.push(`/p/${psnid}`)"
          class="bg-purple-500 py-2 px-3 text-sm font-normal text-center text-white rounded-lg bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:focus:ring-primary-900"
        >
          {{ $t('sync.success.button', { psnid }) }}
        </button>
      </div>
      <!-- 同步警告 -->
      <div class="mt-5 max-w-[70%]" v-show="!syncSuccess && !syncing">
        <div class="inline-block p-3 rounded-md bg-blue-100 border border-blue-300 text-indigo-500">
          <p class="text-lg font-bold">{{ $t('sync.message.title') }}</p>
          <p class="text-sm mt-1">{{ $t('sync.message.text_1') }}</p>
          <p class="text-sm">
            {{ $t('sync.message.text_2') }}
          </p>
          <p class="text-sm">
            {{ $t('sync.message.text_3') }}
          </p>
        </div>
      </div>
      <!-- 正在同步 -->
      <div
        v-show="syncing"
        class="flex items-center border mt-5 p-2 border-gray-200 rounded-lg bg-blue-50 text-blue-600 dark:bg-gray-800 dark:border-gray-700"
      >
        <div role="status">
          <svg
            aria-hidden="true"
            class="w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 inline-block"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span>{{ $t('sync.syncing_text') }} </span>
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast';
import _ from 'lodash';

useSeoMeta({
  title: 'PSN账号同步',
  description: '同步您的PSN账户信息，记录游戏轨迹。',
});

const route = useRoute();
const psnid = ref(route.query.psnid);
const syncing = ref();
const syncSuccess = ref();
const api = useApi();
const toast = useToast();

async function syncPlayer() {
  if (!psnid.value) {
    return;
  }

  syncing.value = true;
  syncSuccess.value = false;

  api
    .get(`/sync/${psnid.value}`)
    .then(({ data: { success } }) => {
      syncSuccess.value = success;
    })
    .catch(error => {
      let summary = '同步失败';
      let message = '抱歉出错了，清向管理员反馈。';
      if (_.has(error, 'response.data.error.message')) {
        message = error.response.data.error.message;
      }
      toast.add({ severity: 'error', summary, detail: message, life: 3000 });
    })
    .finally(() => {
      syncing.value = false;
    });
}
</script>
