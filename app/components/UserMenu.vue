<script setup lang="ts">
import { ChevronRight, LayoutDashboard, LogOut, MessageSquareText, RefreshCw, Settings, User, Users, type IconNode } from 'lucide'

/**
 * The signed-in user's menu in the top bar: a dropdown under their name from
 * `sm` up, and on phones the avatar opens it as a side panel with large rows.
 * Render it only while someone is signed in.
 */
const route = useRoute()
const { user, logout, hasRole } = useAuth()

// Phones: the menu as a side panel; it closes when the page changes.
const panelOpen = ref(false)
watch(() => route.fullPath, () => { panelOpen.value = false })

const profilePath = computed(() => user.value?.psnid ? `/p/${encodeURIComponent(user.value.psnid)}` : '/')

type UserMenuGroup = {
  /** Message key of the group heading. */
  labelKey: string
  items: { labelKey: string; to: string | { path: string; query: Record<string, string | undefined> }; icon: IconNode }[]
}

// The menu, by group. Add an entry here for a new page; add a group when
// several new pages belong together.
const groups = computed<UserMenuGroup[]>(() => [
  {
    labelKey: 'nav.user.groups.me',
    items: [
      { labelKey: 'nav.user.profile', to: profilePath.value, icon: User },
      { labelKey: 'nav.user.following', to: '/me/following', icon: Users },
      { labelKey: 'nav.user.tips', to: '/me/tips', icon: MessageSquareText },
    ],
  },
  {
    labelKey: 'nav.user.groups.account',
    items: [
      { labelKey: 'nav.user.sync', to: { path: '/sync', query: { psnid: user.value?.psnid } }, icon: RefreshCw },
      { labelKey: 'nav.user.settings', to: '/settings', icon: Settings },
    ],
  },
  ...(hasRole('admin')
    ? [{ labelKey: 'nav.user.groups.admin', items: [{ labelKey: 'nav.user.admin', to: '/admin', icon: LayoutDashboard }] }]
    : []),
])

/** Whether a menu entry points at the page being shown. */
function isCurrentPage(to: string | { path: string }) {
  return route.path === (typeof to === 'string' ? to : to.path)
}

async function onLogout() {
  await logout()
  await navigateTo('/')
}
</script>

<template>
  <template v-if="user">
    <!-- Phones: the avatar opens the account panel instead of a dropdown -->
    <button
      type="button"
      class="grid size-10 shrink-0 place-items-center rounded-full transition hover:bg-slate-100 sm:hidden"
      :aria-label="$t('nav.user.menu')"
      :aria-expanded="panelOpen"
      @click="panelOpen = true"
    >
      <UserAvatar :psnid="user.psnid" :src="user.avatar_url" class="size-8 ring-2 ring-white" />
    </button>

    <DropdownMenu
      align="right"
      panel-class="w-56"
      class="hidden min-w-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 sm:flex"
    >
      <UserAvatar :psnid="user.psnid" :src="user.avatar_url" class="size-8" />
      <span class="max-w-32 truncate">{{ user.psnid }}</span>

      <template #menu="{ close }">
        <!-- Who is signed in -->
        <div class="flex items-center gap-2.5 border-b border-slate-100 px-3 pb-2 pt-1">
          <UserAvatar :psnid="user.psnid" :src="user.avatar_url" class="size-8" />
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-slate-900">{{ user.psnid }}</p>
            <p class="text-xs tabular-nums text-slate-400">Lv {{ user.trophy_level }}</p>
          </div>
        </div>

        <div
          v-for="group in groups"
          :key="group.labelKey"
          role="group"
          :aria-label="$t(group.labelKey)"
          class="border-b border-slate-100 py-1"
        >
          <p class="px-3 pb-0.5 pt-1 text-[11px] font-semibold text-slate-400">{{ $t(group.labelKey) }}</p>
          <NuxtLink
            v-for="item in group.items"
            :key="item.labelKey"
            :to="item.to"
            class="flex items-center gap-2.5 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            @click="close"
          >
            <LucideIcon :icon="item.icon" class="size-4 text-slate-400" />
            {{ $t(item.labelKey) }}
          </NuxtLink>
        </div>

        <div class="pt-1">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            @click="close(); onLogout()"
          >
            <LucideIcon :icon="LogOut" class="size-4 text-slate-400" />
            {{ $t('nav.user.logout') }}
          </button>
        </div>
      </template>
    </DropdownMenu>

    <!-- Phones: the menu as a side panel with large rows -->
    <Drawer v-model:open="panelOpen" side="right" size="xs">
      <template #title>
        <span class="flex min-w-0 items-center gap-3">
          <UserAvatar :psnid="user.psnid" :src="user.avatar_url" class="size-10" />
          <span class="min-w-0">
            <span class="block truncate text-base font-semibold text-slate-900">{{ user.psnid }}</span>
            <span class="block text-xs font-medium tabular-nums text-slate-400">Lv {{ user.trophy_level }}</span>
          </span>
        </span>
      </template>

      <nav class="space-y-5 bg-slate-50/70 px-4 py-5" :aria-label="$t('nav.user.menu')">
        <section v-for="group in groups" :key="group.labelKey">
          <h3 class="px-1 pb-2 text-[11px] font-semibold tracking-wide text-slate-400">{{ $t(group.labelKey) }}</h3>
          <div class="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <NuxtLink
              v-for="item in group.items"
              :key="item.labelKey"
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition active:bg-slate-100"
              :class="isCurrentPage(item.to) ? 'bg-slate-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'"
              :aria-current="isCurrentPage(item.to) ? 'page' : undefined"
              @click="panelOpen = false"
            >
              <span
                class="grid size-8 shrink-0 place-items-center rounded-lg"
                :class="isCurrentPage(item.to) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'"
              >
                <LucideIcon :icon="item.icon" class="size-4" />
              </span>
              <span class="min-w-0 flex-1 truncate">{{ $t(item.labelKey) }}</span>
              <LucideIcon :icon="ChevronRight" class="size-4 shrink-0 text-slate-300" />
            </NuxtLink>
          </div>
        </section>
      </nav>

      <template #footer>
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 active:bg-rose-100"
          @click="panelOpen = false; onLogout()"
        >
          <LucideIcon :icon="LogOut" class="size-4" />
          {{ $t('nav.user.logout') }}
        </button>
      </template>
    </Drawer>
  </template>
</template>
