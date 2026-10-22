<script setup lang="ts">
import {
  ArrowUpDown, Award, ChevronDown, ChevronRight, ChevronUp, Clock,
  Milestone, Trophy,
} from 'lucide'
import type { ProfileMilestone } from '~/services/profile'

const props = defineProps<{ psnid: string }>()
const { t } = useI18n()

const LIMIT = 30
const ascending = ref(false)
const expanded = ref(false)

// Lazy and not awaited: the tab renders at once with a placeholder timeline
// and fills in when the list lands. The server still fetches it before rendering.
const { data: milestones, status, error } = useApiFetch<ProfileMilestone[]>(
  () => `/profile/${props.psnid}/milestones`,
  { lazy: true },
)
const pending = useFetchPending(status)

// Placeholder cards: varied widths so they read like real trophy names.
const SKELETON_ROWS = [
  { name: '48%', set: '34%', badge: 'w-16' },
  { name: '36%', set: '44%', badge: 'w-20' },
  { name: '56%', set: '30%', badge: 'w-16' },
  { name: '42%', set: '38%', badge: 'w-24' },
]

// `earned_at` may arrive as a number (epoch seconds) or an ISO string; coerce
// to milliseconds so the comparison is numeric (raw string subtraction yields
// NaN, which silently no-ops the sort and makes the toggle look broken).
function earnedMs(item: ProfileMilestone): number {
  const v = item.earned_at as number | string
  const t = typeof v === 'number' ? v * 1000 : new Date(v).getTime()
  return Number.isNaN(t) ? 0 : t
}

const sorted = computed(() =>
  [...(milestones.value ?? [])].sort((a, b) =>
    ascending.value ? earnedMs(a) - earnedMs(b) : earnedMs(b) - earnedMs(a),
  ),
)
const visibleMilestones = computed(() =>
  expanded.value ? sorted.value : sorted.value.slice(0, LIMIT),
)
const hiddenCount = computed(() => Math.max(sorted.value.length - LIMIT, 0))

function milestoneMeta(item: ProfileMilestone) {
  return item.type === 'platinum'
    ? {
        label: t('profile.milestones.nthPlatinum', { n: fmt(Number(item.index)) }),
        icon: Award,
        iconClass: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
        badgeClass: 'border-sky-100 bg-sky-50/80 text-sky-700',
      }
    : {
        label: t('profile.milestones.nthTrophy', { n: fmt(Number(item.index)) }),
        icon: Trophy,
        iconClass: 'bg-slate-800 text-white ring-slate-700',
        badgeClass: 'border-stone-200/80 bg-stone-100/80 text-stone-600',
      }
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
      <div>
        <h2 class="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <LucideIcon :icon="Milestone" class="size-4 text-slate-500" />
          {{ $t('profile.milestones.title') }}
        </h2>
        <p class="mt-0.5 text-xs text-slate-400">{{ $t('profile.milestones.subtitle') }}</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        @click="ascending = !ascending"
      >
        <LucideIcon :icon="ArrowUpDown" class="size-3.5" />
        {{ ascending ? $t('common.sortAsc') : $t('common.sortDesc') }}
      </button>
    </div>

    <!-- Placeholder timeline: the rail, its nodes, and a card per milestone -->
    <div v-if="pending && !milestones" class="relative px-4 py-2 sm:px-5" aria-hidden="true">
      <span class="absolute bottom-14 left-9 top-14 w-px bg-slate-200 sm:left-10" />
      <div
        v-for="(row, i) in SKELETON_ROWS"
        :key="i"
        class="animate-skeleton-in relative flex gap-3 py-3"
        :style="{ animationDelay: `${120 + i * 60}ms` }"
      >
        <div class="relative flex w-10 shrink-0 items-center justify-center">
          <span class="relative z-10 grid size-10 place-items-center rounded-full bg-white ring-1 ring-inset ring-slate-200">
            <span class="skeleton skeleton-soft size-4.5 rounded-full" />
          </span>
        </div>
        <div class="min-w-0 flex-1 overflow-hidden rounded-lg border border-slate-100 bg-slate-50/60">
          <div class="flex items-center border-b border-slate-100 px-3 py-2">
            <div class="skeleton skeleton-soft h-3 rounded" :class="row.badge" />
          </div>
          <div class="flex items-center gap-3 px-3 py-2.5">
            <div class="skeleton size-12 shrink-0 rounded-lg" />
            <div class="min-w-0 flex-1">
              <div class="flex h-5 items-center"><div class="skeleton h-3.5 rounded" :style="{ width: row.name }" /></div>
              <div class="skeleton skeleton-soft mt-1.5 h-3 rounded" :style="{ width: row.set }" />
            </div>
            <div class="skeleton skeleton-soft hidden h-3 w-28 shrink-0 rounded sm:block" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="px-6 py-16 text-center text-sm text-slate-500">
      {{ $t('profile.milestones.loadFailed') }}
    </div>

    <div v-else-if="!sorted.length" class="px-6 py-16 text-center">
      <div class="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400">
        <LucideIcon :icon="Milestone" class="size-6" />
      </div>
      <p class="mt-3 text-sm text-slate-500">{{ $t('profile.milestones.empty') }}</p>
    </div>

    <div v-else class="relative px-4 py-2 sm:px-5">
      <span v-if="visibleMilestones.length > 1" class="absolute bottom-14 left-9 top-14 w-px bg-slate-200 sm:left-10" />
      <TransitionGroup
        tag="div"
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        leave-active-class="absolute transition duration-300 ease-out"
        leave-to-class="opacity-0"
        move-class="transition-transform duration-500 ease-in-out"
      >
      <a
        v-for="item in visibleMilestones"
        :key="`${item.type}-${item.index}-${item.trophy_id}`"
        :href="`/trophies/${item.trophy_set_id}`"
        class="group relative flex gap-3 py-3"
        @click="openTrophyWithProgress($event, item.trophy_set_id, psnid)"
      >
        <div class="relative flex w-10 shrink-0 items-center justify-center">
          <span
            class="relative z-10 grid size-10 shrink-0 place-items-center rounded-full ring-1 ring-inset"
            :class="milestoneMeta(item).iconClass"
          >
            <LucideIcon :icon="milestoneMeta(item).icon" class="size-4.5" />
          </span>
        </div>

        <div class="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-slate-100 bg-slate-50/60 transition group-hover:border-slate-200 group-hover:bg-slate-50">
          <div class="flex items-center gap-1 border-b px-3 py-1.5 text-[11px] font-semibold" :class="milestoneMeta(item).badgeClass">
            <LucideIcon :icon="milestoneMeta(item).icon" class="size-3" />
            {{ milestoneMeta(item).label }}
          </div>
          <div class="flex items-center gap-3 px-3 py-2.5">
            <img
              :src="item.trophyIconUrl"
              :alt="item.trophyName"
              class="size-12 shrink-0 rounded-lg bg-white object-cover shadow-sm"
            />
            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 text-sm font-semibold text-slate-800 sm:truncate">{{ item.trophyName }}</p>
              <p class="mt-0.5 truncate text-xs text-slate-400">{{ item.trophySetName }}</p>
              <span class="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400 tabular-nums sm:hidden">
                <LucideIcon :icon="Clock" class="size-3" />
                <LocalTime :value="item.earned_at" />
              </span>
            </div>
            <span class="ml-auto hidden shrink-0 items-center gap-1 text-xs text-slate-400 tabular-nums sm:inline-flex">
              <LucideIcon :icon="Clock" class="size-3.5" />
              <LocalTime :value="item.earned_at" />
            </span>
            <LucideIcon :icon="ChevronRight" class="size-4 shrink-0 text-slate-300 transition group-hover:text-slate-500 max-sm:hidden" />
          </div>
        </div>
      </a>
      </TransitionGroup>
    </div>

    <div v-if="hiddenCount" class="border-t border-slate-100 px-4 py-3 text-center sm:px-5">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        @click="expanded = !expanded"
      >
        <LucideIcon :icon="expanded ? ChevronUp : ChevronDown" class="size-4" />
        {{ expanded
          ? $t('profile.milestones.collapse')
          : $t('profile.milestones.showMore', { count: hiddenCount }) }}
      </button>
    </div>
  </div>
</template>
