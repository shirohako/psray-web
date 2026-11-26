<script setup lang="ts">
import { User, ShieldCheck, Bell, Database, type IconNode } from 'lucide'

definePageMeta({ auth: true })

const route = useRoute()
const { t } = useI18n()

useSeo({
  title: () => t('seo.settings.title'),
  // Account-scoped and behind auth — nothing to index.
  noindex: true,
})

type NavItem = { to: string, labelKey: string, icon: IconNode }

// Group registry — add a new settings group by adding an entry here plus a
// matching child page under `app/pages/settings/`.
const nav: NavItem[] = [
  { to: '/settings/profile', labelKey: 'settings.nav.profile', icon: User },
  { to: '/settings/security', labelKey: 'settings.nav.security', icon: ShieldCheck },
  { to: '/settings/notifications', labelKey: 'settings.nav.notifications', icon: Bell },
  { to: '/settings/data', labelKey: 'settings.nav.data', icon: Database },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <header>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">{{ $t('settings.heading') }}</h1>
        <p class="mt-1.5 text-sm text-slate-500">{{ $t('settings.subheading') }}</p>
      </header>

      <!-- Tabs under the title at every width; they scroll sideways when the labels don't fit.
           The baseline is an inset shadow, so the active underline paints over it without
           overflowing the scroll box. -->
      <nav class="flex gap-6 overflow-x-auto shadow-[inset_0_-1px_0_var(--color-slate-200)]">
        <AppLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          class="group relative inline-flex shrink-0 items-center gap-2 px-1 pb-3 pt-1 text-sm transition-colors"
          :class="isActive(item.to)
            ? 'font-semibold text-slate-900'
            : 'font-medium text-slate-500 hover:text-slate-900'"
        >
          <LucideIcon
            :icon="item.icon"
            class="size-4 shrink-0 transition-colors"
            :class="isActive(item.to) ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'"
          />
          {{ $t(item.labelKey) }}
          <span
            aria-hidden="true"
            class="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-slate-900 transition duration-200 motion-reduce:transition-none"
            :class="isActive(item.to) ? 'scale-x-100 opacity-100' : 'scale-x-50 opacity-0'"
          />
        </AppLink>
      </nav>
    </div>

    <div class="min-w-0">
      <NuxtPage />
    </div>
  </div>
</template>
