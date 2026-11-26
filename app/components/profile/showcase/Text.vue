<script setup lang="ts">
import { FileText } from 'lucide'
import type { ShowcaseText } from '~/services/profile'

/**
 * Showcase: free text the owner wrote, under their own title (a default one
 * when they left it empty), rendered from Markdown the way trophy comments
 * are. Raw HTML isn't rendered.
 */
defineProps<{ text: ShowcaseText }>()
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <header class="flex items-center gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <h2 class="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-900">
        <LucideIcon :icon="FileText" class="size-4 shrink-0 text-slate-500" />
        <span class="truncate">{{ text.title || $t('profile.showcase.text.defaultTitle') }}</span>
      </h2>
    </header>
    <RichContent class="px-4 py-3.5 sm:px-5" :content="text.body" format="markdown" />
  </section>
</template>
