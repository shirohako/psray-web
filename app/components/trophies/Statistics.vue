<template>
  <div class="p-4">
    <div class="flex items-center mb-4">
      <img
        src="https://i.psray.net/i/2023/09/10/64fda3a2c3d9a.png"
        class="mr-3"
        style="width: 28px"
      />
      <span class="text-lg font-medium">{{ $t('trophies.statistics') }}</span>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-2">
      <div class="flex justify-between items-center border rounded-md p-3">
        <img
          src="https://i.psray.net/i/2023/09/08/64fa0fcc62402.png"
          style="width: 40px; height: 40px"
        />
        <div class="text-right">
          <div class="text-xl font-medium">{{ trophySet.owners }}</div>
          <div class="text-xs">{{ $t('trophies.played') }}</div>
        </div>
      </div>
      <div class="flex justify-between items-center border rounded-md p-3">
        <img class="size-10" :src="getTrophyIcon('platinum')" />
        <div class="text-right">
          <div class="text-xl font-medium">{{ trophySet.platinum_achievers }}</div>
          <div class="text-xs">{{ $t('trophies.platinum_achievers') }}</div>
        </div>
      </div>
      <div class="flex justify-between items-center border rounded-md p-3">
        <img
          src="https://i.psray.net/i/2023/09/08/64fa0f1dd3813.png"
          style="width: 40px; height: 40px"
        />
        <div class="text-right">
          <div class="text-xl font-medium">{{ trophySet.completed_players }}</div>
          <div class="text-xs">{{ $t('trophies.completed_players') }}</div>
        </div>
      </div>
      <div class="flex justify-between items-center border rounded-md p-3">
        <img
          src="https://i.psray.net/i/2023/09/08/64fa11b74f1a8.png"
          style="width: 40px; height: 40px"
        />
        <div class="text-right">
          <div class="text-xl font-medium">{{ trophySet.recent_players }}</div>
          <div class="text-xs">{{ $t('trophies.recent_players') }}</div>
        </div>
      </div>
      <div class="flex justify-between items-center border rounded-md p-3">
        <img
          src="https://i.psray.net/i/2023/09/08/64fa11b820c39.png"
          style="width: 40px; height: 40px"
        />
        <div class="text-right">
          <div class="text-xl font-medium">{{ trophySet.average_progress }}%</div>
          <div class="text-xs">{{ $t('trophies.average_progress') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(['trophySet'])
const { getTrophyIcon } = usePsn()
</script>
