<script setup lang="ts">
import { MessageSquarePlus, MessagesSquare } from 'lucide'
import type { FeedbackItem, FeedbackPageMeta } from '~/types/feedback'
import type { FeedbackListState, GuestFeedbackEntry } from '~/utils/feedback'

const { t } = useI18n()
const { loggedIn } = useAuth()
useSeo({ title: () => t('seo.feedback.title'), description: () => t('seo.feedback.description'), noindex: true })

const route = useRoute()
const router = useRouter()
// Tab, filters and page live in the URL so Back/Forward and shared links restore the same listing.
const state = computed(() => parseFeedbackQuery(route.query))
// Guests have no account to list by: their "Mine" tab reads what this browser remembers.
const guestMine = computed(() => state.value.mine && !loggedIn.value)

const requestQuery = computed(() => ({
  ...(state.value.type ? { type: state.value.type } : {}),
  ...(state.value.status ? { status: state.value.status } : {}),
  ...(state.value.mine && loggedIn.value ? { mine: 1 } : {}),
  ...(state.value.page > 1 ? { page: state.value.page } : {}),
}))
const { data: response, status, error, refresh } = await useApiFetchRaw<FeedbackItem[], FeedbackPageMeta>('/feedback', {
  query: requestQuery,
  lazy: true,
})

const items = computed(() => response.value?.data ?? [])
const meta = computed(() => response.value?.meta)
const totalPages = computed(() => meta.value?.total_pages ?? 1)
const pending = useFetchPending(status)
const rangeStart = computed(() => items.value.length ? ((meta.value?.page ?? 1) - 1) * (meta.value?.per_page ?? 20) + 1 : 0)
const rangeEnd = computed(() => items.value.length ? rangeStart.value + items.value.length - 1 : 0)
const filtered = computed(() => state.value.type !== null || state.value.status !== null)

// Read after mount: the server can't see this browser's storage.
const guestEntries = ref<GuestFeedbackEntry[]>([])
const storageRead = ref(false)
onMounted(() => {
  guestEntries.value = readGuestFeedback(feedbackStorage())
  storageRead.value = true
})

/** Tab and filter changes replace the history entry and go back to page 1; page changes push one. */
function navigate(next: Partial<FeedbackListState>) {
  const location = {
    query: {
      ...(route.query.lang ? { lang: route.query.lang } : {}),
      ...feedbackRouteQuery({ ...state.value, page: 1, ...next }),
    },
  }
  return next.page === undefined ? router.replace(location) : router.push(location)
}

function changePage(value: number) {
  navigate({ page: value })
  document.getElementById('feedback-results')?.scrollIntoView({ block: 'start' })
}

const TABS = [
  { mine: false, labelKey: 'feedback.list.all' },
  { mine: true, labelKey: 'feedback.list.mine' },
]

const composerOpen = ref(false)
function onCreated() {
  refresh()
  guestEntries.value = readGuestFeedback(feedbackStorage())
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader :icon="MessagesSquare" :title="$t('feedback.title')" :description="$t('feedback.description')">
      <button
        type="button"
        class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        @click="composerOpen = true"
      >
        <LucideIcon :icon="MessageSquarePlus" class="size-4" />
        {{ $t('feedback.write') }}
      </button>
    </PageHeader>

    <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div class="inline-flex self-start rounded-lg bg-slate-100 p-0.5" role="tablist" :aria-label="$t('feedback.title')">
          <button
            v-for="tab in TABS"
            :key="tab.labelKey"
            type="button"
            role="tab"
            :aria-selected="state.mine === tab.mine"
            class="rounded-md px-3 py-1.5 text-xs font-semibold transition"
            :class="state.mine === tab.mine ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="navigate({ mine: tab.mine })"
          >
            {{ $t(tab.labelKey) }}
          </button>
        </div>
        <div v-if="!guestMine" class="flex flex-wrap items-center gap-2">
          <SelectMenu
            :model-value="state.type"
            :options="[{ value: null, label: $t('feedback.list.allTypes') }, ...FEEDBACK_TYPES.map(value => ({ value, label: $t(`feedback.types.${value}`) }))]"
            size="sm"
            :highlight="!!state.type"
            :aria-label="$t('feedback.list.type')"
            @update:model-value="navigate({ type: $event })"
          />
          <SelectMenu
            :model-value="state.status"
            :options="[{ value: null, label: $t('feedback.list.allStatuses') }, ...FEEDBACK_STATUSES.map(value => ({ value, label: $t(`feedback.statuses.${value}`) }))]"
            size="sm"
            :highlight="!!state.status"
            :aria-label="$t('feedback.list.status')"
            @update:model-value="navigate({ status: $event })"
          />
        </div>
      </div>

      <!-- A guest's own submissions, as remembered by this browser -->
      <template v-if="guestMine">
        <p class="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] leading-5 text-slate-500 sm:px-5">{{ $t('feedback.list.guestMineHint') }}</p>
        <div v-if="!storageRead" class="space-y-3 p-4 sm:px-5" aria-hidden="true">
          <div v-for="i in 3" :key="i" class="skeleton skeleton-soft h-4 rounded" />
        </div>
        <ul v-else-if="guestEntries.length" class="divide-y divide-slate-100">
          <li v-for="entry in guestEntries" :key="entry.id">
            <NuxtLink :to="`/feedback/${entry.id}`" class="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-5">
              <span class="min-w-0 truncate text-sm text-slate-700">{{ entry.excerpt }}</span>
              <time :datetime="entry.created_at" class="shrink-0 whitespace-nowrap text-xs tabular-nums text-slate-400">{{ fmtDateTime(entry.created_at) }}</time>
            </NuxtLink>
          </li>
        </ul>
        <div v-else class="px-6 py-16 text-center">
          <h3 class="text-sm font-semibold text-slate-900">{{ $t('feedback.list.emptyMine') }}</h3>
          <button type="button" class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="composerOpen = true">
            {{ $t('feedback.write') }}
          </button>
        </div>
      </template>

      <section v-else id="feedback-results" class="scroll-mt-20" :aria-label="$t('feedback.title')" :aria-busy="pending">
        <div v-if="error && !pending" class="px-6 py-16 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-rose-50 text-rose-400"><LucideIcon :icon="MessagesSquare" class="size-5" /></span>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">{{ $t('feedback.list.loadError') }}</h3>
          <button class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="refresh()">{{ $t('common.retry') }}</button>
        </div>

        <div v-else-if="items.length" class="divide-y divide-slate-100 transition-opacity" :class="pending ? 'opacity-55' : ''">
          <FeedbackListItem v-for="item in items" :key="item.id" :item="item" />
        </div>

        <div v-else-if="pending" class="animate-skeleton-in divide-y divide-slate-100" aria-hidden="true">
          <div v-for="i in 4" :key="i" class="space-y-3 px-4 py-4 sm:px-5">
            <div class="flex items-center gap-2.5">
              <div class="skeleton size-8 rounded-full" />
              <div class="skeleton skeleton-soft h-3 w-28 rounded" />
            </div>
            <div class="skeleton skeleton-soft h-3 w-full rounded" />
            <div class="skeleton skeleton-soft h-3 w-2/3 rounded" />
          </div>
        </div>

        <div v-else class="px-6 py-16 text-center">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><LucideIcon :icon="MessagesSquare" class="size-5" /></span>
          <h3 class="mt-4 text-sm font-semibold text-slate-900">
            {{ $t(filtered ? 'feedback.list.emptyFiltered' : state.mine ? 'feedback.list.emptyMine' : 'feedback.list.empty') }}
          </h3>
          <button
            v-if="filtered"
            class="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            @click="navigate({ type: null, status: null })"
          >
            {{ $t('feedback.list.reset') }}
          </button>
          <button v-else class="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700" @click="composerOpen = true">
            {{ $t('feedback.write') }}
          </button>
        </div>

        <div v-if="meta && !error && items.length" class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4">
          <p role="status" class="text-[11px] text-slate-400">{{ $t('feedback.list.range', { start: rangeStart, end: rangeEnd, total: meta.total }) }}</p>
          <Pagination v-if="totalPages > 1" :page="state.page" :total-pages="totalPages" :siblings="2" @update:page="changePage" />
        </div>
      </section>
    </div>

    <FeedbackComposerDialog v-model:open="composerOpen" @created="onCreated" />
  </div>
</template>
