<script setup lang="ts">
import { Activity, ArrowRight, CheckCircle2, Clock, Gamepad2, ListOrdered, Loader, RefreshCw, SkipForward, XCircle } from 'lucide'
import type { SyncStatus, SyncStatusInfo } from '~/services/sync'

/**
 * Live progress of one PSN sync job (see `useSyncTracker`): its state, games
 * synced out of the total, what's happening now, and the queue overall. Links
 * to the profile once the job completes.
 */
const props = defineProps<{
  info: SyncStatusInfo
  /** Still polling: show the countdown to the next poll. */
  polling: boolean
  /** A poll is out right now. */
  refreshing: boolean
  /** Seconds until the next poll. */
  countdown: number
}>()

/** Badge / progress-bar / accent styling per lifecycle state. */
const STATUS_META: Record<SyncStatus, { labelKey: string; pill: string; bar: string; text: string; icon: typeof Clock; spin?: boolean }> = {
  queued: { labelKey: 'sync.status.queued', pill: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400', text: 'text-slate-500', icon: Clock },
  calculating: { labelKey: 'sync.status.calculating', pill: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500', text: 'text-amber-600', icon: Loader, spin: true },
  syncing: { labelKey: 'sync.status.syncing', pill: 'bg-sky-50 text-sky-600', bar: 'bg-sky-500', text: 'text-sky-600', icon: Loader, spin: true },
  completed: { labelKey: 'sync.status.completed', pill: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500', text: 'text-emerald-600', icon: CheckCircle2 },
  failed: { labelKey: 'sync.status.failed', pill: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500', text: 'text-rose-600', icon: XCircle },
}
const meta = computed(() => STATUS_META[props.info.status])
const progress = computed(() => Math.max(0, Math.min(100, props.info.progress ?? 0)))
const inProgress = computed(() => props.info.status !== 'completed' && props.info.status !== 'failed')
</script>

<template>
  <section v-if="meta" class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <span class="truncate text-base font-semibold text-slate-900">{{ info.psnid }}</span>
        <span
          class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="meta.pill"
        >
          <LucideIcon :icon="meta.icon" class="size-3.5" :class="{ 'animate-spin': meta.spin }" />
          {{ $t(meta.labelKey) }}
        </span>
      </div>
      <span
        v-if="polling"
        class="inline-flex h-5 shrink-0 items-center gap-1.5 overflow-hidden text-xs font-medium text-slate-400"
      >
        <Transition
          mode="out-in"
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-1 opacity-0"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="-translate-y-1 opacity-0"
        >
          <span v-if="refreshing" key="refreshing" class="inline-flex items-center gap-1.5 text-slate-500">
            <LucideIcon :icon="RefreshCw" class="size-3.5 animate-spin text-slate-400" />
            {{ $t('sync.poll.refreshing') }}
          </span>
          <span v-else key="countdown" class="inline-flex items-center gap-1.5">
            <span class="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            {{ $t('sync.poll.countdown', { seconds: countdown }) }}
          </span>
        </Transition>
      </span>
    </div>

    <!-- Wizard animation while a sync is running -->
    <div v-if="inProgress" class="my-4 flex h-44 items-center justify-center overflow-hidden sm:my-6">
      <LoaderWizard class="scale-[0.7]" />
    </div>

    <!-- Focal metric: synced / total + progress -->
    <div :class="inProgress ? '' : 'mt-5'">
      <div class="flex items-end justify-between gap-3">
        <div v-if="info.total > 0" class="flex items-baseline gap-1.5">
          <span class="text-2xl font-bold tabular-nums text-slate-900">
            <AnimatedNumber :value="info.completed" />
          </span>
          <span class="text-sm text-slate-400">
            /
            <AnimatedNumber :value="info.total" />
            {{ $t('sync.gamesUnit') }}
          </span>
        </div>
        <span v-else class="text-sm text-slate-400">
          {{ info.status === 'queued' ? $t('sync.waitingWorker') : $t('sync.calculating') }}
        </span>
        <span class="text-2xl font-bold tabular-nums" :class="meta.text">
          <AnimatedNumber :value="progress" />%
        </span>
      </div>
      <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="meta.bar"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- Contextual line (queue position / current game) -->
    <p
      v-if="info.status === 'queued' && info.queue_ahead != null"
      class="mt-3 flex items-center gap-2 text-sm text-slate-500"
    >
      <LucideIcon :icon="ListOrdered" class="size-4 text-slate-400" />
      <i18n-t keypath="sync.queueAhead" scope="global" tag="span" :plural="info.queue_ahead">
        <template #badge>
          <span class="font-semibold text-slate-700">{{ info.queue_ahead }}</span>
        </template>
      </i18n-t>
    </p>
    <p
      v-else-if="info.status === 'syncing' && info.current_game"
      class="mt-3 flex min-w-0 items-center gap-2 text-sm text-slate-500"
    >
      <LucideIcon :icon="Gamepad2" class="size-4 shrink-0 text-slate-400" />
      <span class="shrink-0">{{ $t('sync.currentGame') }}</span>
      <span class="truncate font-mono text-xs text-slate-700">{{ info.current_game }}</span>
    </p>

    <!-- Anomalies: only surfaced when they actually occur -->
    <div v-if="info.failed > 0 || info.skipped > 0" class="mt-3 flex flex-wrap gap-2">
      <span
        v-if="info.failed > 0"
        class="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600"
      >
        <LucideIcon :icon="XCircle" class="size-3.5" />
        {{ $t('sync.failedCount', { count: info.failed }) }}
      </span>
      <span
        v-if="info.skipped > 0"
        class="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600"
      >
        <LucideIcon :icon="SkipForward" class="size-3.5" />
        {{ $t('sync.skippedCount', { count: info.skipped }) }}
      </span>
    </div>

    <!-- Failure reason -->
    <p
      v-if="info.status === 'failed' && info.error"
      class="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700"
    >
      {{ info.error }}
    </p>

    <!-- Done: go to the profile -->
    <NuxtLink
      v-if="info.status === 'completed'"
      :to="`/p/${encodeURIComponent(info.psnid)}`"
      class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-sm shadow-slate-900/30 transition hover:bg-slate-800 active:bg-slate-950"
    >
      {{ $t('sync.goToProfile') }}
      <LucideIcon :icon="ArrowRight" class="size-4" />
    </NuxtLink>

    <!-- Queue overview + last-updated -->
    <hr class="mt-5 border-slate-100" />
    <div class="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-slate-400">
      <span class="inline-flex items-center gap-1.5">
        <LucideIcon :icon="Activity" class="size-3.5" />
        <i18n-t keypath="sync.queueOverview" scope="global" tag="span">
          <template #active>
            <span class="font-semibold tabular-nums text-sky-600">{{ info.active_queue_count }}</span>
          </template>
          <template #waiting>
            <span class="font-semibold tabular-nums text-slate-600">{{ info.waiting_queue_count }}</span>
          </template>
        </i18n-t>
      </span>
      <span v-if="info.updated_at">{{ $t('sync.updatedAt', { time: fmtDateTime(info.updated_at) }) }}</span>
    </div>
  </section>
</template>
