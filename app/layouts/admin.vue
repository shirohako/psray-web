<script setup lang="ts">
import {
  LayoutDashboard,
  ListTodo,
  Clock,
  TriangleAlert,
  FileText,
  Menu,
  ArrowLeft,
} from 'lucide'
const route = useRoute()
const { user } = useAuth()
const open = ref(false)
const groups = [
  {
    label: '工作台',
    items: [{ name: '总览', to: '/admin', icon: LayoutDashboard }],
  },
  {
    label: '运行维护',
    items: [
      { name: '队列', to: '/admin/queues', icon: ListTodo },
      { name: '定时任务', to: '/admin/schedules', icon: Clock },
      { name: '同步异常', to: '/admin/sync-failures', icon: TriangleAlert },
      { name: '错误日志', to: '/admin/logs', icon: FileText },
    ],
  },
]
const current = computed(
  () =>
    groups.flatMap((g) => g.items).find((i) => i.to === route.path)?.name ??
    '管理后台',
)
watch(
  () => route.path,
  () => {
    open.value = false
  },
)
useHead({
  title: 'PSRay 管理后台',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
<template>
  <div
    lang="zh-Hans"
    class="admin-shell min-h-screen bg-slate-50 text-slate-800"
  >
    <button
      v-if="open"
      class="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
      aria-label="关闭导航"
      @click="open = false"
    />
    <aside
      :class="open ? 'translate-x-0' : '-translate-x-full'"
      class="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0"
    >
      <NuxtLink
        to="/admin"
        class="border-b border-slate-100 px-6 py-6 text-xl font-bold tracking-tight"
        >PSRay
        <span
          class="ml-1 rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
          >管理后台</span
        ></NuxtLink
      >
      <nav class="flex-1 space-y-6 overflow-y-auto p-4" aria-label="后台导航">
        <div v-for="group in groups" :key="group.label">
          <p class="mb-2 px-3 text-xs font-semibold text-slate-400">
            {{ group.label }}
          </p>
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            :aria-current="route.path === item.to ? 'page' : undefined"
            :class="
              route.path === item.to
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50'
            "
            class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
            ><LucideIcon :icon="item.icon" class="size-4" />{{
              item.name
            }}</NuxtLink
          >
        </div>
      </nav>
      <NuxtLink
        to="/"
        class="flex items-center gap-2 border-t border-slate-100 p-5 text-sm text-slate-500"
        ><LucideIcon :icon="ArrowLeft" class="size-4" />返回前台</NuxtLink
      >
    </aside>
    <div class="lg:pl-60">
      <header
        class="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8"
      >
        <div class="flex items-center gap-3">
          <button class="lg:hidden" aria-label="打开导航" @click="open = !open">
            <LucideIcon :icon="Menu" class="size-5" /></button
          ><span class="text-sm text-slate-500"
            >管理后台 / <span class="text-slate-900">{{ current }}</span></span
          >
        </div>
        <span class="text-sm">{{ user?.psnid }}</span>
      </header>
      <main class="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-8"><slot /></main>
    </div>
  </div>
</template>
