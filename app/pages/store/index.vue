<template>
  <div class="max-w-screen-lg mx-auto py-4 px-6">
    <div class="mt-3 px-8 py-5 rounded-md shadow-[0px_10px_30px_3px_#00000024]">
      <!-- 导航面包屑 -->
      <h2 class="text-2xl font-bold my-1">{{ $t('store.title') }}</h2>
      <div class="text-xs text-gray-500">
        {{ $t('store.description_1') }}
      </div>
      <div class="text-xs text-gray-500">
        {{ $t('store.description_2') }}
      </div>
      <div class="text-xs text-gray-500">
        {{ $t('store.description_3') }}
      </div>
      <!-- 我的可兑换道具 -->
      <div class="mt-5">
        <p class="font-medium">{{ $t('store.balance') }}</p>
        <p class="text-xs text-gray-500 my-1">
          {{ $t('store.balance_text') }}
        </p>
        <div class="flex flex-wrap border-l-2 border-l-blue-600 pl-3 my-3" v-if="authenticated">
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
      <!-- 充值卡 -->
      <div class="my-5">
        <div class="font-bold text-xl mb-1">
          {{ $t('store.gift_card.name') }}
        </div>
        <p class="text-xs text-gray-500">
          {{ $t('store.gift_card.text_1') }}
        </p>
        <p class="text-xs text-gray-500">
          {{
            $t('store.gift_card.text_2', {
              date: '2024/10/12 ~ 2024/12/10',
              limit: '$50 HKD',
            })
          }}
        </p>
        <div class="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 rounded-md px-1 mt-3">
          <div class="text-center border p-5" v-for="item in data.products">
            <img :src="item.img_url" class="w-full max-w-56 mx-auto" />
            <p class="text-lg font-medium">{{ item.name }}</p>
            <div
              class="text-sm text-gray-500 max-w-56 mx-auto my-2 py-2 px-3 border border-dashed border-indigo-300 rounded-sm"
            >
              <p class="flex items-center gap-1 justify-center">
                <Icon name="tabler:arrows-exchange" />
                <span>{{ $t('store.require_item') }}</span>
              </p>

              <div class="grid grid-cols-2">
                <div class="flex gap-2 items-center justify-center">
                  <img src="https://i.psray.net/i/2024/07/17/6696acf994b94.png" class="size-3" />
                  <span>{{ item.points_require.star }}</span>
                </div>
                <div class="flex gap-2 items-center justify-center">
                  <img src="https://i.psray.net/i/2024/07/17/6696afa80d3c4.png" class="size-3" />
                  <span>{{ item.points_require.candy }}</span>
                </div>
                <div class="flex gap-2 items-center justify-center">
                  <img src="https://i.psray.net/i/2024/08/02/66ac21691a054.png" class="size-3" />
                  <span>{{ item.points_require.stone }}</span>
                </div>
                <div class="flex gap-2 items-center justify-center">
                  <img src="https://i.psray.net/i/2024/08/02/66ac244902d7c.png" class="size-3" />
                  <span>{{ item.points_require.mira }}</span>
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-500 flex items-center gap-1 justify-center my-2">
              <Icon name="material-symbols:inventory-2-outline" />
              <span>{{ $t('store.stock') }}: {{ item.stock }}</span>
            </p>
            <p class="text-sm text-gray-500 flex items-center gap-1 justify-center my-2">
              <Icon name="material-symbols:inventory-2-outline" />
              <span>{{ $t('store.capacity') }}: {{ item.capacity }}</span>
            </p>
            <button
              class="text-sm bg-blue-500 px-4 py-1 rounded-md text-white disabled:bg-blue-400 disabled:cursor-not-allowed"
              @click="router.push(`/store/redeem?id=${item.id}`)"
            >
              {{ $t('store.view') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const api = useApi();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { authenticated, user } = storeToRefs(userStore);
const { data } = await useAsyncData('stroe', fetchData);
async function fetchData() {
  const res = await api.get('/store/list');
  return res.data;
}
if (authenticated.value) {
  userStore.refreshUserInfo();
}
</script>
