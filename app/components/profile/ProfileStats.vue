<template>
  <div class="mt-5">
    <div class="flex justify-between items-center">
      <span>{{ $t('profile.registered') }}</span>
      <Icon name="mdi:check-decagram" :class="{ 'text-green-500': profile.joined_at }" />
    </div>
    <div class="flex justify-between items-center">
      <span>{{ $t('profile.page_view') }}</span>
      <span>{{ profile.page_view }}</span>
    </div>
    <div class="flex justify-between items-center">
      <span>{{ $t('profile.following') }}</span>
      <span>{{ profile.following }}</span>
    </div>
    <div class="flex justify-between items-center">
      <span>{{ $t('profile.followers') }}</span>
      <span>{{ profile.followers }}</span>
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
