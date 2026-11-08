<script setup lang="ts">
/**
 * Site footer: the main sections, the legal pages and — unless the page lists
 * its own editions — this page in each interface language. Plain links in the
 * server-rendered HTML, so a crawler can reach every section and every
 * language from any page.
 */
const route = useRoute()

const sections = [
  { labelKey: 'nav.home', to: '/' },
  { labelKey: 'nav.trophies', to: '/trophies' },
  { labelKey: 'nav.games', to: '/games' },
  { labelKey: 'nav.leaderboard', to: '/leaderboard' },
  { labelKey: 'nav.about', to: '/about' },
  { labelKey: 'auth.register.terms.termsLink', to: '/terms' },
  { labelKey: 'auth.register.terms.privacyLink', to: '/privacy' },
]
</script>

<template>
  <footer class="mx-auto max-w-6xl space-y-3 border-t border-slate-200 px-4 pt-6 pb-20 text-xs text-slate-500 sm:px-6 lg:px-8">
    <nav :aria-label="$t('nav.sectionLabel')" class="flex flex-wrap items-center gap-x-4 gap-y-1">
      <AppLink v-for="item in sections" :key="item.to" :to="item.to" class="transition hover:text-slate-900">
        {{ $t(item.labelKey) }}
      </AppLink>
    </nav>
    <LanguageLinks v-if="route.meta.languageLinks !== false" class="text-slate-400" />
    <p class="text-slate-400">© 2026 PSRay</p>
  </footer>
</template>
