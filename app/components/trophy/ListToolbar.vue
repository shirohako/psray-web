<script setup lang="ts">
import { ArrowUpDown } from 'lucide'
import type { SelectOption } from '~/types/select'
import type { TrophyFilterMode, TrophySortMode } from '~/utils/trophyList'

/**
 * Filter + sort toolbar over the trophy list: earned/unearned filter, spoiler
 * switch and sort order. The earned-based filters and sort need a viewer
 * (`?psnid=`), so they stay disabled without one.
 */
const props = defineProps<{ hasViewer: boolean }>()

const filter = defineModel<TrophyFilterMode>('filter', { required: true })
const sort = defineModel<TrophySortMode>('sort', { required: true })
/** Reveal PSN-hidden (spoiler) trophies. */
const showSpoilers = defineModel<boolean>('showSpoilers', { required: true })

const { t } = useI18n()

const filterOptions: { value: TrophyFilterMode; labelKey: string }[] = [
  { value: 'all', labelKey: 'trophy.filter.all' },
  { value: 'earned', labelKey: 'trophy.filter.earned' },
  { value: 'unearned', labelKey: 'trophy.filter.unearned' },
]
const sortOptions = computed<SelectOption<TrophySortMode>[]>(() => [
  { value: 'default', label: t('trophy.sort.default') },
  { value: 'earned', label: t('trophy.sort.earned'), disabled: !props.hasViewer },
  { value: 'rarity', label: t('trophy.sort.rarity') },
])
</script>

<template>
  <div class="flex flex-col gap-2.5 border-b border-slate-200 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
    <div class="grid grid-cols-3 rounded-lg bg-slate-100 p-0.5 sm:inline-flex">
      <button
        v-for="f in filterOptions"
        :key="f.value"
        type="button"
        :disabled="f.value !== 'all' && !hasViewer"
        :title="f.value !== 'all' && !hasViewer ? $t('trophy.filter.needsPsnid') : undefined"
        class="rounded-md px-3 py-1 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
        :class="filter === f.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
        @click="filter = f.value"
      >
        {{ $t(f.labelKey) }}
      </button>
    </div>

    <div class="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
      <!-- Spoiler toggle -->
      <button
        type="button"
        role="switch"
        :aria-checked="showSpoilers"
        class="inline-flex min-w-0 items-center justify-between gap-2 rounded-lg px-1 py-1 text-sm font-medium text-slate-600 sm:justify-normal sm:p-0"
        @click="showSpoilers = !showSpoilers"
      >
        <span>{{ $t('trophy.list.showHidden') }}</span>
        <span class="relative h-5 w-9 rounded-full transition-colors" :class="showSpoilers ? 'bg-slate-900' : 'bg-slate-300'">
          <span class="absolute top-0.5 size-4 rounded-full bg-white shadow transition-all" :class="showSpoilers ? 'left-4.5' : 'left-0.5'" />
        </span>
      </button>

      <SelectMenu
        v-model="sort"
        :options="sortOptions"
        :icon="ArrowUpDown"
        class="max-sm:flex-1 sm:shrink-0"
        :aria-label="$t('trophy.sort.label')"
      />
    </div>
  </div>
</template>
