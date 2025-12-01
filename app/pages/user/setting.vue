<template>
  <div class="max-w-screen-xl p-5 mx-auto">
    <div class="w-full mx-auto flex flex-col justify-center border rounded-md shadow-lg p-8">
      <div class="flex items-center mb-6 ml-1 font-bold text-2xl">
        <Icon name="ion:md-settings" class="mr-1" />
        <h2>{{ $t('setting.name') }}</h2>
      </div>

      <div
        class="user-home-nav mb-5 flex flex-wrap border rounded-md border-gray-200 px-3 py-3 text-gray-800 gap-2"
      >
        <NuxtLink to="/user/setting" exactActiveClass="bg-gray-100 rounded-lg">
          <div class="flex justify-center items-center cursor-pointer px-3 py-1.5 rounded-lg">
            <Icon name="material-symbols:account-circle" class="mr-1 text-xl" />
            <span>{{ $t('setting.profile.name') }}</span>
          </div>
        </NuxtLink>
        <Divider layout="vertical" class="my-1" />
        <NuxtLink to="/user/setting/security" exactActiveClass="bg-gray-100 rounded-lg">
          <div
            class="flex justify-center items-center cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg"
          >
            <Icon name="material-symbols:lock" class="mr-1" />
            <span>{{ $t('setting.password.name') }}</span>
          </div>
        </NuxtLink>
        <Divider layout="vertical" class="my-1" />
        <NuxtLink to="/user/setting/avatar" exactActiveClass="bg-gray-100 rounded-lg">
          <div
            class="flex justify-center items-center cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg"
          >
            <Icon name="material-symbols:account-box-outline" class="mr-1" />
            <span> 自定义头像</span>
          </div>
        </NuxtLink>
      </div>

      <NuxtPage />
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['require-auth'],
});
</script>
