<template>
  <div class="max-w-screen-lg mx-auto p-4">
    <div class="my-2 shadow-md w-full px-8 py-8 rounded-2xl border break-all">
      <!-- 导航面包屑 -->
      <div class="mt-3 mb-6 flex flex-col lg:flex-row items-center justify-center">
        <div class="flex flex-col gap-1.5 order-2">
          <h1 class="font-extrabold text-2xl mb-3 text-center">
            {{ $t('forum.title') }}
          </h1>
          <div class="text-center flex flex-col gap-2 lg:text-left">
            <p class="text-lg font-bold">{{ $t('forum.warning_text_1') }}</p>
            <p class="text-lg font-bold">{{ $t('forum.warning_text_2') }}</p>
            <p class="mt-5 text-gray-700">
              {{ $t('forum.text_1') }}
            </p>
            <p class="text-gray-700">{{ $t('forum.text_2') }}</p>
            <p class="text-gray-700">
              {{ $t('forum.text_3') }}
            </p>
            <p class="text-gray-700">{{ $t('forum.text_4') }}</p>
            <div class="relative flex justify-center items-center">
              <NuxtLink to="https://forum.psray.net" target="_blank">
                <button class="relative text-lg group mt-5 cursor-pointer">
                  <span
                    class="relative z-10 block px-5 py-3 overflow-hidden font-medium leading-tight text-gray-800 transition-colors duration-300 ease-out border-2 border-gray-900 rounded-lg group-hover:text-white"
                  >
                    <span
                      class="absolute inset-0 w-full h-full px-5 py-3 rounded-lg bg-gray-50"
                    ></span>
                    <span
                      class="absolute left-0 w-48 h-48 -ml-2 transition-all duration-300 origin-top-right -rotate-90 -translate-x-full translate-y-12 bg-gray-900 group-hover:-rotate-180 ease"
                    ></span>
                    <span class="relative">{{ $t('forum.button') }}</span>
                  </span>
                  <span
                    class="absolute bottom-0 right-0 w-full h-12 -mb-1 -mr-1 transition-all duration-200 ease-linear bg-gray-900 rounded-lg group-hover:mb-0 group-hover:mr-0"
                    data-rounded="rounded-lg"
                  ></span>
                </button>
              </NuxtLink>
            </div>
          </div>
        </div>
        <img
          src="https://i.psray.net/i/2024/08/27/66cd8572e5f1f.jpeg"
          class="w-96 order-1 lg:order-3"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
useSeoMeta({
  title: '关于 PSRay 游戏社区',
  description: '在云端遥望 星光流动的夜里 繁星承载祈愿',
});
</script>

<style lang="postcss" scoped>
table td {
  @apply px-5 py-2;
}
.moderator span {
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  position: relative;
}

.c-purple {
  background: -webkit-linear-gradient(-45deg, #a32cc4, #b65fcf 60%, #e39ff6);
  background: linear-gradient(135deg, #a32cc4, #b65fcf 60%, #e39ff6);
}

.c-blue {
  background: -webkit-linear-gradient(-45deg, #6270ee, #2b90d9 60%, #37dede);
  background: linear-gradient(135deg, #6270ee, #2b90d9 60%, #37dede);
}

.blink {
  background-color: transparent;
  -webkit-animation: blinker 1.5s linear infinite;
  animation: blinker 1.5s linear infinite;
}

@-webkit-keyframes blinker {
  50% {
    opacity: 0;
  }
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>
