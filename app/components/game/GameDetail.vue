<template>
  <div class="p-4 bg-white rounded border shadow-sm">
    <!-- About 标题 -->
    <h2 class="text-xl font-bold mb-2">About</h2>

    <!-- 两列信息网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
      <!-- 左列：平台、发行日期、发行商等 -->
      <div>
        <div class="mb-2">
          <div class="font-semibold text-gray-700">First release date</div>
          <div class="text-gray-800">
            {{ game.first_release_date || '-' }}
          </div>
        </div>

        <div class="mb-2">
          <div class="font-semibold text-gray-700">Publisher</div>
          <div class="text-gray-800">
            <span>{{ game?.publisher || '-' }}</span>
          </div>
        </div>

        <div class="mb-2">
          <div class="font-semibold text-gray-700">Game series</div>
          <div class="text-gray-800">
            <span>{{ game?.series_id || '-' }}</span>
          </div>
        </div>

        <div class="mb-2">
          <div class="font-semibold text-gray-700">Tags</div>
          <div class="text-gray-800">
            {{ '-' }}
          </div>
        </div>
      </div>

      <!-- 右列：类型、开发商、年龄评级等 -->
      <div>
        <div class="mb-2">
          <div class="font-semibold text-gray-700">Genre</div>
          <div class="text-gray-800">
            {{ game.genres || '-' }}
          </div>
        </div>

        <div class="mb-2">
          <div class="font-semibold text-gray-700">Developer</div>
          <div class="text-gray-800">
            {{ game.developer || '-' }}
          </div>
        </div>

        <div class="mb-2">
          <div class="font-semibold text-gray-700">Age rating</div>
          <div class="text-gray-800">
            {{ game.age_rating || '-' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(['game']);
</script>
