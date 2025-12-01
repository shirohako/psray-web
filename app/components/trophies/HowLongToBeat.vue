<template>
  <div>
    <div class="flex items-center mb-3">
      <img
        src="https://i.psray.net/i/2024/08/29/66d043f491c3a.png"
        class="mr-3"
        style="width: 28px"
      />
      <span class="text-lg font-medium">
        {{ $t('trophies.how_long_to_beat.title') }}
      </span>
    </div>
    <div class="time-tip text-xs text-gray-500 my-1">
      <div class="flex items-center gap-1">
        <Icon name="material-symbols:info-outline-rounded" />
        <span> {{ $t('trophies.how_long_to_beat.text_1') }}</span>
      </div>
      <div class="flex items-center gap-1">
        <Icon name="material-symbols:info-outline-rounded" />
        <span> {{ $t('trophies.how_long_to_beat.text_2') }}</span>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-y-3 mt-3">
      <div class="flex gap-3 items-center">
        <Icon name="ic:outline-alarm" class="text-2xl text-indigo-500" />
        <div class="flex flex-col">
          <div class="text-xl flex gap-1 items-baseline">
            <span class="font-bold" v-if="game?.story_playtime">
              {{ Math.ceil(game.story_playtime) }}
            </span>
            <span class="font-bold" v-else>???</span>
            <span class="text-xs">Hours</span>
          </div>
          <div class="text-sm">
            {{ $t('trophies.how_long_to_beat.story_playtime') }}
          </div>
        </div>
      </div>
      <div class="flex gap-3 items-center">
        <Icon name="ic:outline-alarm" class="text-2xl text-blue-600" />
        <div class="flex flex-col">
          <div class="text-xl flex gap-1 items-baseline">
            <span class="font-bold" v-if="game?.completionist_playtime">
              {{ Math.ceil(game.completionist_playtime) }}
            </span>
            <span class="font-bold" v-else>???</span>
            <span class="text-xs">Hours</span>
          </div>
          <div class="text-sm">
            {{ $t('trophies.how_long_to_beat.platinum_playtime') }}
          </div>
        </div>
      </div>
      <div class="flex gap-3 items-center">
        <Icon name="material-symbols:directory-sync-rounded" class="text-2xl text-green-600" />
        <div class="flex flex-col">
          <div class="text-xl flex gap-1 items-baseline">
            <span class="font-bold" v-if="game?.playthrough">
              {{ Math.ceil(game.playthrough) }}
            </span>
            <span class="font-bold" v-else>???</span>
          </div>
          <div class="text-sm">
            {{ $t('trophies.how_long_to_beat.playthrough') }}
          </div>
        </div>
      </div>
      <div class="flex gap-3 items-center">
        <Icon name="material-symbols:auto-awesome-rounded" class="text-2xl text-orange-500" />
        <div class="flex flex-col">
          <div class="text-xl flex gap-1 items-baseline">
            <span class="font-bold" v-if="game?.difficulty">
              {{ game.difficulty.toFixed(1) }}
            </span>
            <span class="font-bold" v-else>?</span>
            <span class="text-xs">/</span>
            <span>10</span>
          </div>
          <div class="text-sm">
            {{ $t('trophies.how_long_to_beat.difficulty') }}
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap justify-center items-center gap-3 mt-5">
      <NuxtLink :to="sharePlayTimeLink">
        <button class="bg-pink-400 text-white px-3 py-1 rounded-md flex items-center gap-1">
          <Icon name="material-symbols:upload" />
          <span>{{ $t('trophies.how_long_to_beat.share_my_time') }}</span>
        </button>
      </NuxtLink>

      <NuxtLink :to="`/laboratory/contributions/trophies/playthroughs?id=${route.params.id}`">
        <button class="bg-green-500 text-white px-3 py-1 rounded-md flex items-center gap-1">
          <Icon name="material-symbols:patient-list" />
          <span>{{ $t('trophies.how_long_to_beat.detail_button_text') }}</span>
        </button>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { authenticated } = storeToRefs(userStore);
defineProps(['game']);

const sharePlayTimeLink = computed(() => {
  if (!authenticated.value) {
    return '/auth/login';
  }
  return `/laboratory/contributions/trophies/playthroughs?id=${route.params.id}`;
});
</script>

<style></style>
