<script setup lang="ts">
import { Ban, House, Loader, RefreshCw, Trophy, UserSearch, type IconNode } from 'lucide'
import { ApiError } from '~/utils/ApiError'
import { useSync } from '~/services/sync'

/**
 * Stands in for a profile that can't be shown.
 *
 * - `missing` (404 `USER_NOT_FOUND`): nothing on file for this PSN ID, either
 *   never synced or the owner deleted their account. Offers to sync it.
 * - `banned` (410 `USER_BANNED`): permanently suspended, data deleted. No sync,
 *   since the backend refuses it with `ACCOUNT_TERMINATED`.
 */
const props = defineProps<{ kind: 'missing' | 'banned'; psnid: string }>()

const { t } = useI18n()
const sync = useSync()

const KINDS: Record<typeof props.kind, { icon: IconNode; badge: string; glow: string }> = {
  missing: {
    icon: UserSearch,
    badge: 'bg-sky-50 text-sky-700 ring-sky-200/80',
    glow: 'bg-sky-200/50',
  },
  banned: {
    icon: Ban,
    badge: 'bg-rose-50 text-rose-700 ring-rose-200/80',
    glow: 'bg-rose-200/50',
  },
}
const look = computed(() => KINDS[props.kind])

const STEPS = ['submit', 'fetch', 'ready'] as const

const submitting = ref(false)
const errorText = ref('')

/**
 * Enqueue a sync, then hand over to the sync page, which picks the running job
 * up and shows its progress. A job that is already running counts as success.
 */
async function startSync() {
  if (submitting.value) return
  errorText.value = ''
  submitting.value = true
  const target = { path: '/sync', query: { psnid: props.psnid } }
  try {
    await sync.submit(props.psnid)
    await navigateTo(target)
  }
  catch (error) {
    if (error instanceof ApiError && error.code === 'SYNC_IN_PROGRESS') {
      await navigateTo(target)
      return
    }
    errorText.value = syncErrorText(error)
  }
  finally {
    submitting.value = false
  }
}

function syncErrorText(error: unknown) {
  if (!(error instanceof ApiError)) return t('sync.errors.submitRetry')
  switch (error.code) {
    case 'PSN_PROFILE_FAILED': return t('profile.missing.errors.notOnPsn')
    case 'PSN_PROFILE_PRIVATE': return t('profile.missing.errors.private')
    case 'ACCOUNT_TERMINATED': return t('profile.missing.errors.banned')
    case 'SYNC_WORKER_UNAVAILABLE': return t('sync.errors.workerUnavailable')
    default: return error.message || t('sync.errors.submitRetry')
  }
}
</script>

<template>
  <section class="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <!-- Backdrop: a dot grid fading out from the top, under a soft colour glow -->
    <div class="dot-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
    <div
      class="pointer-events-none absolute -top-32 left-1/2 -z-10 h-72 w-xl max-w-full -translate-x-1/2 rounded-full blur-3xl"
      :class="look.glow"
      aria-hidden="true"
    />

    <div class="mx-auto flex max-w-xl flex-col items-center px-5 py-14 text-center sm:py-20">
      <span
        class="animate-rise inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset"
        :class="look.badge"
      >
        <LucideIcon :icon="look.icon" class="size-3.5" />
        {{ $t(`profile.${kind}.badge`) }}
      </span>

      <h1 class="animate-rise mt-3 text-2xl font-bold tracking-tight text-balance text-slate-900 [animation-delay:100ms] sm:text-3xl">
        <i18n-t v-if="kind === 'missing'" keypath="profile.missing.title" scope="global" tag="span">
          <template #psnid>
            <span class="break-all font-mono text-[0.9em] text-slate-700">{{ psnid }}</span>
          </template>
        </i18n-t>
        <template v-else>{{ $t('profile.banned.title') }}</template>
      </h1>
      <p v-if="kind === 'banned'" class="animate-rise mt-1.5 break-all font-mono text-sm text-slate-400 [animation-delay:120ms]">{{ psnid }}</p>
      <p class="animate-rise mt-3 max-w-md text-sm leading-6 text-pretty text-slate-500 [animation-delay:140ms]">
        {{ $t(`profile.${kind}.description`) }}
      </p>

      <template v-if="kind === 'missing'">
        <!-- What a sync does, in three steps -->
        <ol class="animate-rise mt-9 grid w-full grid-cols-3 [animation-delay:180ms]">
          <li v-for="(step, i) in STEPS" :key="step" class="relative flex flex-col items-center gap-2 px-1">
            <span
              v-if="i"
              class="absolute right-[calc(50%+1.125rem)] top-3.5 h-px w-[calc(100%-2.25rem)] bg-linear-to-r from-slate-200 to-slate-300"
              aria-hidden="true"
            />
            <span class="relative grid size-7 place-items-center rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">{{ i + 1 }}</span>
            <span class="text-xs font-medium leading-4 text-slate-500">{{ $t(`profile.missing.steps.${step}`) }}</span>
          </li>
        </ol>

        <div class="animate-rise mt-9 flex flex-wrap items-center justify-center gap-2 [animation-delay:220ms]">
          <button
            type="button"
            :disabled="submitting"
            class="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-slate-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
            @click="startSync"
          >
            <LucideIcon :icon="submitting ? Loader : RefreshCw" class="size-4" :class="{ 'animate-spin': submitting }" />
            {{ submitting ? $t('profile.missing.submitting') : $t('profile.missing.cta') }}
          </button>
          <NuxtLink
            to="/leaderboard"
            class="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <LucideIcon :icon="Trophy" class="size-4 text-slate-400" />
            {{ $t('profile.missing.browse') }}
          </NuxtLink>
        </div>
        <p v-if="errorText" role="alert" class="mt-4 w-full max-w-md rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">
          {{ errorText }}
        </p>
        <p v-else class="mt-4 text-xs text-slate-400">{{ $t('profile.missing.hint') }}</p>
      </template>

      <NuxtLink
        v-else
        to="/"
        class="animate-rise mt-9 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition [animation-delay:180ms] hover:border-slate-300 hover:bg-slate-50"
      >
        <LucideIcon :icon="House" class="size-4 text-slate-400" />
        {{ $t('common.backHome') }}
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.dot-grid {
  background-image: radial-gradient(circle at 1px 1px, var(--color-slate-200) 1px, transparent 0);
  background-size: 20px 20px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent);
}
</style>
