<script setup lang="ts">
import { ChevronDown } from 'lucide'
import type { PlayedTrophySet } from '~/services/profile'
import { ApiError } from '~/utils/ApiError'
import { recentlyPlayedPath } from '~/utils/recentlyPlayedSearch'

const props = defineProps<{ psnid: string; page: number; query: string }>()
const emit = defineEmits<{ 'update:page': [page: number]; 'search': [query: string] }>()

interface PageMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

const toggleIconTouched = ref(false)
const listEl = ref<HTMLElement | null>(null)
const { profileGameDensity } = usePreferences()

// Page and the submitted query are read by the URL getter, so either change
// re-fetches while edits in the input remain local until the form is submitted.
// Lazy and not awaited: the tab renders at once with placeholder rows and fills
// in when the list lands. The server still fetches it before rendering.
const { data: res, status, error, refresh } = useApiFetchRaw<PlayedTrophySet[], PageMeta>(
  () => recentlyPlayedPath(props.psnid, props.page, props.query),
  { lazy: true },
)
const pending = useFetchPending(status)

const recent = computed(() => res.value?.data ?? [])
const totalPages = computed(() => res.value?.meta?.total_pages ?? 1)
const canCollapse = computed(() => recent.value.length > 4)
const isSearching = computed(() => Boolean(props.query))
const apiValidationFailed = computed(() => error.value instanceof ApiError && error.value.status === 422)

// Phones fold a long list down to its first rows, animating the height as it
// opens and closes. Denser rows fold shorter.
const collapsedListHeight = computed(() => ({
  dense: 280,
  compact: 340,
  standard: 400,
})[profileGameDensity.value])
const { expanded, ready: animatedReady, sync: syncListHeight } = useListFold(listEl, canCollapse, collapsedListHeight)

/** Change page, then bring the first record into view (the bottom pager leaves it far above). */
function changePage(value: number) {
  emit('update:page', value)
  revealTop(listEl.value)
}

// The search box mirrors the submitted query, so it empties along with it.
function clearSearch() {
  emit('search', '')
}

function toggleExpanded() {
  toggleIconTouched.value = true
  expanded.value = !expanded.value
}

watch(() => props.psnid, () => {
  expanded.value = false
})

watch([recent, canCollapse, profileGameDensity], async () => {
  await nextTick()
  syncListHeight()
})
</script>

<template>
  <div>
  <ProfileRecentlyPlayedSearch :query="query" :pending="pending" @search="emit('search', $event)" />

  <!-- Top pager (only when the current page is long enough to be worth it) -->
  <div
    v-if="totalPages > 1 && recent.length > 5"
    class="border-b border-slate-100 px-4 py-2.5"
  >
    <Pagination :page="page" :total-pages="totalPages" :siblings="2" @update:page="changePage" />
  </div>

  <!-- Loading (initial only — on page change we keep the list visible) -->
  <ProfileRecentlyPlayedSkeleton v-if="pending && !recent.length" />

  <!-- Error / empty -->
  <div v-else-if="error && !recent.length" class="px-6 py-16 text-center">
    <p class="text-sm text-slate-500">
      {{ apiValidationFailed ? $t('profile.recent.invalidSearch') : $t('profile.recent.loadFailed') }}
    </p>
    <button type="button" class="mt-3 text-xs font-semibold text-slate-700 underline underline-offset-4" @click="refresh()">
      {{ $t('common.retry') }}
    </button>
  </div>

  <div v-else-if="!recent.length" class="px-6 py-20 text-center text-sm text-slate-500">
    <p>{{ isSearching ? $t('profile.recent.noResults') : $t('profile.recent.empty') }}</p>
    <button v-if="isSearching" type="button" class="mt-3 text-xs font-semibold text-slate-700 underline underline-offset-4" @click="clearSearch">
      {{ $t('profile.recent.clearSearch') }}
    </button>
  </div>

  <!-- List -->
  <div v-else class="relative">
    <div
      ref="listEl"
      class="divide-y divide-slate-100 max-sm:overflow-hidden"
      :class="[
        { 'opacity-50': pending },
        !animatedReady && canCollapse && !expanded ? 'max-sm:max-h-100' : '',
      ]"
    >
      <ProfileRecentlyPlayedItem v-for="g in recent" :key="g.id" :game="g" :psnid="psnid" />
    </div>

    <div
      v-if="canCollapse"
      class="sm:hidden"
      :class="expanded ? 'border-t border-slate-100 bg-white px-4 py-3' : 'pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-white via-white/95 to-white/0 px-4 pb-4 pt-16'"
    >
      <button
        type="button"
        class="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition active:scale-[0.99]"
        @click="toggleExpanded"
      >
        {{ expanded ? $t('profile.recent.collapse') : $t('profile.recent.expand') }}
        <span
          class="profile-toggle-chevron inline-flex size-4 items-center justify-center"
          :class="[
            expanded ? 'is-expanded' : 'is-collapsed',
            toggleIconTouched ? 'is-animated' : '',
          ]"
        >
          <LucideIcon :icon="ChevronDown" class="size-4" />
        </span>
      </button>
    </div>
  </div>

  <!-- Bottom pager -->
  <div
    v-if="totalPages > 1"
    class="border-t border-slate-100 px-4 py-3"
    :class="canCollapse && !expanded ? 'max-sm:hidden' : ''"
  >
    <Pagination :page="page" :total-pages="totalPages" :siblings="2" @update:page="changePage" />
  </div>
  </div>
</template>

<style scoped>
.profile-toggle-chevron {
  transform: rotate(0deg);
  transform-origin: center;
  will-change: transform;
}

.profile-toggle-chevron.is-expanded {
  transform: rotate(180deg);
}

.profile-toggle-chevron.is-animated.is-expanded {
  animation: profile-toggle-chevron-expand 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.profile-toggle-chevron.is-animated.is-collapsed {
  animation: profile-toggle-chevron-collapse 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes profile-toggle-chevron-expand {
  0% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
  38% {
    transform: translateY(3px) rotate(130deg) scale(1.24);
  }
  62% {
    transform: translateY(-1px) rotate(205deg) scale(0.92);
  }
  100% {
    transform: translateY(0) rotate(180deg) scale(1);
  }
}

@keyframes profile-toggle-chevron-collapse {
  0% {
    transform: translateY(0) rotate(180deg) scale(1);
  }
  38% {
    transform: translateY(-3px) rotate(48deg) scale(1.24);
  }
  62% {
    transform: translateY(1px) rotate(-18deg) scale(0.92);
  }
  100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-toggle-chevron.is-animated.is-expanded,
  .profile-toggle-chevron.is-animated.is-collapsed {
    animation: none;
  }
}
</style>
