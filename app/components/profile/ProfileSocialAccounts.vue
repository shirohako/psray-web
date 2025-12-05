<template>
  <div class="mt-2 pt-4 border-t">
    <div class="flex items-center mb-6">
      <img
        src="https://i.psray.net/i/2023/09/05/64f74dad35bb7.png"
        class="mr-2"
        style="width: 28px"
      />
      <span class="text-base font-semibold">
        {{ $t('profile.linked_game_account') }}
      </span>
    </div>
    <div class="flex flex-col gap-4">
      <div class="flex flex-col xl:flex-row justify-between items-center gap-2">
        <div class="flex items-center gap-1">
          <img src="https://i.psray.net/i/2023/09/06/64f756118b73e.png" class="size-5" />
          <span class="font-semibold">Steam</span>
        </div>

        <span class="text-sm" v-if="!socialAccount?.steam"> - </span>
        <a :href="steamLink" target="_blank" v-else>
          {{ socialAccount?.steam }}
        </a>
      </div>
      <div class="flex flex-col xl:flex-row justify-between items-center gap-2">
        <div class="flex items-center gap-1">
          <img src="https://i.psray.net/i/2023/09/06/64f757bd6abd5.png" class="size-5" />
          <span class="font-semibold">Xbox</span>
        </div>
        <span class="text-sm">
          {{ socialAccount?.xbox || '-' }}
        </span>
      </div>
      <div class="flex flex-col xl:flex-row justify-between items-center gap-2">
        <div class="flex items-center gap-1">
          <img
            src="https://i.psray.net/i/2023/09/06/64f757fb1f750.png"
            class="size-5 mb-1"
          />
          <span class="font-semibold">NS</span>
        </div>
        <span class="text-sm">
          {{ socialAccount?.ns || '-' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  socialAccount: {
    type: Object,
    default: () => ({}),
  },
});

const steamLink = computed(() => {
  if (props.socialAccount?.steam) {
    const steamId = props.socialAccount.steam;
    const isNumber = /^\d{17}$/.test(steamId);

    let inRange = false;
    if (isNumber) {
      const minSteam64Id = BigInt('76561197960265728');
      inRange = BigInt(steamId) >= minSteam64Id;
    }

    if (isNumber && inRange) {
      return `https://steamcommunity.com/profiles/${steamId}`;
    } else {
      return `https://steamcommunity.com/id/${steamId}`;
    }
  }
  return '#';
});
</script>
