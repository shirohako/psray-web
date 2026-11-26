<script setup lang="ts">
import { ArrowRight, Wrench } from 'lucide'
import { TOOLS } from '~/utils/tools'

const { t } = useI18n()

useSeo({
  title: () => t('seo.tools.title'),
  description: () => t('seo.tools.description'),
})
</script>

<template>
  <div class="space-y-5">
    <PageHeader :icon="Wrench" :title="$t('tools.title')" :description="$t('tools.description')" />

    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="tool in TOOLS" :key="tool.key">
        <AppLink
          :to="tool.to"
          class="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <ToolsCardArt :tool="tool.key" class="h-40 border-b border-slate-100" />
          <div class="flex flex-1 flex-col gap-2 p-4">
            <div class="flex items-center gap-2">
              <span class="grid size-7 shrink-0 place-items-center rounded-md border border-slate-200 text-slate-600">
                <LucideIcon :icon="tool.icon" class="size-4" stroke-width="1.75" />
              </span>
              <h2 class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-sky-700">{{ $t(`tools.items.${tool.key}.name`) }}</h2>
              <LucideIcon :icon="ArrowRight" class="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500 motion-reduce:transition-none" />
            </div>
            <p class="text-xs leading-5 text-slate-500">{{ $t(`tools.items.${tool.key}.description`) }}</p>
            <div class="mt-auto flex flex-wrap gap-1.5 pt-1">
              <span
                v-for="tag in tool.tags"
                :key="tag.key"
                class="inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 text-[11px] font-medium text-slate-600"
              >
                <LucideIcon :icon="tag.icon" class="size-3" />{{ $t(`tools.tags.${tag.key}`) }}
              </span>
            </div>
          </div>
        </AppLink>
      </li>
    </ul>
  </div>
</template>
