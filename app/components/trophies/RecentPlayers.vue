<template>
  <div class="mt-8">
    <div class="flex items-center mb-4">
      <img
        src="https://i.psray.net/i/2024/06/29/667f014a45af8.png"
        class="mr-3"
        style="width: 28px"
      />
      <span class="text-lg font-medium">{{ $t('trophies.recent_players') }}</span>
    </div>
    <!--最近的玩家 -->
    <NuxtLink
      :to="{
        path: '/trophies/ranking/recent',
        query: { trophies: route.params.id, page: 1 },
      }"
    >
      <div class="flex gap-3 items-center justify-between border p-2 rounded-md my-4">
        <div class="flex gap-3 items-center">
          <img src="https://i.psray.net/i/2024/08/21/66c541bd44283.png" class="w-8 h-8" />
          <span class="font-bold">{{ $t('trophies.all_recent_players') }}</span>
        </div>
        <Icon
          name="material-symbols:arrow-right-alt-rounded"
          class="text-2xl hover:translate-x-1 transition-transform"
        ></Icon>
      </div>
    </NuxtLink>

    <div class="flex items-center my-3" v-for="player in recentPlayers">
      <NuxtLink
        class="mr-2"
        :to="{
          name: 'player-profile',
          params: { psnid: player.userProfile.psnid },
        }"
      >
        <img class="rounded-full" :src="player.userProfile.avatarUrl" style="width: 40px" />
      </NuxtLink>
      <div class="grow">
        <NuxtLink
          class="mr-2 font-medium cursor-pointer"
          :to="{
            name: 'trophies-detail',
            params: route.params,
            query: { psnid: player.userProfile.psnid },
          }"
        >
          {{ player.userProfile.psnid }}
        </NuxtLink>
        <div class="text-xs">
          {{ formatISO9075(fromUnixTime(player.last_updated_at)) }}
        </div>
      </div>
      <div style="min-width: 55px">
        <div class="mt-1 w-full">
          <GameProgess :value="player.progress" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
defineProps(['recentPlayers']);
import { format, formatISO9075, fromUnixTime, formatDuration, intervalToDuration } from 'date-fns';
</script>
