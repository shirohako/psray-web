/**
 * Sync service — request and track a PSN profile sync (`/profile/sync/:psnid`).
 *
 * `submit` enqueues a sync job; `status` reports the user's most recent job.
 * Both build on `useApi()`, so errors surface as {@link ApiError} — branch on
 * `code` (e.g. `SYNC_IN_PROGRESS`, `SYNC_WORKER_UNAVAILABLE`, `SYNC_QUEUE_FULL`,
 * `USER_NOT_FOUND`, `PSN_UNAVAILABLE`, `PSN_PROFILE_PRIVATE`, `TOO_MANY_REQUESTS`).
 */

/** Sync job lifecycle. */
export type SyncStatus = 'queued' | 'calculating' | 'syncing' | 'completed' | 'failed'

/** Why a sync failed (`error_code` of a failed status); the UI shows `sync.failure.<code>`. */
export type SyncErrorCode =
  | 'psn_unavailable'
  | 'all_games_failed'
  | 'game_list_failed'
  | 'interrupted'
  | 'internal'
  | 'profile_private'
  | 'profile_not_found'
  | 'psn_no_trophy_data'
  | 'account_terminated'
  | 'user_missing'

/** Result of enqueueing a sync job. */
export interface SyncSubmitResult {
  queue_id: number
}

/** A user's most recent sync job, as returned by `GET .../status`. */
export interface SyncStatusInfo {
  queue_id: number
  psnid: string
  status: SyncStatus
  /** Numeric status code: 1 queued, 2 calculating, 3 syncing, 4 completed, 0 failed. */
  status_code: number
  /** Sync progress, 0–100. */
  progress: number
  /** Total tasks this run needs to sync (excludes skipped). May still grow while calculating. */
  total: number
  /** Tasks completed so far this run. */
  completed: number
  /** Tasks that failed this run. */
  failed: number
  /** Tasks skipped (already synced site-wide) — not counted toward `total`/`completed`/`failed`. */
  skipped: number
  /** NP Communication ID (e.g. `NPWR33408_00`) of the game currently syncing; empty when none. */
  current_game: string
  /** Unix seconds. */
  started_at: number
  /** Unix seconds. */
  updated_at: number
  /** Unix seconds. */
  completed_at: number
  /** Why it failed, as a stable code (empty unless `status === 'failed'`). Translate this, not `error`. */
  error_code: SyncErrorCode | ''
  /** Chinese fallback text for `error_code`; never contains internal details. */
  error: string
  /** Unfinished jobs ahead of this one — only present while `queued`. */
  queue_ahead?: number
  /** Jobs currently executing across the worker pool. */
  active_queue_count: number
  /** Jobs waiting to be picked up across the worker pool. */
  waiting_queue_count: number
}

export function useSync() {
  const { get, post } = useApi()

  return {
    /** Enqueue a sync job for `psnid`. Throws `SYNC_IN_PROGRESS` when an active job already exists. */
    submit: (psnid: string) =>
      post<SyncSubmitResult>(`/profile/sync/${encodeURIComponent(psnid)}`),

    /** Latest sync job status for `psnid`; `null` means no retained status exists. */
    status: (psnid: string) =>
      get<SyncStatusInfo | null>(`/profile/sync/${encodeURIComponent(psnid)}/status`),
  }
}
