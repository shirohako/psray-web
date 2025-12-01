<template>
  <div class="mt-8">
    <div class="flex items-center mb-6">
      <img
        src="https://i.psray.net/i/2024/07/26/66a331c7d8653.png"
        class="mr-3"
        style="width: 28px"
      />
      <span class="text-lg font-medium">
        {{ $t('trophies.contribute.title') }}
      </span>
    </div>
    <div>
      <!-- 提示奖励 -->
      <div class="flex items-center justify-center gap-3 mb-5">
        <img src="https://i.psray.net/i/2024/07/26/66a3384525200.png" class="w-8 h-8" />
        <div>
          <p>{{ $t('trophies.contribute.text_1') }}</p>
        </div>
      </div>

      <!-- 可以做的事情 -->
      <div class="flex items-center gap-1">
        <Icon name="material-symbols:editor-choice-outline" class="text-blue-500 text-2xl" />
        <span class="leading-8">{{ $t('trophies.contribute.text_2') }}</span>
      </div>
      <ul class="ml-3 mt-2">
        <li class="flex items-center">
          <Icon
            name="lets-icons:done-ring-round-duotone-line"
            class="text-blue-600 mr-2 shrink-0"
          />{{ $t('trophies.contribute.can_do_1') }}
        </li>
        <li class="flex items-center">
          <Icon
            name="lets-icons:done-ring-round-duotone-line"
            class="text-purple-600 mr-2 shrink-0"
          />{{ $t('trophies.contribute.can_do_2') }}
        </li>
      </ul>
      <div class="flex justify-center mt-3">
        <NuxtLink :to="`/laboratory/contributions/trophies/${route.params.id}`" rel="nofollow">
          <button
            class="bg-blue-400 text-white px-3 py-1 rounded-md flex items-center gap-1 mx-auto"
          >
            <Icon name="material-symbols:edit" />
            <span>{{ $t('trophies.contribute.editing_button') }}</span>
          </button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
</script>
