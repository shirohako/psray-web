<template>
  <HomeAppBlock :image="image">
    <div>
      <div class="text-xl font-semibold">
        {{ title }}
      </div>

      <div class="flex items-center gap-2 text-base font-normal my-3">
        <img :src="user.avatarUrl" class="size-8 rounded-full" :alt="user.psnid" />
        <span class="font-bold">{{ user.psnid }}</span>
      </div>

      <HomeTrophyStats
        :platinum="user.platinum"
        :gold="user.gold"
        :silver="user.silver"
        :bronze="user.bronze"
      />

      <div class="my-3">
        <HomeRankingInfo
          :label="rankingLabel"
          :global-rank="user.rank"
          :country-rank="user.server_rank"
          :country="user.country"
        />
      </div>
    </div>
  </HomeAppBlock>
</template>

<script setup lang="ts">
interface User {
  avatarUrl?: string;
  psnid?: string;
  platinum?: number;
  gold?: number;
  silver?: number;
  bronze?: number;
  rank?: number;
  server_rank?: number;
  country?: string;
}

interface Props {
  image?: string;
  title: string;
  rankingLabel: string;
  user: User;
}

withDefaults(defineProps<Props>(), {
  image: 'https://i.psray.net/i/2024/08/21/66c5c9f63c993.png',
});
</script>
