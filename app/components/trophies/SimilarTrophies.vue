<template>
  <div class="mt-8">
    <div class="flex items-center mb-6">
      <img src="https://i.psray.net/i/2024/07/26/66a300d4024c5.png" class="mr-3 w-7" />
      <span class="text-lg font-medium">
        {{ $t('trophies.related_trophy_set') }}
      </span>
    </div>
    <div v-for="similarTrophy in similarTrophies">
      <router-link
        class="flex items-center justify-center my-3 gap-2"
        :to="{
          name: 'trophies-detail',
          params: {
            id: similarTrophy.id,
            language: similarTrophy.default_language,
            title: getTrophySetTitleSlug(similarTrophy.trophyTitleName),
          },
        }"
      >
        <img
          :src="similarTrophy.trophyTitleIconUrl"
          class="w-20 border-2 border-gray-100 rounded-sm"
        />

        <div class="flex-1 line-clamp-1 break-all">
          <p class="font-medium text-nowrap text-ellipsis overflow-hidden w-full">
            {{ similarTrophy.trophyTitleName }}
          </p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="platform in similarTrophy.trophyTitlePlatform.split(',')"
              class="text-xs px-1.5 py-0.5 rounded-sm"
              :class="'platform-' + platform.toLowerCase()"
            >
              {{ platform }}
            </span>
          </div>
        </div>

        <div class="w-6 text-[0.6rem] text-center">
          <div class="flex flex-col gap-1" v-if="similarTrophy.region">
            <span
              class="px-1 py-0.5 bg-gray-100 rounded-sm"
              v-for="region in similarTrophy.region.split(',')"
            >
              {{ region }}
            </span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
defineProps(['similarTrophies']);
const { getTrophySetTitleSlug } = usePsn();
</script>

<style></style>
