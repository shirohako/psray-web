<script setup lang="ts">
import { CalendarDays } from 'lucide'
import { DEFAULT_LOCALE, HTML_LANG, isUiLocale, type UiLocale } from '#shared/locales'

const props = defineProps<{
  eyebrow: string
  title: string
  lead: string
  /** Calendar date of the last content revision, `YYYY-MM-DD`. */
  updatedAt: string
  items: { id: string, label: string }[]
  narrow?: boolean
  /**
   * Language the page body is written in, for pages that exist in one
   * language only (`/terms`, `/privacy`). The layout's own labels and the
   * `lang` attribute follow it so the chrome matches the text. Omit it for
   * translated pages, which follow the interface locale.
   */
  locale?: UiLocale
}>()

const { t, locale: uiLocale } = useI18n()

const contentLocale = computed<UiLocale>(() =>
  props.locale ?? (isUiLocale(uiLocale.value) ? uiLocale.value : DEFAULT_LOCALE))

// `ja` is the catalog fallback, so it is always loaded: a Japanese-only page
// can render its labels in Japanese inside any interface.
const label = (key: string, named: Record<string, unknown> = {}) =>
  t(key, named, { locale: contentLocale.value })

const updatedLabel = computed(() => {
  const date = new Intl.DateTimeFormat(HTML_LANG[contentLocale.value], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${props.updatedAt}T00:00:00Z`))
  return label('staticPage.updatedAt', { date })
})

const activeId = useActiveSection(() => props.items.map(item => item.id))
</script>

<template>
  <article :lang="HTML_LANG[contentLocale]" class="mx-auto" :class="narrow ? 'max-w-5xl' : 'max-w-6xl'">
    <header class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="px-5 py-6 sm:px-7 sm:py-8 lg:px-8">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">{{ eyebrow }}</p>
        <h1 class="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{{ title }}</h1>
        <p class="mt-2.5 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{{ lead }}</p>
        <p class="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <LucideIcon :icon="CalendarDays" class="size-3.5" />
          {{ updatedLabel }}
        </p>
      </div>
    </header>

    <nav :aria-label="label('staticPage.tocLabel')" class="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:hidden">
      <ul class="flex min-w-max gap-1">
        <li v-for="item in items" :key="item.id">
          <a
            :href="`#${item.id}`"
            :aria-current="activeId === item.id ? 'location' : undefined"
            class="block rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200"
            :class="activeId === item.id
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
          >
            {{ item.label }}
          </a>
        </li>
      </ul>
    </nav>

    <div class="mt-6 grid items-start gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
      <nav :aria-label="label('staticPage.tocLabel')" class="sticky top-24 hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:block">
        <p class="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">{{ label('staticPage.toc') }}</p>
        <ul class="space-y-0.5">
          <li v-for="item in items" :key="item.id">
            <a
              :href="`#${item.id}`"
              :aria-current="activeId === item.id ? 'location' : undefined"
              class="toc-link relative block rounded-lg py-2 pl-4 pr-3 text-sm font-medium transition-all duration-200"
              :class="activeId === item.id
                ? 'translate-x-1 bg-slate-100 text-slate-950'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'"
            >
              <span
                aria-hidden="true"
                class="absolute inset-y-0 left-0 w-1 origin-center rounded-full bg-slate-950 transition-all duration-200"
                :class="activeId === item.id ? 'scale-y-100 opacity-100' : 'scale-y-50 opacity-0'"
              />
              {{ item.label }}
            </a>
          </li>
        </ul>
      </nav>

      <div class="min-w-0 space-y-6">
        <slot />
      </div>
    </div>
  </article>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .toc-link,
  .toc-link > span {
    transition: none;
  }
}
</style>
