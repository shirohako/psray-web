<template>
  <div class="mt-2 pt-4 border-t">
    <div class="flex flex-col">
      <div class="font-semibold text-lg">
        <img
          src="https://i.psray.net/i/2024/05/24/664fa33d373ac.png"
          class="w-7 inline-block mr-2"
        />
        <span>{{ $t('profile.next_auto_update_time') }}</span>
      </div>
      <div class="mt-2 flex items-center">
        {{ syncNext }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  syncNext: {
    type: String,
    required: true,
  },
});
</script>
