<template>
  <div class="max-w-screen-xl p-5 mx-auto">
    <!-- 确认部分 -->
    <div>
      <div class="flex flex-col gap-4">
        <h2 class="font-bold text-xl">根据PSN游戏查询奖杯组</h2>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-2">
            <label>玩过该游戏的 PSN ID （必须）</label>
            <label class="text-gray-600 text-sm"
              >先偷个懒，如果查询的psnid没在这里同步，请先同步一次</label
            >
            <InputText type="text" v-model="psnid" class="w-96" />
          </div>
          <div class="flex flex-col gap-2">
            <label>游戏ID （必须）</label>
            <label class="text-gray-600 text-sm">举例：PPSA11432_00 （后面的_00也需要）</label>
            <label class="text-gray-600 text-sm"
              >PS4版本通常是：CUSAXXXXX_00，PS5版本通常是：PPSA11432_00</label
            >
            <InputText type="text" v-model="nptitles" class="w-96" />
          </div>
        </div>
        <div class="flex">
          <button class="bg-blue-500 text-white px-3 py-2 rounded-md" @click="submit">查询</button>
        </div>

        <div class="flex flex-col gap-2">
          <p class="font-bold text-xl">查询结果</p>
          <label class="text-gray-600 text-sm"
            >结果为json格式，使用json工具，会给容易查看，例如 jsoneditoronline
          </label>
          <label class="text-gray-600 text-sm"
            >结果中的npTitleId 为游戏ID，npCommunicationId为PSN奖杯组ID
          </label>

          <div class="flex gap-2">
            <button
              class="px-3 py-2 bg-purple-100 text-purple-500 rounded-md"
              @click="copyToClipboard"
            >
              复制
            </button>

            <a :href="link" target="_blank"
              ><button class="px-3 py-2 bg-sky-100 text-blue-400 rounded-md">
                打开 jsoneditoronline.org
              </button></a
            >
          </div>

          <div class="bg-zinc-900 px-3 py-2 rounded-lg border text-white">
            <div class="flex p-2 gap-1">
              <div class="">
                <span class="bg-red-500 inline-block center w-3 h-3 rounded-full"></span>
              </div>
              <div class="circle">
                <span class="bg-yellow-500 inline-block center w-3 h-3 rounded-full"></span>
              </div>
              <div class="circle">
                <span class="bg-green-500 box inline-block center w-3 h-3 rounded-full"></span>
              </div>
            </div>
            <div class="card__content px-4 py-2 min-h-[100px] overflow-x-auto">
              <pre>{{ pettyed }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['require-admin'],
});

const api = useApi();
const toast = useToast();

const psnid = ref('');
const nptitles = ref('');
const result = ref('');

const link = computed(() => {
  return 'https://jsoneditoronline.org/';
});

const pettyed = computed(() => {
  if (result.value) {
    return JSON.stringify(result.value, null, 2);
  } else {
    return '';
  }
});

function submit() {
  api
    .get('admin/gameTrophies', {
      params: {
        psnid: psnid.value,
        nptitles: nptitles.value,
      },
    })
    .then(res => {
      toast.add({
        severity: 'success',
        summary: '查询成功',
        detail: '如果没有结果，可能是该用户没玩过这个游戏',
        life: 6000,
      });
      result.value = res.data;
    })
    .catch(err => {
      result.value = {
        succes: fasle,
        error: { message: '出错了，请反馈一下' },
      };
    });
}

function copyToClipboard() {
  navigator.clipboard
    .writeText(JSON.stringify(result.value))
    .then(() => {
      console.log('Text copied to clipboard');
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
    });
}
</script>

<style lang="postcss" scoped>
tbody td {
  @apply px-5 py-3 border border-slate-300;
}
</style>
