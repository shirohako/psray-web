<template>
  <div class="mt-8">
    <div class="flex items-center mb-6">
      <img
        src="https://i.psray.net/i/2023/09/04/64f4f22726ce6.png"
        class="mr-3"
        style="width: 28px"
      />
      <span class="text-lg font-medium">{{ $t('trophies.game_info') }}</span>
    </div>
    <div>
      <img :src="getGameCover(game.igdb_image_id)" class="w-40 m-auto" />
      <p class="text-center text-lg font-bold mt-1">{{ game.title }}</p>
      <p class="text-center mt-0.5 mb-1">{{ game.first_release_date }}</p>
      <p class="flex flex-wrap gap-2 justify-center mb-3" v-if="game.genres">
        <span
          v-for="tag in game.genres.split(',')"
          class="text-blue-400 border-blue-400 border px-3 py-1 rounded-md text-xs"
        >
          {{ tag }}
        </span>
      </p>
      <div class="grid grid-cols-2 w-64 mx-auto">
        <div class="flex items-center justify-center gap-1">
          <Icon
            name="material-symbols:check-circle"
            :class="[hasWindowsRelease(game.platforms) ? 'text-blue-400' : 'text-gray-300']"
          />
          PC (Windows)
        </div>
        <div class="flex items-center justify-center gap-1">
          <Icon
            name="material-symbols:check-circle"
            :class="[hasNintendoRelease(game.platforms) ? 'text-red-400' : 'text-gray-300']"
          />
          Nintendo
        </div>
        <div class="flex items-center justify-center gap-1">
          <Icon
            name="material-symbols:check-circle"
            :class="[hasSmartphoneRelease(game.platforms) ? 'text-purple-400' : 'text-gray-300']"
          />
          Android / iOS
        </div>
        <div class="flex items-center justify-center gap-1">
          <Icon
            name="material-symbols:check-circle"
            :class="[hasXboxRelease(game.platforms) ? 'text-green-400' : 'text-gray-300']"
          />
          Xbox
        </div>
      </div>
      <div class="text-center mt-3">
        <NuxtLink :to="`/games/${game.id}`" class="text-sm text-center" target="_blank">
          <button
            class="bg-purple-500 text-white px-3 py-1 rounded-md inline-flex items-center gap-1 text-base"
          >
            <Icon name="material-symbols:database" />
            <span>{{ $t('trophies.view_game_details') }}</span>
          </button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(['game']);
const {
  getGameCover,
  getGameIgdbLink,
  hasWindowsRelease,
  hasNintendoRelease,
  hasSmartphoneRelease,
  hasXboxRelease,
} = useGame();
</script>

<style></style>
