<script setup lang="ts">
import { ChevronRight } from 'lucide'
import type { TrophyBrowseItem, TrophyBrowseMeta } from '~/services/trophies'
import { useLeaderboard } from '~/services/leaderboard'
import { emptyLibraryFilters, trophyBrowsePath, trophyBrowseQuery, type LibraryCategory } from '~/utils/trophyLibrary'

/**
 * Below the hero: what's trending, what was just added, and who leads the
 * points board — server-rendered links into the library and to profiles, so a
 * crawler landing on the homepage can reach the rest of the site (`docs/home.md`).
 *
 * Each section is optional: if its request fails or comes back empty it is
 * left out, and the page still answers 200. Times are not shown, so there is
 * nothing relative to drift between the server render and hydration.
 */
const SET_COUNT = 8
const PLAYER_COUNT = 10

const setsFor = (category: LibraryCategory) =>
  trophyBrowsePath(trophyBrowseQuery(category, emptyLibraryFilters(), 1, SET_COUNT))

// `lazy`: the server still waits for these, client navigation doesn't.
const { data: trending } = useApiFetchRaw<TrophyBrowseItem[], TrophyBrowseMeta>(setsFor('trending'), { lazy: true })
const { data: newest } = useApiFetchRaw<TrophyBrowseItem[], TrophyBrowseMeta>(setsFor('new'), { lazy: true })
const leaderboard = useLeaderboard()
const { data: leaders } = useAsyncData('home:leaders', () => leaderboard.points({ page: 1 }), { lazy: true })

const setSections = computed(() => [
  { key: 'trending' as const, items: trending.value?.data ?? [], more: '/trophies' },
  { key: 'new' as const, items: newest.value?.data ?? [], more: '/trophies?category=new' },
].filter(section => section.items.length))

const players = computed(() => (leaders.value?.data ?? []).slice(0, PLAYER_COUNT))
</script>

<template>
  <div v-if="setSections.length || players.length" class="grid grid-cols-1 gap-6 lg:grid-cols-3">
    <section
      v-for="section in setSections"
      :key="section.key"
      class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
      :aria-labelledby="`home-hub-${section.key}`"
    >
      <h2 :id="`home-hub-${section.key}`" class="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">
        {{ $t(`library.categories.${section.key}`) }}
      </h2>
      <ul class="divide-y divide-slate-100">
        <li v-for="set in section.items" :key="set.id">
          <AppLink :to="`/trophies/${set.id}`" class="flex items-center gap-3 px-4 py-2 transition hover:bg-slate-50">
            <img :src="set.icon_url" :alt="set.localized_name" loading="lazy" class="size-9 shrink-0 rounded-md bg-slate-100 object-cover">
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-slate-800">{{ set.localized_name }}</span>
              <span class="block text-[11px] text-slate-400">{{ set.platform.map(platformLabel).join(' / ') }}</span>
            </span>
          </AppLink>
        </li>
      </ul>
      <AppLink :to="section.more" class="flex items-center justify-center gap-1 border-t border-slate-100 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
        {{ $t('home.hub.viewAll') }}
        <LucideIcon :icon="ChevronRight" class="size-3.5" />
      </AppLink>
    </section>

    <section v-if="players.length" class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-labelledby="home-hub-players">
      <h2 id="home-hub-players" class="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-900">
        {{ $t('home.hub.topPlayers') }}
      </h2>
      <ol class="divide-y divide-slate-100">
        <li v-for="player in players" :key="player.user_id">
          <AppLink :to="`/p/${player.psnid}`" class="flex items-center gap-3 px-4 py-2 transition hover:bg-slate-50">
            <span class="w-5 shrink-0 text-right text-xs font-semibold text-slate-400 tabular-nums">{{ player.rank }}</span>
            <img :src="player.avatar_url" :alt="player.psnid" loading="lazy" class="size-8 shrink-0 rounded-full bg-slate-100 object-cover">
            <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{{ player.psnid }}</span>
            <span class="shrink-0 text-[11px] text-slate-400 tabular-nums">Lv {{ player.trophy_level }}</span>
          </AppLink>
        </li>
      </ol>
      <AppLink to="/leaderboard" class="flex items-center justify-center gap-1 border-t border-slate-100 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
        {{ $t('home.hub.viewAll') }}
        <LucideIcon :icon="ChevronRight" class="size-3.5" />
      </AppLink>
    </section>
  </div>
</template>
