<script setup lang="ts">
import { AlertTriangle, Heart, RotateCw, UserMinus, Users, type IconNode } from 'lucide'
import type { FollowDirection, FollowPageMeta, MyFollowEntry } from '~/services/profile'

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
const { user } = useAuth()

// Tab and page live in the URL so Back/Forward and reloads restore the same list.
const state = computed(() => parseMyFollowsQuery(route.query))
const requestUrl = computed(() => `/user/${state.value.tab}${state.value.page > 1 ? `?page=${state.value.page}` : ''}`)
const { data: response, status, error, refresh } = await useApiFetchRaw<MyFollowEntry[], FollowPageMeta>(() => requestUrl.value, { lazy: true })

const items = computed(() => response.value?.data ?? [])
const meta = computed(() => response.value?.meta)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
const pending = useFetchPending(status)

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

// Follow / unfollow from the cards; unfollowing asks first.
const { iFollow, followsMe, busy, onFollowClick, confirming, confirmOpen, confirmUnfollow }
  = useMyFollowToggle(() => state.value.tab, response)

// Placeholder rows: varied widths so they read like real PSN IDs.
const SKELETON_WIDTHS = ['w-28', 'w-20', 'w-32', 'w-24', 'w-16', 'w-28']
</script>

<template>
  <div class="space-y-5">
    <PageHeader :icon="Users" :title="$t('me.following.title')" :description="$t('me.following.description')" />

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

        <ul
          v-else-if="items.length"
          class="grid gap-3 p-3 transition-opacity sm:p-4 md:grid-cols-2 xl:grid-cols-3"
          :class="{ 'opacity-55': pending }"
        >
          <li
            v-for="person in items"
            :key="person.profile_id"
            class="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm"
          >
            <ProfileFollowRow :person="person" variant="card">
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
                <MeFollowButton
                  :psnid="person.psnid"
                  :following="iFollow(person)"
                  :follows-me="followsMe(person)"
                  :busy="busy[person.psnid]"
                  @toggle="onFollowClick(person)"
                />
              </template>
            </ProfileFollowRow>
          </li>
        </ul>

        <ul v-else-if="pending" class="animate-skeleton-in grid gap-3 p-3 sm:p-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          <li v-for="(width, i) in SKELETON_WIDTHS" :key="i" class="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <div class="skeleton size-11 shrink-0 rounded-full" />
            <div class="min-w-0 flex-1 space-y-2">
              <div class="skeleton h-3.5 rounded" :class="width" />
              <div class="skeleton skeleton-soft h-3 w-36 rounded" />
            </div>
            <div class="skeleton skeleton-soft size-8 shrink-0 rounded-lg" />
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

    <ConfirmDialog
      v-model:open="confirmOpen"
      size="sm"
      :title="$t('me.following.unfollowTitle')"
      :icon="UserMinus"
      :confirm-label="$t('profile.actions.unfollow')"
      :busy="!!confirming && busy[confirming.psnid]"
      @confirm="confirmUnfollow"
    >
      <div v-if="confirming" class="flex items-center gap-3 p-4 sm:p-5">
        <UserAvatar :psnid="confirming.psnid" :src="confirming.avatar_url" class="size-10" />
        <p class="min-w-0 text-sm leading-6 text-slate-600">
          <i18n-t keypath="me.following.unfollowBody" scope="global">
            <template #psnid><span class="font-semibold text-slate-900">{{ confirming.psnid }}</span></template>
          </i18n-t>
        </p>
      </div>
    </ConfirmDialog>
  </div>
</template>
