<template>
  <div class="max-w-screen-xl mx-auto py-4 px-6">
    <div class="flex gap-5">
      <button
        @click="router.back"
        class="my-5 bg-pink-50 text-pink-400 border rounded-md px-3 py-2 border-pink-300 hover:bg-pink-100 hover:text-pink-500"
      >
        {{ $t('trophy.players.back_1') }}
      </button>

      <NuxtLink :to="{ name: 'trophy', params: { id: route.query.id } }">
        <button
          class="my-5 bg-blue-50 text-blue-400 border rounded-md px-3 py-2 border-blue-300 hover:bg-blue-100 hover:text-blue-500"
        >
          {{ $t('trophy.players.back_2') }}
        </button>
      </NuxtLink>
    </div>

    <NoDataFound v-if="data.first.length == 0" />
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8" v-else>
      <div>
        <h2 class="flex items-center justify-center gap-3 font-bold text-xl my-6">
          <img src="https://i.psray.net/i/2024/08/23/66c8556917f6b.png" class="size-10" />
          {{ $t('trophy.players.fastest') }}
        </h2>

        <ul>
          <li
            v-for="(userPlayRecord, i) in data.first"
            class="flex flex-wrap items-center gap-3 my-3 border px-2 py-2 rounded-md hover:bg-stone-50"
          >
            <div class="text-sm px-1 py-1 bg-gray-100 rounded-md w-8 text-center">
              {{ ++i }}
            </div>
            <img :src="userPlayRecord.avatarUrl" class="w-10 h-10 rounded-full mx-2" />
            <Icon
              :name="`flag:${userPlayRecord.country.toLowerCase()}-4x3`"
              class="text-2xl border"
            />
            <div class="w-32 grow">
              <NuxtLink
                :to="{
                  name: 'player-profile',
                  params: { psnid: userPlayRecord.psnid },
                }"
                >{{ userPlayRecord.psnid }}</NuxtLink
              >
            </div>
            <div class="text-sm text-gray-700">
              {{ format(fromUnixTime(userPlayRecord.earned_at), 'yyyy-MM-dd HH:mm:ss') }}
            </div>
          </li>
        </ul>
      </div>
      <div>
        <h2 class="flex items-center justify-center gap-3 font-bold text-xl my-6">
          <img src="https://i.psray.net/i/2024/08/23/66c8554e57382.png" class="size-10" />
          {{ $t('trophy.players.recent') }}
        </h2>
        <ul>
          <li
            v-for="(userPlayRecord, i) in data.last"
            class="flex flex-wrap items-center gap-3 my-3 border px-2 py-2 rounded-md hover:bg-stone-50"
          >
            <div class="text-sm px-1 py-1 bg-gray-100 rounded-md w-8 text-center">
              {{ ++i }}
            </div>
            <img :src="userPlayRecord.avatarUrl" class="w-10 h-10 rounded-full mx-2" />
            <Icon
              :name="`flag:${userPlayRecord.country.toLowerCase()}-4x3`"
              class="text-2xl border"
            />
            <div class="w-32 grow">
              <NuxtLink
                :to="{
                  name: 'player-profile',
                  params: { psnid: userPlayRecord.psnid },
                }"
                >{{ userPlayRecord.psnid }}</NuxtLink
              >
            </div>
            <div class="text-sm text-gray-700">
              {{ format(fromUnixTime(userPlayRecord.earned_at), 'yyyy-MM-dd HH:mm:ss') }}
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';

const route = useRoute();
const router = useRouter();
const api = useApi();
const { data, error, refresh } = await useAsyncData('trophy-achievers', fetchData);

async function fetchData() {
  const res = await api.get(`/trophy/achievers`, {
    params: {
      id: route.query.id,
    },
  });
  return res.data;
}
</script>

<style lang="postcss" scoped>
ul li:nth-child(even) {
  @apply bg-gray-50;
}
</style>
