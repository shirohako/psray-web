<script setup lang="ts">
import type { AvailableLanguage } from '~/services/trophies'

/**
 * Title row of the trophy list: the heading with the set's trophy count, and
 * the picker for the language trophy text is shown in (when there is one).
 */
defineProps<{
  /** Trophies in the whole set. */
  total: number
  /** Every language the set can be displayed in. */
  languages: AvailableLanguage[]
  /** Currently displayed `language_code`. */
  current: string
  /** True while a language switch is loading. */
  loading: boolean
}>()

const emit = defineEmits<{ language: [code: string] }>()
</script>

<template>
  <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
    <h2 class="inline-flex items-baseline gap-2 font-semibold text-slate-900">
      {{ $t('trophy.list.heading') }}
      <span class="text-sm font-normal text-slate-400">
        {{ $t('trophy.list.count', total) }}
      </span>
    </h2>
    <div v-if="languages.length" class="flex items-center gap-2.5">
      <span class="hidden items-center gap-1 text-xs font-medium text-slate-400 sm:inline-flex">
        <i18n-t keypath="trophy.lang.available" scope="global" tag="span" class="inline-flex items-center gap-1" :plural="languages.length">
          <template #badge>
            <span class="rounded-full bg-slate-100 px-1.5 py-0.5 font-semibold tabular-nums text-slate-600">{{ languages.length }}</span>
          </template>
        </i18n-t>
      </span>
      <TrophyLanguagePicker
        :languages="languages"
        :current="current"
        :loading="loading"
        @select="emit('language', $event)"
      />
    </div>
  </div>
</template>
