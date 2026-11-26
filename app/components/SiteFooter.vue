<script setup lang="ts">
/**
 * Site footer: the main sections, the legal pages and — unless the page lists
 * its own editions — this page in each interface language. Plain links in the
 * server-rendered HTML, so a crawler can reach every section and every
 * language from any page.
 */
import { Calendar, GitCommitHorizontal } from 'lucide'

const route = useRoute()

// Which build is serving this page: short commit and UTC build date as YYMMDD
// (e.g. 261126), the pair psray-deploy names release folders with. Both
// chips form one link to the repository.
const { build } = useRuntimeConfig().public
const buildDate = build.time.slice(2, 10).replaceAll('-', '')
const chipClass = 'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-px transition-colors group-hover:border-slate-300 group-hover:bg-white group-hover:text-slate-800'

const sections = [
  { labelKey: 'nav.home', to: '/' },
  { labelKey: 'nav.trophies', to: '/trophies' },
  { labelKey: 'nav.games', to: '/games' },
  { labelKey: 'nav.leaderboard', to: '/leaderboard' },
  { labelKey: 'nav.about', to: '/about' },
  { labelKey: 'footer.api', to: '/docs/api' },
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
    <div>
      <a
        :href="build.repo"
        target="_blank"
        rel="noopener nofollow"
        class="group inline-flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-500"
      >
        <span :class="chipClass" :title="$t('footer.buildCommit')">
          <LucideIcon :icon="GitCommitHorizontal" class="size-3 text-slate-400" />
          {{ build.commit }}
        </span>
        <span :class="chipClass" :title="$t('footer.buildDate')">
          <LucideIcon :icon="Calendar" class="size-3 text-slate-400" />
          <time :datetime="build.time">{{ buildDate }}</time>
        </span>
      </a>
    </div>
    <p class="text-slate-400">© 2026 PSRay</p>
  </footer>
</template>
