<template>
  <div id="game-list" class="border rounded-md shadow-lg p-8 mt-5">
    <div class="flex items-center mb-6">
      <img
        src="https://i.psray.net/i/2023/09/05/64f745d3732d2.png"
        class="mr-3"
        style="width: 28px"
      />
      <span class="text-lg font-medium">{{ $t('profile.recently_played') }}</span>
    </div>

    <Paginator
      :first="offset"
      :totalRecords="totalRecords"
      :rows="50"
      :rowsPerPageOptions="[50]"
      @page="handlePageChange"
    />

    <RecentlyPlayed :recentlyPlayed="recentlyPlayed" :psnid="psnid" />

    <Paginator
      v-if="totalRecords >= 3"
      :first="offset"
      :totalRecords="totalRecords"
      :rows="50"
      :rowsPerPageOptions="[50]"
      @page="handlePageChangeToTop"
    />
  </div>
</template>

<script setup>
import RecentlyPlayed from './RecentlyPlayed.vue';

const props = defineProps({
  recentlyPlayed: {
    type: Array,
    default: () => [],
  },
  psnid: {
    type: String,
    required: true,
  },
  totalRecords: {
    type: Number,
    required: true,
  },
  offset: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['page-change']);

const handlePageChange = (pageState) => {
  emit('page-change', pageState);
};

const handlePageChangeToTop = (pageState) => {
  document.getElementById('game-list').scrollIntoView({
    behavior: 'smooth',
  });
  handlePageChange(pageState);
};
</script>
