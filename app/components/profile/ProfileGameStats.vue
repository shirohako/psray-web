<template>
  <div class="mt-5">
    <div class="flex items-center mb-6">
      <img
        src="https://i.psray.net/i/2023/09/04/64f4f22726ce6.png"
        class="mr-3"
        style="width: 28px"
      />
      <span class="text-lg font-medium">{{ $t('profile.game') }}</span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      <div class="flex justify-between items-center border rounded-md p-3">
        <img
          src="https://i.psray.net/i/2023/09/04/64f4f2613f72f.png"
          style="width: 45px; height: 45px"
        />
        <div class="text-right">
          <div class="text-xl font-semibold">
            {{ gamesPlayed }}
          </div>
          <div class="text-xs">{{ $t('profile.game_played') }}</div>
        </div>
      </div>
      <div class="flex justify-between items-center border rounded-md p-3">
        <img
          src="https://i.psray.net/i/2023/09/04/64f4f31164d69.png"
          class="p-1"
          style="width: 50px; height: 50px"
        />
        <div class="text-right">
          <div class="text-xl font-semibold">
            {{ completionRate }}
          </div>
          <div class="text-xs">{{ $t('profile.completion_rate') }}</div>
        </div>
      </div>
      <div class="flex justify-between items-center border rounded-md p-3">
        <img
          src="https://i.psray.net/i/2023/09/04/64f4f49b4d609.png"
          class="p-1"
          style="width: 50px; height: 50px"
        />
        <div class="text-right">
          <div class="text-xl font-semibold">
            {{ abandonedGames }}
          </div>
          <div class="text-xs">
            {{ $t('profile.less_than_10') }}
          </div>
        </div>
      </div>
      <div class="flex justify-between items-center border rounded-md p-3">
        <img
          src="https://i.psray.net/i/2023/09/04/64f4f5f5118fe.png"
          class="py-1"
          style="width: 50px; height: 50px"
        />
        <div class="text-right">
          <div class="text-xl font-semibold">
            {{ trophyTip }}
          </div>
          <div class="text-xs">{{ $t('profile.trophy_tips') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  gamesPlayed: {
    type: Number,
    required: true,
  },
  completionRate: {
    type: String,
    required: true,
  },
  abandonedGames: {
    type: Number,
    required: true,
  },
  trophyTip: {
    type: Number,
    required: true,
  },
});
</script>
