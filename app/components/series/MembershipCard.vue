<script setup lang="ts">
import { ChevronRight } from 'lucide'
import type { SeriesMembership } from '~/services/series'

/**
 * Side card on a trophy set or game page: the series it belongs to and which
 * stage it is (or that it's a spin-off), linking to the series page.
 */
defineProps<{ series: SeriesMembership[] }>()
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-labelledby="series-membership-heading">
    <h2 id="series-membership-heading" class="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">
      {{ $t('series.membership.title') }}
    </h2>
    <div class="divide-y divide-slate-100">
      <AppLink v-for="item in series" :key="item.id" :to="`/series/${item.id}`" class="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50">
        <SeriesCoverStack :covers="item.covers" size="sm" />
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm font-semibold leading-5 text-slate-900 group-hover:text-sky-700" :lang="contentLang(item.display_language, item.localized_name)">
            {{ item.localized_name }}
          </p>
          <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 tabular-nums">
            <span class="inline-flex h-5 items-center rounded bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600">{{ item.stage_kind === 'side' ? $t('series.membership.side') : $t('series.membership.stage', { n: item.stage_number }) }}</span>
            <span>{{ $t('series.membership.of', { n: item.stage_count }) }}</span>
          </p>
        </div>
        <LucideIcon :icon="ChevronRight" class="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
      </AppLink>
    </div>
  </section>
</template>
