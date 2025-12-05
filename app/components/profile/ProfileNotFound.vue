<template>
  <div class="max-w-screen-2xl mx-auto py-4 px-6">
    <div class="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div class="text-center">
        <div class="text-9xl font-bold text-gray-300">404</div>
        <h1 class="text-4xl font-bold text-gray-800 mt-4">
          User Not Found
        </h1>
        <p class="text-lg text-gray-600 mt-4">
          PSN user <span class="font-semibold">{{ psnid }}</span> does not exist or has not been synced yet.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 mt-6">
        <NuxtLink
          to="/"
          class="px-6 py-3 bg-violet-500 text-white rounded-md hover:bg-violet-600 transition-colors text-center"
        >
          Back to Home
        </NuxtLink>
        <NuxtLink
          to="/sync"
          class="px-6 py-3 border-2 border-violet-500 text-violet-500 rounded-md hover:bg-violet-50 transition-colors text-center"
        >
          Sync a New User
        </NuxtLink>
      </div>

      <div class="mt-8 text-center text-sm text-gray-500">
        <p class="font-medium mb-2">Possible reasons:</p>
        <ul class="space-y-1">
          <li>The PSN ID may contain a typo</li>
          <li>This user hasn't been synced to our database yet</li>
          <li>The account may have been deleted</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  psnid: {
    type: String,
    required: true,
  },
});
</script>
