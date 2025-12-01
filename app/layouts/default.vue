<template>
  <div>
    <!-- 顶部菜单 -->
    <LayoutHeader @toggle-mobile="toggleMobile" @toggle-desktop="toggleDesktop" />

    <!-- 左侧导航栏 -->
    <LayoutSidebar ref="sidebar" @mounted="onSidebarMounted" />

    <!-- 网站主内容 -->
    <div class="app-container mt-16 xl:ml-60" ref="appContainer">
      <slot></slot>
    </div>

    <Toast />

    <!-- 右下角的悬浮按钮 -->
    <FloatingActions />

    <!-- Cookie consent banner -->
    <CookieConsent />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import FloatingActions from '~/components/layout/FloatingActions.vue';

const userStore = useUserStore();
const { authenticated } = storeToRefs(userStore);

const sidebar = ref(null);
const appContainer = ref(null);
let _visible_desktop = false;
let sidebarMethods = null;

// 刷新用户信息
if (authenticated.value) {
  userStore.refreshUserInfo();
}

// 侧边栏挂载后的回调
function onSidebarMounted({ drawerEl, show, hide }) {
  sidebarMethods = { drawerEl, show, hide };
}

// 移动端切换侧边栏
function toggleMobile() {
  if (sidebarMethods) {
    const isVisible = !sidebarMethods.drawerEl.value.classList.contains('-translate-x-full');
    if (isVisible) {
      sidebarMethods.hide();
    } else {
      sidebarMethods.show();
    }
  }
}

// 桌面端切换侧边栏
function toggleDesktop() {
  if (sidebarMethods) {
    const $drawerEl = sidebarMethods.drawerEl.value;
    const $appContainer = appContainer.value;
    if (_visible_desktop) {
      $drawerEl.style = 'transform: translateX(0)';
      $appContainer.style = 'margin-left:240px';
    } else {
      $drawerEl.style = 'transform: translateX(-240px)';
      $appContainer.style = 'margin-left:0';
    }
    _visible_desktop = !_visible_desktop;
  }
}
</script>
