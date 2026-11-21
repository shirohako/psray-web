<script setup lang="ts">
import { Languages } from 'lucide'
import type { AvailableLanguage } from '~/services/trophies'

/**
 * Title row of the trophy list: the heading with the set's trophy count, and
 * the picker for the language trophy text is shown in (when there is one).
 * While an unofficial translation is shown (one made on this site for a
 * language PSN lacks), a notice under it says so: untranslated entries show
 * the original, which is one click away.
 */
const props = defineProps<{
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

const unofficial = computed(() => props.languages.find(l => l.language_code === props.current)?.source === 'manual')
const original = computed(() => props.languages.find(l => l.is_default))
// 「Japanese」 reads better than 「Japanese (Japan)」; script subtags (zh-Hans) are kept.
const languageName = (code: string) => langLabel(code.replace(/-(?:[A-Z]{2}|\d{3})$/, ''))
</script>

<template>
  <div>
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
    <Transition
      enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
      leave-to-class="opacity-0"
    >
      <div v-if="unofficial" class="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-violet-100 bg-violet-50/60 px-4 py-2 text-xs sm:px-5">
        <LucideIcon :icon="Languages" class="size-3.5 shrink-0 text-violet-700" />
        <span class="font-semibold text-violet-700">{{ $t('trophy.lang.unofficialLong') }}</span>
        <span class="min-w-0 flex-1 text-slate-600">
          {{ $t('trophy.lang.unofficialNotice', { language: languageName(current), original: original ? languageName(original.language_code) : '' }) }}
        </span>
        <button
          v-if="original"
          type="button"
          class="shrink-0 font-medium text-slate-500 underline-offset-2 transition-colors hover:text-slate-900 hover:underline disabled:opacity-50"
          :disabled="loading"
          @click="emit('language', original.language_code)"
        >
          {{ $t('trophy.lang.showOriginal') }}
        </button>
      </div>
    </Transition>
  </div>
</template>
