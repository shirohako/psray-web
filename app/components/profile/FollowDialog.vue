<script setup lang="ts">
import { AlertTriangle, Heart, RotateCw, Users, type IconNode } from 'lucide'
import { useProfiles, type FollowDirection, type FollowPageMeta, type ProfileFollowEntry } from '~/services/profile'

/**
 * A profile's follow lists: who follows it and who it follows, as two tabs.
 * Public, so it works signed out, and for private profiles too (follows are
 * site relationships, not PSN trophy data). Each tab keeps its own page, so
 * switching back and forth doesn't refetch.
 */
const props = defineProps<{
  psnid: string
  /** Counts from the profile, shown on the tabs before a list has loaded. */
  followerCount: number
  followingCount: number
}>()

const open = defineModel<boolean>('open', { required: true })
const direction = defineModel<FollowDirection>('direction', { required: true })

const { follows } = useProfiles()

interface ListState {
  page: number
  items: ProfileFollowEntry[]
  meta?: FollowPageMeta
  pending: boolean
  failed: boolean
  loaded: boolean
}
const emptyList = (): ListState => ({ page: 1, items: [], pending: false, failed: false, loaded: false })
const lists = reactive<Record<FollowDirection, ListState>>({
  followers: emptyList(),
  following: emptyList(),
})
const current = computed(() => lists[direction.value])

const TABS: { key: FollowDirection; labelKey: string; icon: IconNode; emptyKey: string; totalKey: string }[] = [
  { key: 'followers', labelKey: 'profile.social.followers', icon: Users, emptyKey: 'profile.social.followersEmpty', totalKey: 'profile.social.followersTotal' },
  { key: 'following', labelKey: 'profile.social.following', icon: Heart, emptyKey: 'profile.social.followingEmpty', totalKey: 'profile.social.followingTotal' },
]
const tab = computed(() => TABS.find(t => t.key === direction.value)!)

function count(key: FollowDirection) {
  return lists[key].meta?.total ?? (key === 'followers' ? props.followerCount : props.followingCount)
}

// Each request remembers which page it was for, so a slow response for a page
// the reader has already left doesn't overwrite the newer one.
async function load(key: FollowDirection, page = lists[key].page) {
  const list = lists[key]
  list.page = page
  list.pending = true
  list.failed = false
  try {
    const res = await follows(props.psnid, key, page)
    if (list.page !== page) return
    list.items = res.data
    list.meta = res.meta
    list.loaded = true
  }
  catch {
    if (list.page === page) list.failed = true
  }
  finally {
    if (list.page === page) list.pending = false
  }
}

// The list area; its parent is the dialog's scroll container.
const body = useTemplateRef<HTMLElement>('body')

function setPage(page: number) {
  if (page === current.value.page) return
  load(direction.value, page)
  body.value?.parentElement?.scrollTo({ top: 0 })
}

// Fresh lists each time the dialog opens (or opens on another profile), then
// load whichever tab is showing, and the other one when first switched to.
watch(open, (value) => {
  if (!value) return
  lists.followers = emptyList()
  lists.following = emptyList()
  load(direction.value, 1)
})
watch(direction, (key) => {
  if (open.value && !lists[key].loaded && !lists[key].pending) load(key, 1)
})

/** `followed_at` is UTC without a zone marker; read it as such. */
function followedDate(value: string) {
  return fmtDate(`${value.replace(' ', 'T')}Z`)
}

// Placeholder rows: varied widths so they read like real PSN IDs.
const SKELETON_WIDTHS = ['w-28', 'w-20', 'w-32', 'w-24', 'w-16', 'w-28', 'w-20']
</script>

<template>
  <Dialog v-model:open="open" size="lg">
    <template #title>
      {{ $t('profile.social.title') }}
      <span class="ml-1 font-normal text-slate-400">· {{ psnid }}</span>
    </template>

    <!-- Direction tabs, pinned atop the scroll area -->
    <div class="sticky top-0 z-10 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-5">
      <div class="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
        <button
          v-for="t in TABS"
          :key="t.key"
          type="button"
          role="tab"
          :aria-selected="direction === t.key"
          class="flex h-9 items-center justify-center gap-2 rounded-md text-sm font-semibold transition"
          :class="direction === t.key
            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70'
            : 'text-slate-500 hover:text-slate-900'"
          @click="direction = t.key"
        >
          <LucideIcon :icon="t.icon" class="size-4" :class="direction === t.key && t.key === 'following' ? 'text-rose-500' : ''" />
          {{ $t(t.labelKey) }}
          <span
            class="rounded-full px-1.5 py-px text-[11px] font-bold tabular-nums"
            :class="direction === t.key ? 'bg-slate-900 text-white' : 'bg-slate-200/80 text-slate-500'"
          >{{ fmt(count(t.key)) }}</span>
        </button>
      </div>
    </div>

    <!-- A steady height, so the dialog doesn't jump between loading, a short
         page and an empty list -->
    <div ref="body" class="min-h-96">
      <!-- First load -->
      <ul v-if="current.pending && !current.items.length" class="divide-y divide-slate-100" aria-hidden="true">
        <li
          v-for="(width, i) in SKELETON_WIDTHS"
          :key="i"
          class="animate-skeleton-in flex items-center gap-3 px-4 py-3 sm:px-5"
          :style="{ animationDelay: `${120 + i * 40}ms` }"
        >
          <div class="skeleton size-10 shrink-0 rounded-full" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="flex items-center gap-1.5">
              <div class="skeleton skeleton-soft h-3 w-4 rounded-sm" />
              <div class="skeleton h-3.5 rounded" :class="width" />
            </div>
            <div class="skeleton skeleton-soft h-2.5 w-24 rounded" />
          </div>
          <div class="skeleton skeleton-soft h-5 w-12 rounded-md" />
        </li>
      </ul>

      <div v-else-if="current.failed && !current.items.length" class="flex min-h-96 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
        <LucideIcon :icon="AlertTriangle" class="size-8 text-rose-400" />
        <p class="text-sm text-slate-500">{{ $t('profile.social.loadFailed') }}</p>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          @click="load(direction)"
        >
          <LucideIcon :icon="RotateCw" class="size-4" />
          {{ $t('common.retry') }}
        </button>
      </div>

      <div v-else-if="!current.items.length" class="flex min-h-96 flex-col items-center justify-center gap-3 px-5 py-10 text-center">
        <span class="grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400">
          <LucideIcon :icon="tab.icon" class="size-5" />
        </span>
        <p class="text-sm text-slate-500">{{ $t(tab.emptyKey) }}</p>
      </div>

      <ul v-else class="divide-y divide-slate-100 transition-opacity" :class="{ 'opacity-50': current.pending }">
        <li v-for="person in current.items" :key="person.profile_id">
          <NuxtLink
            :to="`/p/${encodeURIComponent(person.psnid)}`"
            class="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-5"
            @click="open = false"
          >
            <img
              :src="person.avatar_url"
              :alt="person.psnid"
              loading="lazy"
              class="size-10 shrink-0 rounded-full bg-slate-100 object-cover ring-1 ring-slate-900/5"
            >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <RegionFlag :country="person.country" class="shrink-0 text-sm" />
                <span class="truncate text-sm font-semibold text-slate-900 group-hover:text-sky-600">{{ person.psnid }}</span>
              </div>
              <p class="mt-0.5 text-xs text-slate-400">{{ $t('profile.social.followedAt', { date: followedDate(person.followed_at) }) }}</p>
            </div>
            <span class="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-600">
              Lv {{ person.trophy_level }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>

    <template v-if="current.meta?.total" #footer>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span class="text-xs text-slate-400">{{ $t(tab.totalKey, { count: fmt(current.meta.total) }) }}</span>
        <Pagination
          v-if="current.meta.total_pages > 1"
          :page="current.page"
          :total-pages="current.meta.total_pages"
          @update:page="setPage"
        />
      </div>
    </template>
  </Dialog>
</template>
