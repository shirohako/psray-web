<template>
  <div class="max-w-screen-xl p-5 mx-auto">
    <div class="shadow mb-5 rounded-xl">
      <div class="user-profile-header-banner">
        <img
          class="rounded-t-lg"
          src="https://i.psray.net/i/2024/08/21/66c5b2801022d.jpg"
          alt="Banner image"
        />
      </div>
      <div class="flex flex-col md:flex-row pb-5 -mt-12 gap-4 items-center md:items-end">
        <div class="md:pl-6">
          <img :src="user.avatarUrl" class="w-32 border-white border-4 bg-white rounded-lg" />
        </div>
        <div class="md:mt-3 flex flex-col items-center md:items-start justify-end gap-2">
          <h2 class="text-3xl font-semibold leading-10">{{ user.psnid }}</h2>
          <div class="flex text-gray-600 font-medium gap-3 items-center flex-wrap justify-start">
            <div class="flex gap-1.5 items-center">
              <Icon
                :name="'flag:' + user.country.toLowerCase() + '-4x3'"
                class="text-lg rounded-sm"
              />
              <span>{{ user.country }}</span>
            </div>
            <div class="flex gap-1.5 items-center">
              <Icon name="ph:ranking-bold" class="text-xl rounded-sm" />
              <span>PSN {{ user.trophyLevel }} 级</span>
            </div>
            <div class="flex gap-1.5 items-center">
              <Icon name="mdi:calendar-star" class="text-xl rounded-sm" />
              <span> {{ format(fromUnixTime(user.joined_at), 'yyyy-MM-dd') }} 加入 </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="user-home-nav mb-5 flex flex-wrap border rounded-md border-gray-200 px-3 py-3 text-gray-800 gap-2"
    >
      <NuxtLink to="/user/home" exactActiveClass="bg-gray-100 rounded-lg">
        <div class="flex justify-center items-center cursor-pointer px-3 py-1.5 rounded-lg">
          <Icon name="mdi:tooltip-check-outline" class="mr-1 text-xl" />
          <span>{{ $t('dashboard.my_tips.name') }}</span>
        </div>
      </NuxtLink>
      <Divider layout="vertical" class="my-1" />
      <NuxtLink to="/user/home/following" exactActiveClass="bg-gray-100 rounded-lg">
        <div
          class="flex justify-center items-center cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg"
        >
          <Icon name="mdi:account-box-multiple-outline" class="mr-1" />
          <span>{{ $t('dashboard.following_users.name') }}</span>
        </div>
      </NuxtLink>
      <Divider layout="vertical" class="my-1" />
      <NuxtLink to="/user/home/followers" exactActiveClass="bg-gray-100 rounded-lg">
        <div
          class="flex justify-center items-center cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg"
        >
          <Icon name="mdi:account-circle-outline" class="mr-1" />
          <span>{{ $t('dashboard.my_followers.name') }}</span>
        </div>
      </NuxtLink>
      <Divider layout="vertical" class="my-1" />
      <NuxtLink to="/user/home/card" exactActiveClass="bg-gray-100 rounded-lg">
        <div
          class="flex justify-center items-center cursor-pointer hover:bg-gray-100 px-3 py-1.5 rounded-lg"
        >
          <Icon name="mdi:card-account-details-star" class="mr-1" />
          <span>{{ $t('dashboard.profile_card.name') }}</span>
        </div>
      </NuxtLink>
    </div>

    <NuxtPage />
  </div>
</template>

<script setup>
import { format, fromUnixTime } from 'date-fns';

definePageMeta({
  middleware: ['require-auth'],
});

const userStore = useUserStore();
const { user } = storeToRefs(userStore);
</script>
