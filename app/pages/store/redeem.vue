<template>
  <div class="max-w-screen-lg mx-auto py-4 px-6">
    <div class="mt-3 px-8 py-5 rounded-md shadow-[0px_10px_30px_3px_#00000024]">
      <!-- 导航面包屑 -->
      <div class="mt-5">
        <p class="font-bold text-lg">{{ $t('store.redeem.title') }}</p>
        <div class="text-xs text-gray-500 my-1">
          {{ $t('store.redeem.text_1') }}
        </div>
        <div class="text-xs text-gray-500 my-1">
          {{ $t('store.redeem.text_2') }}
        </div>
        <p class="text-xs text-gray-500 my-1">
          {{ $t('store.redeem.text_3') }}
        </p>
        <div v-if="authenticated">
          <p class="font-medium">{{ $t('store.balance') }}</p>
          <p class="text-xs text-gray-500 my-1">
            {{ $t('store.balance_text') }}
          </p>
          <div class="flex flex-wrap border-l-2 border-l-blue-600 pl-3 my-3">
            <div class="flex items-center gap-2 px-2 py-1">
              <img src="https://i.psray.net/i/2024/07/17/6696acf994b94.png" class="size-5" />
              <span class="font-semibold">{{ user.star_piece }}</span>
              <span v-if="data.used_items">
                ({{ user.star_piece - data.used_items.star }} {{ $t('store.remaining') }})
              </span>
            </div>
            <div class="flex items-center gap-2 px-2 py-1">
              <img src="https://i.psray.net/i/2024/07/17/6696afa80d3c4.png" class="size-5" />
              <span class="font-semibold">{{ user.rare_candy }}</span>
              <span v-if="data.used_items">
                ({{ user.rare_candy - data.used_items.candy }} {{ $t('store.remaining') }})
              </span>
            </div>
            <div class="flex items-center gap-2 px-2 py-1">
              <img src="https://i.psray.net/i/2024/08/02/66ac21691a054.png" class="size-5" />
              <span class="font-semibold">{{ user.philosophers_stone }}</span>
              <span v-if="data.used_items">
                ({{ user.philosophers_stone - data.used_items.stone }} {{ $t('store.remaining') }})
              </span>
            </div>
            <div class="flex items-center gap-2 px-2 py-1">
              <img src="https://i.psray.net/i/2024/08/02/66ac244902d7c.png" class="size-5" />
              <span class="font-semibold">{{ user.mira }}</span>
              <span v-if="data.used_items">
                ({{ user.mira - data.used_items.mira }} {{ $t('store.remaining') }})
              </span>
            </div>
          </div>

          <!-- 是否已经兑换 -->
          <div class="flex flex-wrap border-l-2 border-l-blue-600 pl-3 my-3" v-if="data.available">
            {{ $t('store.redeem.not_redeem') }}
          </div>
          <div
            class="bg-green-50/60 border border-green-300 text-green-500 px-3 py-2 rounded-md"
            v-else
          >
            <div class="text-lg font-bold">
              {{ $t('store.redeem.redeemed') }}
            </div>
            <div>
              {{ $t('store.redeem.redeemed_date') }}：
              {{ format(fromUnixTime(data.redeemed), 'yyyy-MM-dd hh:mm') }}
            </div>
            <div class="mt-3 text-blue-500">
              <div class="font-semibold">
                {{ $t('store.redeem.obtaining') }}
              </div>
              <div>PSN: abyssmoe (PSNID)</div>
              <div>QQ Group：664366349</div>
              <div>Email: ame@psray.net</div>
              <div>Telegram：<a href="https://t.me/shirohako" target="_blank">@shirohako</a></div>
            </div>
          </div>
        </div>

        <div class="mt-3 flex gap-2 items-center" v-else>
          <button
            class="bg-blue-500 text-white py-2 px-4 inline text-xs rounded-lg"
            @click="router.push('/auth/login')"
          >
            {{ $t('common.login') }}
          </button>
          <button
            class="bg-pink-500 text-white py-2 px-3 inline text-xs rounded-lg"
            @click="router.push('/auth/signup')"
          >
            {{ $t('common.sign_up') }}
          </button>
        </div>
      </div>
      <!-- 兑换物品信息 -->
      <div class="rounded-md px-1 mt-3">
        <div class="border p-5 flex gap-3">
          <img :src="data.product.img_url" class="w-full max-w-72" />
          <div>
            <p class="text-lg font-medium">{{ data.product.name }}</p>
            <div
              class="text-sm text-gray-500 max-w-96 my-2 py-2 px-3 border border-dashed border-indigo-300 rounded-sm"
            >
              <p class="flex items-center gap-1 justify-center">
                <Icon name="tabler:arrows-exchange" />
                <span>{{ $t('store.require_item') }}</span>
              </p>

              <div class="grid grid-cols-2">
                <div class="flex gap-2 items-center justify-center">
                  <img src="https://i.psray.net/i/2024/07/17/6696acf994b94.png" class="size-3" />
                  <span>{{ data.product.points_require.star }}</span>
                </div>
                <div class="flex gap-2 items-center justify-center">
                  <img src="https://i.psray.net/i/2024/07/17/6696afa80d3c4.png" class="size-3" />
                  <span>{{ data.product.points_require.candy }}</span>
                </div>
                <div class="flex gap-2 items-center justify-center">
                  <img src="https://i.psray.net/i/2024/08/02/66ac21691a054.png" class="size-3" />
                  <span>{{ data.product.points_require.stone }}</span>
                </div>
                <div class="flex gap-2 items-center justify-center">
                  <img src="https://i.psray.net/i/2024/08/02/66ac244902d7c.png" class="size-3" />
                  <span>{{ data.product.points_require.mira }}</span>
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-500 flex items-center gap-1 justify-center my-2">
              <Icon name="material-symbols:inventory-2-outline" />
              <span>{{ $t('store.stock') }}: {{ data.product.stock }}</span>
            </p>
            <p class="text-sm text-gray-500 flex items-center gap-1 justify-center my-2">
              <Icon name="material-symbols:inventory-2-outline" />
              <span>{{ $t('store.capacity') }}: {{ data.product.capacity }}</span>
            </p>
            <div class="text-center">
              <button
                class="mx-auto text-sm bg-blue-500 px-4 py-1 rounded-md text-white disabled:bg-blue-400 disabled:cursor-not-allowed"
                @click="redeemItem"
                :disabled="!available"
              >
                {{ $t('store.redeem.button') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 兑换记录 -->
    <div class="mt-3 px-8 py-5 rounded-md shadow-[0px_10px_30px_3px_#00000024]">
      <p class="font-bold text-lg my-3">{{ $t('store.redeem.record') }}</p>
      <NoDataFound v-if="data.redeem_log?.length <= 0" />
      <table class="table-auto mt-5 border-collapse border border-slate-300" v-else>
        <thead>
          <tr>
            <td class="px-3 py-2 font-bold border border-slate-300 bg-gray-50">
              {{ $t('store.redeem.redeemer') }}
            </td>
            <td class="px-3 py-2 font-bold border border-slate-300 bg-gray-50">
              {{ $t('store.redeem.redeemed_date') }}
            </td>
            <td class="px-3 py-2 font-bold border border-slate-300 bg-gray-50">
              {{ $t('store.redeem.quantity') }}
            </td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data.redeem_log">
            <td class="px-3 py-2 border border-slate-300">
              <div class="flex items-center gap-2">
                <img :src="item.avatarUrl" class="size-8" />
                <span>{{ item.psnid }}</span>
              </div>
            </td>
            <td class="px-3 py-2 border border-slate-300">
              {{ format(fromUnixTime(item.created_at), 'yyyy-MM-dd hh:mm:ss') }}
            </td>
            <td class="px-3 py-2 border border-slate-300 text-center">1</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';
const route = useRoute();
const router = useRouter();
const api = useApi();
const userStore = useUserStore();
const toast = useToast();
const { authenticated, user } = storeToRefs(userStore);

const { data, refresh } = await useAsyncData('stroe', fetchData);
async function fetchData() {
  const res = await api.get('/store/item', {
    params: { productId: route.query.id },
  });
  return res.data;
}

const available = computed(() => {
  // 判断登录
  if (!authenticated.value) {
    return false;
  }

  // 判断是否已经兑换过了
  if (!data.value.available) {
    return false;
  }

  // 判断是否还有库存
  if (data.value.product.stock <= 0) {
    return false;
  }

  // 是否超过兑换时间

  // 用户货币是否足够

  return true;
});

function redeemItem() {
  api
    .post('/store/item', { productId: route.query.id })
    .then(res => {
      if (res?.data?.success) {
        refresh();

        toast.add({
          severity: 'success',
          summary: '兑换成功',
          detail: '目前奖励需要人工兑换，请留意页面上联系方式',
          life: 10000,
        });
      } else {
        throw '发生了未知的错误';
      }
    })
    .catch(error => {
      let summary = '兑换失败';
      let message = '抱歉出错了，清向管理员反馈。';
      if (error?.response?.data?.error?.message) {
        message = error.response.data.error.message;
      }
      toast.add({ severity: 'error', summary, detail: message, life: 10000 });
    });
}

if (authenticated.value) {
  userStore.refreshUserInfo();
}
</script>
