<template>
  <div>
    <div class="flex items-center mb-6">
      <img
        src="https://i.psray.net/i/2023/09/05/64f6007083bbf.png"
        class="mr-2"
        style="width: 28px"
      />
      <span class="text-lg font-medium">{{ $t('profile.ranking') }}</span>
    </div>
    <div class="grid grid-cols-8 gap-2 mb-5">
      <div
        class="col-span-8 md:col-span-4 flex justify-between items-center border rounded-md p-3"
      >
        <img
          src="https://i.psray.net/i/2023/09/04/64f4fb0d2bd87.png"
          style="width: 50px; height: 50px"
        />
        <div>
          <div class="text-xl font-medium flex items-center" v-if="country">
            <Icon :name="`flag:${country.toLowerCase()}-4x3`" class="border" />
            <span class="ml-3 inline-block">
              {{ regionName }}
            </span>
          </div>
          <div class="text-xs text-right">
            {{ $t('profile.server_location') }}
          </div>
        </div>
      </div>
      <div
        class="col-span-4 md:col-span-2 flex justify-between items-center border rounded-md p-3"
      >
        <img
          src="https://i.psray.net/i/2023/09/04/64f4fdd26ce5c.png"
          class="p-2"
          style="width: 50px; height: 50px"
        />
        <div>
          <div class="text-lg font-semibold text-right">
            {{ rank || '等待排名' }}
          </div>
          <div class="text-xs text-right">
            {{ $t('profile.ranking') }}
          </div>
        </div>
      </div>
      <div
        class="col-span-4 md:col-span-2 flex justify-between items-center border rounded-md p-3 flex-nowrap"
      >
        <img
          src="https://i.psray.net/i/2023/09/04/64f5f04181fb0.png"
          class="p-2"
          style="width: 50px; height: 50px"
        />
        <div>
          <div class="text-lg font-semibold text-right">
            {{ serverRank || '等待排名' }}
          </div>
          <div class="text-xs text-right">
            {{ $t('profile.server_rannking') }}
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-6 gap-2 mb-5">
      <div
        class="col-span-3 flex flex-col md:flex-row justify-center md:justify-between items-center border rounded-md p-3"
      >
        <img
          src="https://i.psray.net/i/2023/09/04/64f4ff11658cd.png"
          style="width: 40px; height: 40px"
        />
        <div class="text-center md:text-right pt-2 md:pt-0">
          <div class="text-md font-semibold">
            {{ updatedAt }}
          </div>
          <div class="text-xs">{{ $t('profile.last_update_at') }}</div>
        </div>
      </div>
      <div
        class="col-span-3 flex flex-col md:flex-row justify-center md:justify-between items-center border rounded-md p-3"
      >
        <img
          src="https://i.psray.net/i/2023/09/05/64f5ff0e52e77.png"
          style="width: 40px; height: 40px"
        />
        <div class="text-center md:text-right pt-2 md:pt-0">
          <div class="text-md font-semibold">
            {{ lastTrophy }}
          </div>
          <div class="text-xs">
            {{ $t('profile.last_trophy_earned_at') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  country: {
    type: String,
    default: '',
  },
  rank: {
    type: [Number, String],
    default: '',
  },
  serverRank: {
    type: [Number, String],
    default: '',
  },
  updatedAt: {
    type: String,
    required: true,
  },
  lastTrophy: {
    type: String,
    required: true,
  },
});

const { getRegionName } = usePsn();

const regionName = computed(() => {
  return props.country ? getRegionName(props.country) : '';
});
</script>
