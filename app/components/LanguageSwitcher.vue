<script setup lang="ts">
import { Check, Languages } from 'lucide'
import type { UiLocale } from '#shared/locales'

/**
 * UI language menu for the top bar. Targets and the remembering cookie come
 * from `useLanguageSwitch()`; the menu only renders once opened, so the
 * crawlable copies of these links live in `<LanguageLinks>` (footer, pages).
 */
const { locale, locales } = useI18n()
const { targetFor, remember } = useLanguageSwitch()
</script>

<template>
  <DropdownMenu align="right">
    <button
      type="button"
      :aria-label="$t('nav.aria.language')"
      :title="$t('nav.aria.language')"
      class="grid size-10 cursor-pointer place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
    >
      <LucideIcon :icon="Languages" class="size-5" stroke-width="1.75" />
    </button>

    <template #menu="{ close }">
      <NuxtLink
        v-for="item in locales"
        :key="item.code"
        :to="targetFor(item.code as UiLocale)"
        class="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        :class="item.code === locale ? 'text-slate-900' : ''"
        @click="remember(item.code as UiLocale); close()"
      >
        <LucideIcon v-if="item.code === locale" :icon="Check" class="size-4 text-slate-400" />
        <span v-else class="size-4" />
        <!-- Endonyms, deliberately untranslated. -->
        {{ item.name }}
      </NuxtLink>
    </template>
  </DropdownMenu>
</template>
