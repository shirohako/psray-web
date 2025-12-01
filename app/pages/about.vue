<template>
  <div class="max-w-screen-lg mx-auto p-4">
    <div class="my-2 shadow-md w-full px-8 py-8 rounded-2xl border break-all">
      <!-- 标题横幅 -->
      <div class="mt-3 mb-6 flex flex-col lg:flex-row items-center justify-center">
        <div class="flex flex-col gap-1.5 order-2">
          <h1 class="font-extrabold text-2xl mb-3 text-center">
            {{ $t('about.title') }}
          </h1>
          <div class="text-center flex flex-col gap-2 lg:text-left">
            <p class="text-lg font-bold">
              {{ $t('about.heading') }}
            </p>
            <p class="text-gray-700">
              {{ $t('about.description_1') }}
            </p>
            <p class="text-gray-700">
              {{ $t('about.description_2') }}
            </p>
            <p class="text-gray-700">
              {{ $t('about.description_3') }}
            </p>
          </div>
        </div>
        <img
          src="https://i.psray.net/i/2024/08/27/66cd8572e5f1f.jpeg"
          class="w-96 order-1 lg:order-3"
        />
      </div>

      <!-- 法律与隐私入口 -->
      <div class="my-6" id="legal">
        <div class="font-medium text-lg mb-4">
          <span class="relative inline-flex align-middle h-3 w-3 mr-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h2 class="inline-block align-middle">{{ $t('legal.title') }}</h2>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            to="/policies/privacy"
            class="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <div class="flex items-start gap-4">
              <div
                class="flex items-center justify-center rounded-lg bg-emerald-50 p-3 text-emerald-600 group-hover:bg-emerald-100"
              >
                <Icon name="mdi:shield-lock" class="text-2xl" />
              </div>
              <div class="flex-1">
                <h3 class="text-base font-semibold">{{ $t('legal.privacy') }}</h3>
                <p class="mt-1 text-sm text-gray-600">{{ $t('legal.privacy_desc') }}</p>
              </div>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/policies/terms"
            class="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-indigo-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <div class="flex items-start gap-4">
              <div
                class="flex items-center justify-center rounded-lg bg-indigo-50 p-3 text-indigo-600 group-hover:bg-indigo-100"
              >
                <Icon name="mdi:scale-balance" class="text-2xl" />
              </div>
              <div class="flex-1">
                <h3 class="text-base font-semibold">{{ $t('legal.terms') }}</h3>
                <p class="mt-1 text-sm text-gray-600">{{ $t('legal.terms_desc') }}</p>
              </div>
            </div>
          </NuxtLink>

          <NuxtLink
            to="/policies/delete-data"
            class="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <div class="flex items-start gap-4">
              <div
                class="flex items-center justify-center rounded-lg bg-rose-50 p-3 text-rose-600 group-hover:bg-rose-100"
              >
                <Icon name="mdi:trash-can-outline" class="text-2xl" />
              </div>
              <div class="flex-1">
                <h3 class="text-base font-semibold">{{ $t('legal.delete') }}</h3>
                <p class="mt-1 text-sm text-gray-600">{{ $t('legal.delete_desc') }}</p>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- 官方聊天群组 -->
      <div class="mb-6" id="official-chat">
        <div class="font-medium text-lg mb-4">
          <span class="relative inline-flex align-middle h-3 w-3 mr-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-rose-400"></span>
          </span>
          <h2 class="inline-block align-middle">
            {{ $t('about.chat_groups') }}
          </h2>
        </div>
        <div class="pl-4 flex flex-col gap-2.5">
          <div class="flex items-center gap-3">
            <div class="bg-blue-100 p-2 rounded-full flex items-center">
              <Icon name="gravity-ui:logo-telegram" class="text-blue-500" />
            </div>
            <p>Telegram Channel: https://t.me/psraynet</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="bg-green-100 p-2 rounded-full flex items-center">
              <Icon name="gravity-ui:logo-telegram" class="text-green-500" />
            </div>
            <p>Telegram Group: https://t.me/psraychat</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="bg-orange-100 p-2 rounded-full flex items-center">
              <Icon name="ri:qq-line" class="text-orange-500"></Icon>
            </div>
            <p>QQ Group: 664366349</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="bg-indigo-100 p-2 rounded-full flex items-center">
              <Icon name="hugeicons:discord" class="text-indigo-500"></Icon>
            </div>
            <p>Discord: Coming Soon..</p>
          </div>
        </div>
      </div>

      <!-- 社区管理员 -->
      <div class="mb-6" id="moderator">
        <div class="font-medium text-lg mb-4">
          <span class="relative inline-flex align-middle h-3 w-3 mr-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-200 opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
          </span>
          <h2 class="inline-block align-middle">{{ $t('about.teams') }}</h2>
        </div>
        <div class="pl-3 flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <h3 class="moderator text-lg font-semibold">
              <span class="c-purple"> {{ $t('about.programming') }}</span>
              <mark class="blink">_</mark>
            </h3>
            <ul class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <li class="flex items-center gap-2">
                <img
                  src="https://i.abyss.moe/images/2024/08/28/71aa4e95dd6d5f24d130aa4636720c7e.jpg"
                  class="w-8 h-8 rounded-full"
                />
                <span>abyssmoe</span>
              </li>
            </ul>
          </div>
          <div class="flex flex-col gap-1 max-w-2xl">
            <h3 class="moderator leading-8 text-lg font-semibold">
              <span class="c-blue">{{ $t('about.moderators') }}</span>
              <mark class="blink">_</mark>
            </h3>
            <ul class="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <li class="flex items-center gap-2">
                <img
                  src="https://i.abyss.moe/images/2024/08/29/9bb6b53cfb5225f08a49a2081cd01c16.png"
                  class="w-8 h-8 rounded-full"
                />
                <span>ChenZheCHN</span>
              </li>
              <li class="flex items-center gap-2">
                <img
                  src="https://i.abyss.moe/images/2024/08/28/e538b6f1a4d441811f85896831515043.jpg"
                  class="w-8 h-8 rounded-full"
                />
                <span>HIBIKI_MOE</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 开源项目 -->
      <div class="my-6" id="open-source-project">
        <div class="font-medium text-lg mb-4">
          <span class="relative inline-flex align-middle h-3 w-3 mr-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-purple-700"></span>
          </span>
          <h2 class="inline-block align-middle">
            {{ $t('about.special_thanks') }}
          </h2>
        </div>
        <div class="pl-4">
          <h3 class="my-2">
            achievements-app / psn-api (https://github.com/achievements-app/psn-api)
          </h3>
          <h3 class="my-2">
            andshrew / PlayStation-Trophies (https://github.com/andshrew/PlayStation-Trophies)
          </h3>
          <h3 class="my-2">Tustin / psn-php (https://github.com/Tustin/psn-php)</h3>
        </div>
      </div>

      <!-- 图标版权 -->
      <div class="mb-3" id="icon-license">
        <div class="font-medium text-lg mb-4">
          <span class="relative inline-flex align-middle h-3 w-3 mr-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"
            ></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
          </span>
          <h2 class="inline-block align-middle">
            {{ $t('about.icon_license') }}
          </h2>
        </div>
        <div class="pl-4">
          <p href="https://www.flaticon.com/free-icons/">
            Icons created by Flaticon (https://www.flaticon.com/)
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
useSeoMeta({
  title: '关于 PSRay 游戏社区',
  description: '在云端遥望 星光流动的夜里 繁星承载祈愿',
});

definePageMeta({
  breadcrumb: ['Home', 'About'],
});

const route = useRoute();
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
