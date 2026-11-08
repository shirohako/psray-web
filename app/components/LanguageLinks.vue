<script setup lang="ts">
import { HTML_LANG, UI_LOCALES, type UiLocale } from '#shared/locales'

/**
 * This page in each of its editions, as plain links in the server-rendered
 * HTML: the crawlable counterpart of the top-bar language menu, which only
 * renders once opened. The footer lists all five; pages whose editions depend
 * on their content (trophy sets, games, profiles) pass their own and switch
 * the footer's off with `definePageMeta({ languageLinks: false })`.
 */
const props = withDefaults(defineProps<{ locales?: readonly UiLocale[] }>(), {
  locales: () => UI_LOCALES,
})

const { locale, locales: catalog } = useI18n()
const { targetFor, remember } = useLanguageSwitch()

// Endonyms from the module config, deliberately untranslated.
const names = computed<Record<string, string>>(() =>
  Object.fromEntries(catalog.value.map(item => [item.code, item.name ?? item.code])))
</script>

<template>
  <nav :aria-label="$t('nav.aria.language')" class="flex flex-wrap items-center gap-x-3 gap-y-1">
    <NuxtLink
      v-for="code in props.locales"
      :key="code"
      :to="targetFor(code)"
      :hreflang="code"
      :lang="HTML_LANG[code]"
      :aria-current="code === locale ? 'true' : undefined"
      class="transition hover:text-slate-900"
      :class="code === locale ? 'font-semibold text-slate-700' : ''"
      @click="remember(code)"
    >
      {{ names[code] }}
    </NuxtLink>
  </nav>
</template>
