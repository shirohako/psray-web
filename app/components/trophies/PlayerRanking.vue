<template>
  <div class="mt-8">
    <div class="flex items-center mb-6">
      <img
        src="https://i.psray.net/i/2024/08/21/66c53edc858f5.png"
        class="mr-3"
        style="width: 28px"
      />
      <span class="text-lg font-medium">{{ $t('trophies.player_ranking') }}</span>
    </div>
    <div class="flex flex-col gap-3">
      <NuxtLink
        :to="{
          path: '/trophies/ranking/pioneers',
          query: { trophies: route.params.id },
        }"
      >
        <div class="flex gap-3 items-center justify-between border p-2 rounded-md">
          <div class="flex gap-3 items-center">
            <img src="https://i.psray.net/i/2024/08/21/66c53be4a4dad.png" class="w-8 h-8" />
            <span class="font-bold">{{ $t('trophies.first_achievers') }}</span>
          </div>
          <Icon
            name="material-symbols:arrow-right-alt-rounded"
            class="text-2xl hover:translate-x-1 transition-transform"
          ></Icon>
        </div>
      </NuxtLink>

      <NuxtLink
        :to="{
          path: '/trophies/ranking/time-attack',
          query: { trophies: route.params.id },
        }"
      >
        <div class="flex gap-3 items-center justify-between border p-2 rounded-md">
          <div class="flex gap-3 items-center">
            <img src="https://i.psray.net/i/2024/08/21/66c53db151c22.png" class="w-8 h-8" />
            <span class="font-bold"> {{ $t('trophies.fastest_completed') }}</span>
          </div>
          <Icon
            name="material-symbols:arrow-right-alt-rounded"
            class="text-2xl hover:translate-x-1 transition-transform"
          ></Icon>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
</script>

<style></style>
