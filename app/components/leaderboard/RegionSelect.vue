<script setup lang="ts">
import type { SelectOption } from '~/types/select'

/**
 * Region picker: a searchable `<SelectMenu>` over the full {@link REGIONS}
 * list, with flags. Search matches a region's name, or its exact code.
 *
 * ```vue
 * <LeaderboardRegionSelect v-model="region" />
 * ```
 */
const model = defineModel<string>({ required: true })

const { t } = useI18n()
const options: SelectOption[] = REGIONS.map(r => ({ value: r.code, label: r.name }))
</script>

<template>
  <SelectMenu
    v-model="model"
    :options="options"
    searchable
    panel-width="320"
    class="w-56"
    :search-placeholder="t('leaderboard.regionSearch')"
    :empty-text="t('leaderboard.regionEmpty')"
    :aria-label="t('leaderboard.regionLabel')"
  >
    <template #value>
      <RegionFlag :country="model" class="shrink-0 overflow-hidden rounded-sm text-lg" />
      <span class="min-w-0 flex-1 truncate font-medium text-slate-800">{{ REGIONS.find(r => r.code === model)?.name ?? model }}</span>
      <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500">{{ model }}</span>
    </template>
    <template #option="{ option, selected }">
      <RegionFlag :country="option.value" class="shrink-0 overflow-hidden rounded-sm text-lg" />
      <span class="min-w-0 flex-1 truncate" :class="selected ? 'font-semibold text-slate-900' : 'text-slate-700'">{{ option.label }}</span>
      <span class="text-[11px] font-medium text-slate-400">{{ option.value }}</span>
    </template>
  </SelectMenu>
</template>
