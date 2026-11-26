<script setup lang="ts">
/**
 * Layout for developer docs (/docs/api): a slim top bar with the brand, the
 * language switcher and a way back to the site, then the page edge to edge.
 * No site sidebar, settings, account menu or feedback button, so the page's
 * own three columns get the whole window. The site footer stays for its
 * section and language links.
 */
import { House } from 'lucide'

const appConfig = useAppConfig()
</script>

<template>
  <div class="min-h-screen bg-white text-slate-800">
    <header class="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/85 px-3 backdrop-blur-md sm:px-5">
      <div class="flex min-w-0 items-center gap-3 sm:gap-4">
        <AppLink to="/" class="flex shrink-0 items-center gap-2.5">
          <img v-if="appConfig.brand.logo" :src="appConfig.brand.logo" alt="PSRay" class="size-8 object-contain">
          <span class="text-base font-bold tracking-tight text-slate-900">PSRay</span>
        </AppLink>
        <span aria-hidden="true" class="h-5 w-px shrink-0 bg-slate-200" />
        <span class="truncate text-sm font-medium text-slate-600">{{ $t('apiDocs.layout.title') }}</span>
      </div>

      <div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <LanguageSwitcher />
        <AppLink
          to="/"
          :title="$t('apiDocs.layout.backToSite')"
          class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 sm:px-3"
        >
          <LucideIcon :icon="House" class="size-3.5" stroke-width="1.75" />
          <span class="max-sm:sr-only">{{ $t('apiDocs.layout.backToSite') }}</span>
        </AppLink>
      </div>
    </header>

    <main class="pt-14">
      <slot />
      <SiteFooter fluid />
    </main>
  </div>
</template>
