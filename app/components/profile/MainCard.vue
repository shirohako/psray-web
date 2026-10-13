<script setup lang="ts">
import { Check, ChevronDown, Gamepad2, Milestone, Trophy, type IconNode } from 'lucide'
import { parseProfileQuery, profileRouteQuery, type ProfileQueryState, type ProfileTab } from '~/utils/profileQuery'

const props = defineProps<{ psnid: string }>()

// Tabbed main card. Each tab renders its own content component; add new tabs
// here as their components land.
type TabKey = ProfileTab
const tabs: { key: TabKey; labelKey: string; icon: IconNode }[] = [
  { key: 'recent', labelKey: 'profile.tabs.recent', icon: Gamepad2 },
  { key: 'trophies', labelKey: 'profile.tabs.trophies', icon: Trophy },
  { key: 'milestones', labelKey: 'profile.tabs.milestones', icon: Milestone },
]
type TabItem = (typeof tabs)[number]

// Each tab's content component fetches its own data lazily, so a tab opens at
// once and shows its own placeholder rows until that data lands.
// Tab, page and search live in the URL so Back/Forward and shared links
// restore the same view. They reach the tab components as props, so a tab that
// is fading out keeps its old values instead of refetching.
const route = useRoute()
const router = useRouter()
const state = computed(() => parseProfileQuery(route.query))
const activeTab = computed(() => state.value.tab)
const defaultTab = tabs[0] as TabItem
const activeTabItem = computed<TabItem>(() => tabs.find(tab => tab.key === activeTab.value) ?? defaultTab)

/**
 * Tab and page changes push a history entry so Back returns to them; a new
 * search replaces it. Anything else in the query (e.g. `lang`) is kept.
 */
function navigate(next: Partial<ProfileQueryState>, mode: 'push' | 'replace' = 'push') {
  const { tab: _tab, page: _page, q: _q, ...rest } = route.query
  const location = {
    query: {
      ...rest,
      ...profileRouteQuery({
        tab: next.tab ?? state.value.tab,
        page: next.page ?? 1,
        q: next.q ?? (next.tab ? '' : state.value.q),
      }),
    },
  }
  return mode === 'push' ? router.push(location) : router.replace(location)
}

function selectTab(tab: TabKey) {
  if (tab !== activeTab.value) navigate({ tab })
}
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <!-- Tab bar -->
    <div class="border-b border-slate-200 px-3 py-2.5 sm:hidden">
      <DropdownMenu
        align="left"
        panel-class="!w-[calc(100vw-3.5rem)] !min-w-0 !rounded-lg !border-slate-200 !py-1.5 !shadow-xl !shadow-slate-900/10"
        class="inline-flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50"
      >
        <span class="inline-flex min-w-0 items-center gap-2">
          <LucideIcon :icon="activeTabItem.icon" class="size-4 shrink-0 text-slate-500" stroke-width="2" />
          <span class="truncate">{{ $t(activeTabItem.labelKey) }}</span>
        </span>
        <LucideIcon :icon="ChevronDown" class="size-4 shrink-0 text-slate-400" />

        <template #menu="{ close }">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition"
            :class="activeTab === tab.key
              ? 'bg-slate-100 text-slate-900'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'"
            @click="selectTab(tab.key); close()"
          >
            <LucideIcon
              :icon="tab.icon"
              class="size-4 shrink-0"
              :class="activeTab === tab.key ? 'text-slate-700' : 'text-slate-400'"
              stroke-width="2"
            />
            <span class="min-w-0 flex-1">{{ $t(tab.labelKey) }}</span>
            <LucideIcon
              v-if="activeTab === tab.key"
              :icon="Check"
              class="size-4 shrink-0 text-slate-500"
              stroke-width="2"
            />
          </button>
        </template>
      </DropdownMenu>
    </div>

    <div class="hidden gap-1 border-b border-slate-200 px-5 py-2.5 sm:flex">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        @click="selectTab(tab.key)"
        class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition"
        :class="activeTab === tab.key
          ? 'bg-slate-900 text-white'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'"
      >
        <LucideIcon :icon="tab.icon" class="size-4 shrink-0" stroke-width="2" />
        {{ $t(tab.labelKey) }}
      </button>
    </div>

    <!-- Tab content, faded between tabs. Each tab draws its own placeholders on
         first load; pagination within a tab keeps its list and dims it. -->
    <Transition name="tab-fade" mode="out-in">
      <ProfileRecentlyPlayed
        v-if="activeTab === 'recent'"
        :psnid="props.psnid"
        :page="state.page"
        :query="state.q"
        @update:page="navigate({ page: $event })"
        @search="navigate({ q: $event }, 'replace')"
      />
      <ProfileEarnedTrophies
        v-else-if="activeTab === 'trophies'"
        :psnid="props.psnid"
        :page="state.page"
        @update:page="navigate({ page: $event })"
      />
      <ProfileMilestones v-else :psnid="props.psnid" />
    </Transition>
  </div>
</template>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.18s ease;
}
.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
}
</style>
