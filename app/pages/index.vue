<script setup lang="ts">
import { Gamepad2, RefreshCw, Search, UserRound } from 'lucide'
import { DEFAULT_LOCALE, HTML_LANG, isUiLocale } from '#shared/locales'

const { t, locale } = useI18n()
const appConfig = useAppConfig()
const psnid = ref('')
const siteUrl = useRuntimeConfig().public.siteUrl.replace(/\/+$/, '')

/**
 * The title one character at a time, numbered across the whole title, for
 * its entrance and its hover hop. A Latin word keeps its letters together
 * so lines still break only between words; CJK breaks between characters
 * as usual. Deterministic, so the server and the client split it alike.
 */
const titleWords = computed(() => {
  let n = 0
  return t('home.hero.title').split(/(\s+)/).filter(Boolean).map(part => /^\s+$/.test(part)
    ? { space: true, cjk: false, chars: [] }
    : { space: false, cjk: /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(part), chars: Array.from(part, ch => ({ ch, i: n++ })) })
})
/** Stagger of the title's entrance and of its hop, ms per character; the hop itself (main.css) lasts HOP. */
const ENTER_STEP = 35
const HOP_STEP = 30
const HOP = 500
const letterStyle = (i: number) => ({ '--in': `${80 + i * ENTER_STEP}ms`, '--hop': `${i * HOP_STEP}ms` })
const hopping = ref(false)
let hopTimer: ReturnType<typeof setTimeout> | undefined
/**
 * Sends a hop along the title, left to right: once when the arrival is over,
 * then once per hover. Not before, so it never cuts the entrance short.
 */
function hop() {
  if (!swept.value || hopping.value) return
  hopping.value = true
  const letters = titleWords.value.reduce((n, word) => n + word.chars.length, 0)
  hopTimer = setTimeout(() => {
    hopping.value = false
  }, HOP + letters * HOP_STEP)
}

// Highlighters sweep over these phrases of the lead in turn, once it has
// been revealed: ms after the page is ready.
const MARKS = { progress: 1200, psnId: 1550, glance: 1900 }
/** When the last sweep has finished and hovering may fill a highlighter. */
const SWEPT = 1900 + 700
const { colours, pick } = useTeardownPalette()
const markStyles = computed(() => Object.fromEntries(Object.entries(MARKS).map(([key, delay], i) => {
  const [bg, fg] = colours.value.marks[i]!
  return [key, { '--mark-bg': bg, '--mark-fg': fg, '--mark-delay': `${delay}ms` }]
})))
const marked = ref(false)
const swept = ref(false)
let sweeping: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  // Same scheme as the drawing beside it; the sweep starts once it is known.
  pick()
  requestAnimationFrame(() => {
    marked.value = true
    sweeping = setTimeout(() => {
      swept.value = true
      // The arrival ends with one hop along the title, as hovering it would.
      hop()
    }, SWEPT)
  })
})
onBeforeUnmount(() => {
  clearTimeout(sweeping)
  clearTimeout(hopTimer)
})

function goToProfile() {
  const id = psnid.value.trim()
  if (!id) return
  navigateTo(`/p/${encodeURIComponent(id)}`)
}

function goToSync() {
  const id = psnid.value.trim()
  if (!id) return
  navigateTo(`/sync?psnid=${encodeURIComponent(id)}`)
}

useSeo({
  title: () => t('seo.home.title'),
  siteNameFirst: true,
  description: () => t('seo.home.description'),
})

// Minimal, honest structured data: what this site is and what it's called.
// No SearchAction — that promises a search-results URL we don't have yet.
useHead(() => ({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'PSRay',
      'url': siteUrl,
      'inLanguage': HTML_LANG[isUiLocale(locale.value) ? locale.value : DEFAULT_LOCALE],
      'description': t('seo.home.description'),
    }),
  }],
}))
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-10">
    <!-- Hero: the one thing most visitors came to do. Wide enough, the
         teardown drawing takes the left column and the lookup the right;
         narrower, the drawing sits above. -->
    <section class="@container rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div class="grid items-center gap-6 @3xl:grid-cols-[minmax(0,19fr)_minmax(0,21fr)] @3xl:gap-8">
        <HomeTeardown />

        <!-- Arriving, once: the title rises out of a blur letter by letter, the
             lead is revealed top to bottom, the form follows, highlighters in
             the drawing's palette sweep over the key phrases and a ring pulses
             out of the field. After that, hovering a phrase fills its
             highlighter. The title's letters hop in turn once to finish, and
             again whenever it is hovered. -->
        <div
          class="@container"
          :class="{ 'is-marked': marked, 'is-swept': swept }"
          :style="{ '--hero-accent': colours.line }"
        >
          <div class="flex items-center gap-2.5">
            <img
              v-if="appConfig.brand.logo"
              :src="appConfig.brand.logo"
              alt=""
              class="size-9 shrink-0 animate-hero-logo object-contain"
            />
            <span v-else class="grid size-9 shrink-0 animate-hero-logo place-items-center rounded-lg bg-slate-900 text-white shadow-sm shadow-slate-900/20">
              <LucideIcon :icon="Gamepad2" class="size-5" />
            </span>
            <h1
              class="text-lg font-bold tracking-tight text-slate-900 sm:text-xl"
              :class="{ 'is-hopping': hopping }"
              :aria-label="$t('home.hero.title')"
              @mouseenter="hop"
            >
              <span aria-hidden="true"><template v-for="(word, k) in titleWords" :key="k"><span v-if="word.space">{{ ' ' }}</span><span v-else :class="{ 'inline-block whitespace-nowrap': !word.cjk }"><span v-for="c in word.chars" :key="c.i" class="hero-letter inline-block" :style="letterStyle(c.i)">{{ c.ch }}</span></span></template></span>
            </h1>
          </div>
          <i18n-t
            keypath="home.hero.lead"
            tag="p"
            scope="global"
            class="mt-3 animate-hero-reveal text-sm leading-relaxed text-slate-500 sm:text-[15px]"
          >
            <template v-for="(_, key) in MARKS" :key="key" #[key]>
              <mark class="hero-mark" :style="markStyles[key]">{{ $t(`home.hero.marks.${key}`) }}</mark>
            </template>
          </i18n-t>

          <!-- 16 px under the lead's line box reads as the 20 px between field and buttons. -->
          <form
            class="mt-4 grid animate-hero-in gap-5"
            style="animation-delay: 750ms"
            :aria-label="$t('home.lookup.heading')"
            @submit.prevent="goToProfile"
          >
            <div class="relative">
              <LucideIcon
                :icon="Search"
                class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                v-model="psnid"
                type="text"
                :placeholder="$t('home.lookup.placeholder')"
                autocapitalize="off"
                autocomplete="off"
                spellcheck="false"
                class="hero-ring w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
              />
            </div>
            <!-- The primary action on the right, after Sync in reading order too. -->
            <div class="grid grid-cols-1 gap-2 @sm:grid-cols-2">
              <button
                type="button"
                :disabled="!psnid.trim()"
                class="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 disabled:border-slate-300 disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-100 disabled:hover:bg-slate-50 disabled:hover:text-slate-400"
                @click="goToSync"
              >
                <LucideIcon :icon="RefreshCw" class="size-4 shrink-0" />
                {{ $t('home.lookup.sync') }}
              </button>
              <button
                type="submit"
                :disabled="!psnid.trim()"
                class="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/30 transition hover:bg-slate-800 active:bg-slate-950 disabled:opacity-40 disabled:hover:bg-slate-900"
              >
                <LucideIcon :icon="UserRound" class="size-4 shrink-0" />
                {{ $t('home.lookup.view') }}
              </button>
            </div>
          </form>

          <p class="mt-2.5 animate-hero-in text-xs leading-relaxed text-slate-400" style="animation-delay: 900ms">{{ $t('home.lookup.hint') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
