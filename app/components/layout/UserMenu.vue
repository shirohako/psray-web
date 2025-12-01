<template>
  <div>
    <button
      type="button"
      class="flex text-sm rounded-full focus:ring-4 focus:ring-gray-300"
      aria-expanded="false"
      data-dropdown-toggle="dropdown-user"
      @click="toggle"
    >
      <span class="sr-only">Open user menu</span>
      <img class="w-8 h-8 rounded-full" :src="userAvatar" alt="user photo" />
    </button>
    <TieredMenu
      ref="menu"
      :model="items"
      popup
      :pt="{
        root: { style: { 'min-width': '96px' } },
      }"
    >
    </TieredMenu>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const { t } = useI18n();
const userStore = useUserStore();
const { user, authenticated, isAdmin } = storeToRefs(userStore);

const menu = ref();

const userAvatar = computed(() => {
  return authenticated.value
    ? user.value.avatarUrl
    : 'https://i.psray.net/i/2024/06/17/666f7c5d89cdd.jpg';
});

const items = computed(() => {
  if (authenticated.value) {
    const userMenu = [
      {
        label: t('userMenu.profile'),
        command: () => {
          navigateTo({
            name: 'player-profile',
            params: { psnid: user.value.psnid },
          });
        },
      },
      {
        label: t('userMenu.sync'),
        command: () => {
          navigateTo('/sync?psnid=' + user.value.psnid);
        },
      },
      {
        label: t('userMenu.home'),
        command: () => {
          navigateTo('/user/home');
        },
      },
      {
        label: t('userMenu.settings'),
        command: () => {
          navigateTo('/user/setting');
        },
      },
      {
        label: t('userMenu.contributions'),
        command: () => {
          navigateTo(`/laboratory/wiki/changes?uid=${user.value.id}`);
        },
      },
      {
        label: t('userMenu.logout'),
        command: () => {
          userStore.signOut();
        },
      },
    ];
    if (isAdmin.value) {
      userMenu.splice(userMenu.length - 1, 0, {
        label: t('userMenu.admin_panel'),
        command: () => {
          window.open('https://bonfire.psray.net');
        },
      });
    }
    return userMenu;
  } else {
    return [
      {
        label: t('userMenu.login'),
        command: () => {
          navigateTo('/auth/login');
        },
      },
      {
        label: t('userMenu.register'),
        command: () => {
          navigateTo('/auth/signup');
        },
      },
    ];
  }
});

const toggle = event => {
  menu.value.toggle(event);
};
</script>
