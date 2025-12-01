<template>
  <nav
    class="fixed top-0 z-50 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
  >
    <div class="px-3 py-3 lg:px-5 lg:pl-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center justify-start rtl:justify-end">
          <!-- 小屏幕时打开菜单栏按钮 -->
          <button
            data-drawer-target="logo-sidebar"
            data-drawer-toggle="logo-sidebar"
            aria-controls="logo-sidebar"
            type="button"
            class="inline-flex items-center xl:hidden p-2 text-sm text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
            @click="$emit('toggle-mobile')"
          >
            <span class="sr-only">Open sidebar</span>
            <Icon name="fluent:list-24-filled" class="text-2xl" />
          </button>
          <!-- 大屏幕时打开菜单栏按钮 -->
          <button
            data-drawer-target="logo-sidebar"
            data-drawer-toggle="logo-sidebar"
            aria-controls="logo-sidebar"
            type="button"
            class="xl:inline-flex items-center hidden sm:visible p-2 text-sm text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
            @click="$emit('toggle-desktop')"
          >
            <span class="sr-only">Open sidebar</span>
            <Icon name="fluent:list-24-filled" class="text-2xl" />
          </button>
          <!-- Logo -->
          <a href="/" class="flex ms-2 md:me-24">
            <img
              src="https://i.psray.net/i/2024/05/21/664b74c30dea5.png"
              class="h-8 me-3"
              alt="PSRay Logo"
            />
            <span
              class="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white"
            >
              PSRay
            </span>
          </a>
        </div>
        <div class="flex items-center">
          <div class="flex items-center ms-3">
            <LanguageMenu />
            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import LanguageMenu from './LanguageMenu.vue';
import UserMenu from './UserMenu.vue';

defineEmits(['toggle-mobile', 'toggle-desktop']);
</script>
