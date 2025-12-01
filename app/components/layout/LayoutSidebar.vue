<template>
  <aside
    id="logo-sidebar"
    ref="drawerEl"
    class="fixed top-0 left-0 z-40 w-60 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 xl:translate-x-0"
    aria-label="Sidebar"
  >
    <div class="h-full px-3 pb-4 overflow-y-auto bg-white flex flex-col justify-between">
      <ul class="space-y-2 font-medium" ref="sidebarMenu">
        <li>
          <NuxtLink
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
            to="/"
          >
            <Icon name="material-symbols:home-outline-rounded" class="text-2xl" />
            <span class="ms-3">{{ $t('appMenu.home') }}</span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
            :to="{ name: 'leaderboard' }"
          >
            <Icon name="ph:ranking-duotone" class="text-2xl" />
            <span class="flex-1 ms-3 whitespace-nowrap">{{ $t('appMenu.leaderboard') }} </span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
            :to="{ name: 'trophies-overview' }"
          >
            <Icon name="mage:trophy" class="text-2xl" />
            <span class="flex-1 ms-3 whitespace-nowrap">{{ $t('appMenu.trophy_set') }} </span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
            to="/games"
            v-if="authenticated"
          >
            <Icon name="ion:game-controller-outline" class="text-2xl" />
            <span class="flex-1 ms-3 whitespace-nowrap">{{ $t('appMenu.game') }} </span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
            to="/spark"
            v-if="authenticated"
          >
            <Icon name="material-symbols:hotel-class-outline-rounded" class="text-2xl" />
            <span class="flex-1 ms-3 whitespace-nowrap">动态 </span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
            :to="{ name: 'laboratory' }"
          >
            <Icon name="mingcute:pinwheel-2-line" class="text-2xl" />
            <span class="flex-1 ms-3 whitespace-nowrap">{{ $t('appMenu.laboratory') }} </span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="/forum"
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
          >
            <Icon name="ic:outline-question-answer" class="text-2xl" />
            <span class="flex-1 ms-3 whitespace-nowrap">{{ $t('appMenu.forum') }}</span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
            to="/anti-cheating"
          >
            <Icon name="gravity-ui:scales-balanced" class="text-2xl" />
            <span class="flex-1 ms-3 whitespace-nowrap">
              {{ $t('appMenu.anti_cheating') }}
            </span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
            to="/trophies/log"
          >
            <Icon name="material-symbols:update-rounded" class="text-2xl" />
            <span class="flex-1 ms-3 whitespace-nowrap">
              {{ $t('appMenu.public_log') }}
            </span>
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            class="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group"
            :to="{ path: '/about' }"
          >
            <Icon name="iconamoon:certificate-badge" class="text-2xl" />
            <span class="flex-1 ms-3 whitespace-nowrap">
              {{ $t('appMenu.about') }}
            </span>
          </NuxtLink>
        </li>
      </ul>
      <div class="text-gray-400 text-xs">
        <p class="text-center">v{{ gitCommitDate }} - #{{ gitCommitId }}</p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const config = useRuntimeConfig();
const gitCommitId = config.public.gitCommitId;
const gitCommitDate = config.public.gitCommitDate;

const userStore = useUserStore();
const { authenticated } = storeToRefs(userStore);

const drawerEl = ref(null);
const sidebarMenu = ref(null);

let _visible = false;

const emit = defineEmits(['mounted']);

onMounted(() => {
  const links = sidebarMenu.value.querySelectorAll('a');
  links.forEach(menuEl => {
    menuEl.addEventListener('click', hide);
  });
  emit('mounted', { drawerEl, show, hide });
});

function show() {
  const $drawerEl = drawerEl.value;
  if (!_visible) {
    _createBackdrop();
    $drawerEl.classList.add('transform-none');
    $drawerEl.classList.remove('-translate-x-full');

    // set accessibility attributes
    $drawerEl.setAttribute('aria-modal', 'true');
    $drawerEl.setAttribute('role', 'dialog');
    $drawerEl.removeAttribute('aria-hidden');

    _visible = true;
  }
}

function hide() {
  const $drawerEl = drawerEl.value;
  if (_visible) {
    $drawerEl.classList.remove('transform-none');
    $drawerEl.classList.add('-translate-x-full');

    // set accessibility attributes
    $drawerEl.setAttribute('aria-hidden', 'true');
    $drawerEl.removeAttribute('aria-modal');
    $drawerEl.removeAttribute('role');

    _destroyBackdropEl();
    _visible = false;
  }
}

function _createBackdrop() {
  if (!_visible) {
    const backdropEl = document.createElement('div');
    backdropEl.setAttribute('drawer-backdrop', '');
    backdropEl.classList.add(...'bg-gray-900/50 fixed inset-0 z-30'.split(' '));
    document.querySelector('body').append(backdropEl);
    backdropEl.addEventListener('click', () => {
      hide();
    });

    _visible = true;
  }
}

function _destroyBackdropEl() {
  if (_visible && document.querySelector('[drawer-backdrop]') !== null) {
    document.querySelector('[drawer-backdrop]').remove();
  }
}

defineExpose({
  show,
  hide,
  drawerEl,
});
</script>
