<script setup lang="ts">
import { ChevronRight } from 'lucide'

const { t } = useI18n()

useSeo({
  title: () => t('seo.tierlist.title'),
  description: () => t('seo.tierlist.description'),
})
</script>

<template>
  <div class="space-y-4">
    <nav :aria-label="$t('common.breadcrumb')" class="flex min-w-0 items-center gap-1.5 text-xs text-slate-400">
      <AppLink to="/tools" class="shrink-0 transition hover:text-slate-900">{{ $t('tools.title') }}</AppLink>
      <LucideIcon :icon="ChevronRight" class="size-3 shrink-0" />
      <span class="truncate text-slate-600" aria-current="page">{{ $t('tierlist.title') }}</span>
    </nav>

    <!-- Lists and images live in this browser only, so the editor renders on the client. -->
    <ClientOnly>
      <TierlistEditor />
      <template #fallback>
        <TierlistSkeleton />
      </template>
    </ClientOnly>
  </div>
</template>
