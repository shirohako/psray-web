<script setup lang="ts">
import type { AdminSeriesSet } from '~/types/admin'

/** A trophy set as one compact line in the series editor; actions go in the default slot. */
defineProps<{
  set: AdminSeriesSet
  /** `auto`: put there by automatic grouping and not yet saved by an admin. */
  source?: 'auto' | 'manual'
  /** Already in the series (search and suggestion lists). */
  present?: boolean
}>()
</script>

<template>
  <div class="flex min-w-0 items-center gap-2.5" :class="present ? 'opacity-50' : ''">
    <AdminCdnImage :src="set.icon_url" class="shrink-0 rounded object-cover" :class="set.platform.length === 1 && set.platform[0] === 'PS5' ? 'size-8' : 'h-8 w-[58px]'" />
    <div class="min-w-0 flex-1">
      <p class="truncate text-[13px] font-medium text-slate-900" :title="set.name">{{ set.name }}</p>
      <p class="flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-400">
        <span class="font-medium text-slate-500">{{ set.platform.join(' / ') || '—' }}</span>
        <span v-if="set.region">· {{ set.region }}</span>
        <span>· {{ set.owners.toLocaleString() }} 人</span>
        <a :href="`/trophies/${set.id}`" target="_blank" rel="noopener" class="font-mono hover:text-slate-700 hover:underline" @click.stop>#{{ set.id }}</a>
        <span v-if="source === 'auto'" class="rounded bg-sky-50 px-1 text-sky-700" title="自动归类放进来的，保存后变为手动">自动</span>
        <span v-if="present" class="rounded bg-slate-100 px-1 text-slate-500">已在系列里</span>
      </p>
    </div>
    <slot />
  </div>
</template>
