import { useSync, type SyncStatusInfo } from '~/services/sync'
import { ApiError } from '~/utils/ApiError'

const POLL_INTERVAL_MS = 5000
// The "refreshing" beat lasts at least this long, so a fast poll doesn't just flicker.
const REFRESHING_MIN_MS = 650

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Submit a PSN profile sync and follow it until it ends: the job's status is
 * polled every few seconds, with a countdown to the next poll and a short
 * "refreshing" beat while one is out. Polling stops when the job completes or
 * fails, and when the component unmounts.
 *
 * ```ts
 * const { info, submit, resume } = useSyncTracker()
 * await submit('some_psnid')
 * ```
 */
export function useSyncTracker() {
  const { t } = useI18n()
  const sync = useSync()

  const submitting = ref(false)
  const errorMessage = ref('')
  /** The submitted PSN profile is private — show the dedicated notice, not an error row. */
  const profilePrivate = ref(false)

  /** The PSN ID we're currently polling status for. */
  const activePsnid = ref('')
  const info = ref<SyncStatusInfo | null>(null)
  const polling = ref(false)
  const countdown = ref(POLL_INTERVAL_MS / 1000)
  const refreshing = ref(false)
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let countdownTimer: ReturnType<typeof setInterval> | null = null

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer)
    if (countdownTimer) clearInterval(countdownTimer)
    pollTimer = null
    countdownTimer = null
    polling.value = false
    refreshing.value = false
    countdown.value = POLL_INTERVAL_MS / 1000
  }

  function resetCountdown() {
    countdown.value = POLL_INTERVAL_MS / 1000
  }

  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer)
    resetCountdown()
    countdownTimer = setInterval(() => {
      countdown.value = Math.max(1, countdown.value - 1)
    }, 1000)
  }

  async function pollWithRefreshTransition() {
    countdown.value = 0
    refreshing.value = true
    const startedAt = Date.now()

    await pollOnce()

    const remaining = REFRESHING_MIN_MS - (Date.now() - startedAt)
    if (remaining > 0) await wait(remaining)

    if (!polling.value) return
    resetCountdown()
    refreshing.value = false
  }

  async function pollOnce() {
    if (!activePsnid.value) return
    try {
      const s = await sync.status(activePsnid.value)
      if (!s) {
        if (info.value) {
          info.value = null
          stopPolling()
        }
        return
      }
      info.value = s
      if (s.status === 'completed' || s.status === 'failed') stopPolling()
    }
    catch (error) {
      // Right after submit the status row may not exist yet — keep polling.
      if (error instanceof ApiError && error.code === 'NOT_FOUND') return
      errorMessage.value = error instanceof ApiError ? error.message : t('sync.errors.status')
      stopPolling()
    }
  }

  async function startPollingFor(id: string) {
    activePsnid.value = id
    polling.value = true
    await pollOnce()
    // First read may have hit a terminal state already; only keep polling if not.
    if (polling.value) {
      startCountdown()
      pollTimer = setInterval(async () => {
        await pollWithRefreshTransition()
      }, POLL_INTERVAL_MS)
    }
  }

  /** Enqueue a sync for `id` and follow it; a sync already running for it is followed instead. */
  async function submit(id: string) {
    errorMessage.value = ''
    profilePrivate.value = false
    info.value = null
    stopPolling()
    submitting.value = true

    try {
      await sync.submit(id)
      await startPollingFor(id)
    }
    catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'SYNC_IN_PROGRESS') {
          await startPollingFor(id)
          return
        }

        if (error.code === 'PSN_PROFILE_PRIVATE') {
          profilePrivate.value = true
          return
        }

        errorMessage.value = error.code === 'SYNC_WORKER_UNAVAILABLE'
          ? t('sync.errors.workerUnavailable')
          : error.message || t('sync.errors.submit')
      }
      else {
        errorMessage.value = t('sync.errors.submitRetry')
      }
    }
    finally {
      submitting.value = false
    }
  }

  /** Follow the sync already running for `id`, if there is one; reading its status starts nothing. */
  async function resume(id: string) {
    try {
      const s = await sync.status(id)
      if (s && s.status !== 'completed' && s.status !== 'failed' && !activePsnid.value) await startPollingFor(id)
    }
    catch {
      // No job to follow.
    }
  }

  onBeforeUnmount(stopPolling)

  return { submitting, errorMessage, profilePrivate, info, polling, countdown, refreshing, submit, resume }
}
