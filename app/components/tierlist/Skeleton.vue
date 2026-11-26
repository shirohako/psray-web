<script setup lang="ts">
import { Rows3 } from 'lucide'
import { DEFAULT_TIERS } from '~/utils/tierList'

/**
 * Stand-in while the client-only editor loads: the page header (rendered on
 * the server, so the page has its heading and description) and the board's
 * outline in the default tier colours.
 */
defineProps<{ boardOnly?: boolean }>()
</script>

<template>
  <div class="space-y-5">
    <PageHeader v-if="!boardOnly" :icon="Rows3" :title="$t('tierlist.title')" :description="$t('tierlist.description')" />
    <div class="animate-skeleton-in flex flex-col gap-4 lg:flex-row lg:items-start" aria-hidden="true">
      <div class="min-w-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div class="flex items-center gap-3 border-b border-slate-200 px-3 py-3">
          <div class="skeleton h-4 w-40 rounded" />
          <div class="flex-1" />
          <div class="skeleton skeleton-soft h-4 w-24 rounded" />
        </div>
        <div v-for="tier in DEFAULT_TIERS" :key="tier.label" class="flex border-t border-slate-200 first-of-type:border-t-0">
          <div class="grid min-h-19 w-16 place-items-center text-2xl font-bold text-slate-900/80 sm:min-h-23 sm:w-22 sm:text-3xl" :style="{ backgroundColor: tier.color }">{{ tier.label }}</div>
          <div class="flex-1" />
        </div>
        <div class="flex min-h-19 border-t border-slate-200 bg-slate-50/70 sm:min-h-23">
          <div class="w-16 bg-slate-200/70 sm:w-22" />
        </div>
      </div>
      <div class="h-96 overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm lg:w-80 lg:shrink-0">
        <div class="skeleton h-4 w-20 rounded" />
        <div class="skeleton skeleton-soft mt-3 h-8 rounded-lg" />
        <div class="skeleton skeleton-soft mt-3 h-8 rounded-md" />
        <div class="mt-4 grid grid-cols-3 gap-2">
          <div v-for="index in 6" :key="index" class="skeleton skeleton-soft aspect-3/4 rounded" />
        </div>
      </div>
    </div>
  </div>
</template>
