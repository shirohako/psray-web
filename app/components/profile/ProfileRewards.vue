<template>
  <div class="mt-2 pt-4 border-t">
    <div class="font-semibold text-lg flex items-center">
      <img
        src="https://i.psray.net/i/2024/07/19/669a429dc981f.png"
        class="w-7 inline-block mr-2"
      />
      <span>{{ $t('profile.contribution_rewards') }}</span>
    </div>
    <div class="flex flex-col">
      <div class="mt-2 flex items-center">
        <img
          src="https://i.psray.net/i/2024/07/17/6696acf994b94.png"
          class="w-5 inline-block mr-2"
        />
        <span> {{ $t('profile.star_piece') }}： {{ profile.star_piece }} </span>
      </div>
      <div class="mt-2 flex items-center">
        <img
          src="https://i.psray.net/i/2024/07/17/6696afa80d3c4.png"
          class="w-5 inline-block mr-2"
        />
        <span> {{ $t('profile.rare_candy') }}： {{ profile.rare_candy }} </span>
      </div>
      <div class="mt-2 flex items-center">
        <img
          src="https://i.psray.net/i/2024/08/02/66ac21691a054.png"
          class="w-5 inline-block mr-2"
        />
        <span>
          {{ $t('profile.philosophers_stone') }}：
          {{ profile.philosophers_stone }}
        </span>
      </div>
      <div class="mt-2 flex items-center">
        <img
          src="https://i.psray.net/i/2024/08/02/66ac244902d7c.png"
          class="w-5 inline-block mr-2"
        />
        <span> {{ $t('profile.mira') }} ： {{ profile.mira }} </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  profile: {
    type: Object,
    required: true,
  },
});
</script>
