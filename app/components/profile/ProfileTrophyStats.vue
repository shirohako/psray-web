<template>
  <div class="mt-5">
    <div class="flex items-center mb-6">
      <img
        src="https://i.psray.net/i/2023/09/04/64f4de7760775.png"
        class="mr-2"
        style="width: 28px"
      />
      <span class="text-lg font-medium">{{ $t('profile.trophy') }}</span>
    </div>
    <div class="grid grid-cols-4 gap-2 mb-5">
      <div
        class="flex flex-col md:flex-row justify-center md:justify-between items-center border rounded-md p-3 col-span-2"
      >
        <img
          src="https://i.psray.net/i/2023/09/04/64f4f7a305dcd.png"
          style="width: 40px; height: 40px"
        />
        <div class="text-center md:text-right pt-1 md:pt-0">
          <div class="text-lg font-semibold">
            {{ firstTrophy }}
          </div>
          <div class="text-xs">
            {{ $t('profile.first_trophy_earned_at') }}
          </div>
        </div>
      </div>
      <div
        class="flex flex-col md:flex-row justify-center md:justify-between items-center border rounded-md p-3"
      >
        <img
          src="https://i.psray.net/i/2024/10/13/670b3e10d3fc1.png"
          style="width: 40px; height: 40px"
        />
        <div class="text-center md:text-right pt-1 md:pt-0">
          <div class="text-lg font-semibold">
            {{ trophyLevel }}
          </div>
          <div class="text-xs">{{ $t('profile.psn_level') }}</div>
        </div>
      </div>
      <div
        class="flex flex-col md:flex-row justify-center md:justify-between items-center border rounded-md p-3"
      >
        <img
          src="https://i.psray.net/i/2023/09/04/64f4f8a59f6b2.png"
          style="width: 40px; height: 40px"
        />
        <div class="text-center md:text-right pt-1 md:pt-0">
          <div class="text-lg font-semibold">
            {{ earnedTrophiesCount }}
          </div>
          <div class="text-xs">
            {{ $t('profile.earned_trophies_count') }}
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div class="flex justify-between items-center border rounded-md p-3">
        <img :src="getTrophyIcon('platinum')" class="size-10" />
        <div class="text-right">
          <div class="text-md md:text-lg font-semibold">
            {{ platinum }}
          </div>
          <div class="text-xs">{{ $t('common.platinum') }}</div>
        </div>
      </div>
      <div class="flex justify-between items-center border rounded-md p-3">
        <img :src="getTrophyIcon('gold')" class="size-10" />
        <div class="text-right">
          <div class="text-md md:text-lg font-semibold">
            {{ gold }}
          </div>
          <div class="text-xs">{{ $t('common.gold') }}</div>
        </div>
      </div>
      <div class="flex justify-between items-center border rounded-md p-3">
        <img :src="getTrophyIcon('silver')" class="size-10" />
        <div class="text-right">
          <div class="text-md md:text-lg font-semibold">
            {{ silver }}
          </div>
          <div class="text-xs">{{ $t('common.silver') }}</div>
        </div>
      </div>
      <div class="flex justify-between items-center border rounded-md p-3">
        <img :src="getTrophyIcon('bronze')" class="size-10" />
        <div class="text-right">
          <div class="text-md md:text-lg font-semibold">
            {{ bronze }}
          </div>
          <div class="text-xs">{{ $t('common.bronze') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  firstTrophy: {
    type: String,
    required: true,
  },
  trophyLevel: {
    type: [Number, String],
    required: true,
  },
  earnedTrophiesCount: {
    type: Number,
    required: true,
  },
  platinum: {
    type: Number,
    required: true,
  },
  gold: {
    type: Number,
    required: true,
  },
  silver: {
    type: Number,
    required: true,
  },
  bronze: {
    type: Number,
    required: true,
  },
});

const { getTrophyIcon } = usePsn();
</script>
