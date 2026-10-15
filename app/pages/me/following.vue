<script setup lang="ts">
import { AlertTriangle, Heart, Loader2, RotateCw, UserCheck, UserPlus, Users, type IconNode } from 'lucide'
import { useProfiles, type FollowDirection, type FollowPageMeta, type MyFollowEntry } from '~/services/profile'
import { ApiError } from '~/utils/ApiError'

/**
 * The signed-in user's follows: who they follow (unfollow from here) and who
 * follows them (follow back from here). A row stays put after unfollowing, so
 * a slip is one click to undo.
 */
definePageMeta({ auth: true })

const { t } = useI18n()
useSeo({ title: () => t('seo.me.following'), noindex: true })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user } = useAuth()
const { follow, unfollow } = useProfiles()

// Tab and page live in the URL so Back/Forward and reloads restore the same list.
const state = computed(() => parseMyFollowsQuery(route.query))
const requestUrl = computed(() => `/user/${state.value.tab}${state.value.page > 1 ? `?page=${state.value.page}` : ''}`)
const { data: response, status, error, refresh } = await useApiFetchRaw<MyFollowEntry[], FollowPageMeta>(() => requestUrl.value, { lazy: true })

const items = computed(() => response.value?.data ?? [])
const meta = computed(() => response.value?.meta)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
// A lazy fetch sits at `idle` until it starts, so count that as loading too.
const pending = computed(() => status.value === 'pending' || status.value === 'idle')
useLoadingBar(pending, () => status.value === 'error')

const TABS: { key: FollowDirection; labelKey: string; icon: IconNode }[] = [
  { key: 'following', labelKey: 'profile.social.following', icon: Heart },
  { key: 'followers', labelKey: 'profile.social.followers', icon: Users },
]

function count(key: FollowDirection) {
  return key === 'following' ? user.value?.following_count : user.value?.follower_count
}

/** Tab changes replace the history entry and go back to page 1; page changes push one. */
function navigate(tab: FollowDirection, page = 1) {
  const location = {
    query: {
      ...(route.query.lang ? { lang: route.query.lang } : {}),
      ...myFollowsRouteQuery({ tab, page }),
    },
  }
  return page === 1 ? router.replace(location) : router.push(location)
}

function changePage(page: number) {
  navigate(state.value.tab, page)
  document.getElementById('follow-results')?.scrollIntoView({ block: 'start' })
}

// Follow changes made on this page, by PSN ID, until the next fetch brings
// the server's view of them.
const changed = ref<Record<string, boolean>>({})
const busy = ref<Record<string, boolean>>({})
watch(response, () => { changed.value = {} })

/** Whether the signed-in user follows this person right now. */
function iFollow(person: MyFollowEntry) {
  return changed.value[person.psnid] ?? (state.value.tab === 'following' || person.is_mutual)
}

/** Whether this person follows the signed-in user. */
function followsMe(person: MyFollowEntry) {
  return state.value.tab === 'followers' || person.is_mutual
}

async function toggle(person: MyFollowEntry) {
  const psnid = person.psnid
  if (busy.value[psnid]) return
  const next = !iFollow(person)
  changed.value[psnid] = next
  busy.value[psnid] = true
  try {
    const result = next ? await follow(psnid) : await unfollow(psnid)
    changed.value[psnid] = result.following
    // Keep the tab count in step without reloading the whole session.
    if (user.value && result.following === next) {
      user.value.following_count = Math.max(0, user.value.following_count + (next ? 1 : -1))
    }
    if (result.following) toast.success({ title: t('toast.followed.title'), description: t('toast.followed.description', { psnid }), icon: UserCheck })
  }
  catch (error) {
    changed.value[psnid] = !next
    if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') {
      await navigateTo({ path: '/auth/login', query: { redirect: route.fullPath } })
      return
    }
    toast.error({ title: t('me.following.toggleFailed'), description: error instanceof ApiError ? error.message : undefined })
  }
  finally {
    delete busy.value[psnid]
  }
}

// Placeholder rows: varied widths so they read like real PSN IDs.
const SKELETON_WIDTHS = ['w-28', 'w-20', 'w-32', 'w-24', 'w-16', 'w-28']
</script>

<template>
  <div class="space-y-5">
    <header class="flex items-start gap-3 pb-1 pt-1">
      <span class="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">
        <LucideIcon :icon="Users" class="size-5" stroke-width="1.5" />
      </span>
      <div>
        <h1 class="text-xl font-bold tracking-tight text-slate-900">{{ $t('me.following.title') }}</h1>
        <p class="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500">{{ $t('me.following.description') }}</p>
      </div>
    </header>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 p-3 sm:px-4">
        <div class="inline-flex rounded-lg bg-slate-100 p-0.5" role="tablist" :aria-label="$t('me.following.title')">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            type="button"
            role="tab"
            :aria-selected="state.tab === tab.key"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition"
            :class="state.tab === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="navigate(tab.key)"
          >
            <LucideIcon :icon="tab.icon" class="size-3.5" :class="state.tab === tab.key && tab.key === 'following' ? 'text-rose-500' : ''" />
            {{ $t(tab.labelKey) }}
            <span
              v-if="count(tab.key) !== undefined"
              class="rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums"
              :class="state.tab === tab.key ? 'bg-slate-900 text-white' : 'bg-slate-200/80 text-slate-500'"
            >{{ fmt(count(tab.key)) }}</span>
          </button>
        </div>
      </div>

      <section id="follow-results" class="scroll-mt-20" :aria-busy="pending">
        <div v-if="error && !pending" class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <LucideIcon :icon="AlertTriangle" class="size-8 text-rose-400" />
          <p class="text-sm text-slate-500">{{ $t('profile.social.loadFailed') }}</p>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            @click="refresh()"
          >
            <LucideIcon :icon="RotateCw" class="size-4" />
            {{ $t('common.retry') }}
          </button>
        </div>

        <ul v-else-if="items.length" class="divide-y divide-slate-100 transition-opacity" :class="{ 'opacity-55': pending }">
          <li v-for="person in items" :key="person.profile_id">
            <ProfileFollowRow :person="person">
              <template #badge>
                <span
                  v-if="followsMe(person) && iFollow(person)"
                  class="shrink-0 rounded-full bg-rose-50 px-1.5 py-px text-[10px] font-semibold text-rose-600"
                >{{ $t('profile.social.mutual') }}</span>
                <span
                  v-else-if="state.tab === 'following' && followsMe(person)"
                  class="shrink-0 rounded-full bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-500"
                >{{ $t('profile.social.followsYou') }}</span>
              </template>
              <template #action>
                <button
                  v-if="iFollow(person)"
                  type="button"
                  :disabled="busy[person.psnid]"
                  class="group/follow inline-flex h-8 min-w-24 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                  :aria-label="`${$t('profile.actions.unfollow')} ${person.psnid}`"
                  @click="toggle(person)"
                >
                  <LucideIcon :icon="busy[person.psnid] ? Loader2 : UserCheck" class="size-3.5" :class="{ 'animate-spin': busy[person.psnid] }" />
                  <span class="group-hover/follow:hidden">{{ $t('profile.actions.following') }}</span>
                  <span class="hidden group-hover/follow:inline">{{ $t('profile.actions.unfollow') }}</span>
                </button>
                <button
                  v-else
                  type="button"
                  :disabled="busy[person.psnid]"
                  class="inline-flex h-8 min-w-24 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                  @click="toggle(person)"
                >
                  <LucideIcon :icon="busy[person.psnid] ? Loader2 : UserPlus" class="size-3.5" :class="{ 'animate-spin': busy[person.psnid] }" />
                  {{ followsMe(person) ? $t('me.following.followBack') : $t('profile.actions.follow') }}
                </button>
              </template>
            </ProfileFollowRow>
          </li>
        </ul>

        <ul v-else-if="pending" class="animate-skeleton-in divide-y divide-slate-100" aria-hidden="true">
          <li v-for="(width, i) in SKELETON_WIDTHS" :key="i" class="flex items-center gap-3 px-4 py-3 sm:px-5">
            <div class="skeleton size-10 shrink-0 rounded-full" />
            <div class="min-w-0 flex-1 space-y-2">
              <div class="skeleton h-3.5 rounded" :class="width" />
              <div class="skeleton skeleton-soft h-2.5 w-24 rounded" />
            </div>
            <div class="skeleton skeleton-soft h-8 w-24 rounded-lg" />
          </li>
        </ul>

        <div v-else class="px-6 py-16 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400">
            <LucideIcon :icon="state.tab === 'following' ? Heart : Users" class="size-5" />
          </span>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">
            {{ $t(state.tab === 'following' ? 'me.following.emptyFollowing' : 'me.following.emptyFollowers') }}
          </h3>
          <p class="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-slate-500">
            {{ $t(state.tab === 'following' ? 'me.following.emptyFollowingHint' : 'me.following.emptyFollowersHint') }}
          </p>
          <NuxtLink
            v-if="state.tab === 'following'"
            to="/leaderboard"
            class="mt-5 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            {{ $t('me.following.browsePlayers') }}
          </NuxtLink>
        </div>

        <div v-if="meta && !error && items.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4">
          <p role="status" class="text-[11px] text-slate-400">
            {{ $t(state.tab === 'following' ? 'profile.social.followingTotal' : 'profile.social.followersTotal', { count: fmt(meta.total) }) }}
          </p>
          <Pagination v-if="totalPages > 1" :page="state.page" :total-pages="totalPages" :siblings="2" @update:page="changePage" />
        </div>
      </section>
    </div>
  </div>
</template>
