<script setup lang="ts">
import {
  LayoutDashboard,
  ListTodo,
  Clock,
  TriangleAlert,
  FileText,
  Menu,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  X,
} from 'lucide'
import { adminDate } from '~/utils/admin'
const route = useRoute()
const { user } = useAuth()
const open = ref(false)
// Desktop rail state, restored on mount so the first client render matches.
const collapsed = ref(false)
const now = ref(new Date())
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  try {
    collapsed.value = localStorage.getItem('admin:sidebar') === 'rail'
  } catch {}
  clock = setInterval(() => (now.value = new Date()), 1000)
})
onBeforeUnmount(() => clearInterval(clock))
watch(collapsed, (v) => {
  try {
    localStorage.setItem('admin:sidebar', v ? 'rail' : 'full')
  } catch {}
})
const groups = [
  {
    label: '工作台',
    items: [{ name: '运行总览', to: '/admin', icon: LayoutDashboard }],
  },
  {
    label: '运行维护',
    items: [
      { name: '队列监控', to: '/admin/queues', icon: ListTodo },
      { name: '定时任务', to: '/admin/schedules', icon: Clock },
      { name: '同步异常', to: '/admin/sync-failures', icon: TriangleAlert },
      { name: '错误日志', to: '/admin/logs', icon: FileText },
    ],
  },
]
const current = computed(() => {
  for (const group of groups) {
    const item = group.items.find((i) => i.to === route.path)
    if (item) return { group: group.label, name: item.name }
  }
  return { group: '工作台', name: '管理后台' }
})
const time = computed(() => adminDate(now.value).slice(11))
// Shown on hover so the admin knows which zone every timestamp is in.
const zone = import.meta.client
  ? Intl.DateTimeFormat().resolvedOptions().timeZone
  : ''
watch(
  () => route.path,
  () => {
    open.value = false
    // On desktop the sheet, not the window, scrolls.
    document.getElementById('admin-sheet')?.scrollTo({ top: 0 })
  },
)
useHead({
  title: 'PSRay 管理后台',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
<template>
  <div lang="zh-Hans" class="min-h-screen bg-slate-100 text-slate-800">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <button
        v-if="open"
        class="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        aria-label="关闭导航"
        @click="open = false"
      />
    </Transition>
    <!-- Floating dark card, inset from the viewport edges on every side. -->
    <aside
      :class="[
        open ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]',
        collapsed ? 'lg:w-18' : 'lg:w-60',
      ]"
      class="fixed inset-y-3 left-3 z-50 flex w-60 flex-col overflow-hidden rounded-[18px] bg-linear-to-b from-slate-900 to-slate-950 text-slate-400 shadow-[0_18px_40px_-18px_rgb(2_6_23/0.6),inset_0_1px_0_rgb(255_255_255/0.06)] transition-[transform,width] duration-200 ease-out lg:translate-x-0"
    >
      <div class="flex h-16 shrink-0 items-center gap-3 px-4">
        <NuxtLink
          to="/admin"
          class="flex min-w-0 items-center gap-3"
          :title="collapsed ? 'PSRay 管理后台' : undefined"
        >
          <span
            class="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-white to-slate-300 text-slate-950"
          >
            <LucideIcon :icon="ShieldCheck" class="size-5" />
          </span>
          <span
            :class="collapsed ? 'lg:hidden' : ''"
            class="min-w-0 leading-tight"
          >
            <span class="block text-[15px] font-bold tracking-tight text-white"
              >PSRay</span
            >
            <span class="block text-xs text-slate-500">管理后台</span>
          </span>
        </NuxtLink>
        <button
          class="ml-auto grid size-8 place-items-center rounded-full text-slate-500 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="关闭导航"
          @click="open = false"
        >
          <LucideIcon :icon="X" class="size-4" />
        </button>
      </div>
      <nav
        class="flex-1 space-y-6 overflow-y-auto px-3 py-3"
        aria-label="后台导航"
      >
        <div v-for="group in groups" :key="group.label">
          <p
            :class="collapsed ? 'lg:invisible' : ''"
            class="mb-2 px-3 text-[11px] font-semibold tracking-wider text-slate-600"
          >
            {{ group.label }}
          </p>
          <div class="space-y-1">
            <NuxtLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              :title="collapsed ? item.name : undefined"
              :aria-current="route.path === item.to ? 'page' : undefined"
              :class="[
                route.path === item.to
                  ? 'bg-white text-slate-950 shadow-[0_6px_18px_-6px_rgb(255_255_255/0.45)]'
                  : 'hover:bg-white/5 hover:text-white',
                collapsed ? 'lg:justify-center lg:px-0' : '',
              ]"
              class="flex h-10 items-center gap-3 rounded-full px-3.5 text-sm font-medium transition"
            >
              <LucideIcon :icon="item.icon" class="size-4.5 shrink-0" />
              <span :class="collapsed ? 'lg:hidden' : ''">{{ item.name }}</span>
            </NuxtLink>
          </div>
        </div>
      </nav>
      <div class="space-y-1 p-3">
        <NuxtLink
          to="/"
          :title="collapsed ? '返回前台' : undefined"
          :class="collapsed ? 'lg:justify-center lg:px-0' : ''"
          class="flex h-10 items-center gap-3 rounded-full px-3.5 text-sm font-medium transition hover:bg-white/5 hover:text-white"
        >
          <LucideIcon :icon="ArrowLeft" class="size-4.5 shrink-0" />
          <span :class="collapsed ? 'lg:hidden' : ''">返回前台</span>
        </NuxtLink>
        <button
          class="hidden h-10 w-full items-center gap-3 rounded-full px-3.5 text-sm font-medium transition hover:bg-white/5 hover:text-white lg:flex"
          :class="collapsed ? 'justify-center px-0' : ''"
          :aria-label="collapsed ? '展开侧栏' : '收起侧栏'"
          :title="collapsed ? '展开侧栏' : undefined"
          @click="collapsed = !collapsed"
        >
          <LucideIcon
            :icon="collapsed ? PanelLeftOpen : PanelLeftClose"
            class="size-4.5 shrink-0"
          />
          <span v-if="!collapsed">收起侧栏</span>
        </button>
        <div
          v-if="user"
          :class="collapsed ? 'lg:justify-center lg:bg-transparent lg:p-0' : ''"
          class="mt-2 flex items-center gap-2.5 rounded-xl bg-white/4 p-2"
          :title="collapsed ? user.psnid : undefined"
        >
          <img
            v-if="user.avatar_url"
            :src="user.avatar_url"
            :alt="user.psnid"
            class="size-8 shrink-0 rounded-full bg-slate-700 object-cover"
          />
          <span
            v-else
            class="grid size-8 shrink-0 place-items-center rounded-full bg-slate-700 text-xs font-bold text-white"
            >{{ user.psnid.slice(0, 1).toUpperCase() }}</span
          >
          <span
            :class="collapsed ? 'lg:hidden' : ''"
            class="min-w-0 leading-tight"
          >
            <span
              class="block truncate text-[13px] font-medium text-slate-200"
              >{{ user.psnid }}</span
            >
            <span class="block text-[11px] text-slate-500">管理员</span>
          </span>
        </div>
      </div>
    </aside>
    <div
      :class="collapsed ? 'lg:pl-24' : 'lg:pl-66'"
      class="transition-[padding] duration-200 ease-out lg:h-screen lg:py-3 lg:pr-3"
    >
      <div
        id="admin-sheet"
        class="min-h-screen bg-white lg:h-full lg:min-h-0 lg:overflow-y-auto lg:rounded-2xl lg:shadow-[0_1px_2px_rgb(15_23_42/0.06)] lg:ring-1 lg:ring-slate-200/70"
      >
        <header
          class="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6"
        >
          <div class="flex min-w-0 items-center gap-3">
            <button
              class="-ml-1 grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="打开导航"
              @click="open = true"
            >
              <LucideIcon :icon="Menu" class="size-5" />
            </button>
            <nav
              class="flex min-w-0 items-center gap-1.5 text-[13px]"
              aria-label="当前位置"
            >
              <span class="hidden text-slate-400 sm:inline">{{
                current.group
              }}</span>
              <span class="hidden text-slate-300 sm:inline">/</span>
              <span class="truncate font-medium text-slate-900">{{
                current.name
              }}</span>
            </nav>
          </div>
          <span
            class="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-slate-500"
            :title="`后台时间均按浏览器时区显示（${zone}）`"
          >
            <LucideIcon :icon="Clock" class="size-3.5 text-slate-400" />{{
              time
            }}
          </span>
        </header>
        <main class="mx-auto max-w-360 space-y-6 p-4 sm:p-6 lg:p-8">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
