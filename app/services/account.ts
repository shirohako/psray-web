/**
 * Account self-service mutations for the user-settings pages: banner +
 * avatar settings, email + password changes, account deletion, resetting
 * synced PSN data.
 *
 * Mirrors `useAuthApi()` in `~/services/auth` — thin wrappers over `useApi()`.
 */
import type { MediaImage } from '~/types/media'

/** Standard success payload for the mutation endpoints: a displayable message. */
export interface MessageResult {
  message: string
}

export interface UpdateSettingPayload {
  /** Image id of the profile banner (upload it first, purpose `banner`); `null` removes it. */
  banner?: string | null
  /** Image id of the custom avatar (purpose `avatar`); `null` removes it. */
  avatar?: string | null
  /**
   * `true` — show the custom avatar. `false` — switch back to the PSN avatar
   * at once; the uploaded one is kept for switching back later.
   * Omitted while only `avatar` is sent: an image turns it on, `null` off.
   */
  use_custom_avatar?: boolean
  /** Language mails are sent in — one of the five UI locales. */
  locale?: string
  /** Subscriptions to the three kinds of notification mail (account and security mail can't be turned off). */
  mail_important?: boolean
  mail_features?: boolean
  mail_other?: boolean
}

/** Current account settings, as returned by `GET /user/setting`. */
export interface UserSetting {
  /** The avatar shown right now: the custom one when it is on, else the PSN one. */
  avatar_url: string | null
  /** The PSN avatar; `null` until the first sync brings it in. */
  psn_avatar_url: string | null
  /** The uploaded avatar, kept while the PSN one is in use. */
  avatar: MediaImage | null
  use_custom_avatar: boolean
  banner: MediaImage | null
  locale: string
  mail_important: boolean
  mail_features: boolean
  mail_other: boolean
}

export interface ChangePasswordPayload {
  current_password: string
  /** New password, 8–255 chars (backend-validated). */
  new_password: string
}

export interface SendEmailCodePayload {
  /** The new email address to send the verification code to. */
  email: string
}

export interface ChangeEmailPayload {
  current_password: string
  /** New email address — must match the one the code was sent to. */
  email: string
  /** 6-digit verification code from `sendEmailCode`. */
  code: string
}

export interface DeleteAccountPayload {
  /** Current login password. Checked before the code, so a wrong one leaves the code usable. */
  password: string
  /** 6-digit code from `sendDeletionCode`. */
  code: string
}

/** What `POST /user/account/deletion` actually removed, item by item. */
export interface AccountDeletionResult extends MessageResult {
  purged: {
    items: { key: string, label: string, category: string, impact: string | null, count: number }[]
    totals: Record<string, number>
  }
}

/** `GET /user/account/sync-reset`: whether a reset is allowed right now, and what it would cost. */
export interface SyncResetStatus {
  /** Earned trophies (all grades) — the cooldown scales with it. */
  trophy_count: number
  /** Cooldown a reset started now would put in place, in hours. */
  cooldown_hours: number
  /** When the current cooldown ends (ISO 8601); `null` when not cooling down. */
  available_at: string | null
  /** A sync is queued or running — the reset is refused until it ends. */
  syncing: boolean
}

export interface SyncResetResult {
  /** The full re-sync's queue id; follow it on `/sync?psnid=…`. */
  queue_id: number
  /** When this reset's cooldown ends (ISO 8601). */
  available_at: string
}

export function useAccountApi() {
  const { patch, post } = useApi()

  return {
    updateSetting: (payload: UpdateSettingPayload) =>
      patch<MessageResult>('/user/setting', payload),

    // --- Password -----------------------------------------------------------
    // Verifies the current password, writes the new one, and logs out this
    // account's other sessions (the current token stays valid).
    changePassword: (payload: ChangePasswordPayload) =>
      post<MessageResult>('/user/setting/password', payload),

    // --- Email (two-step) ---------------------------------------------------
    // Step 1: send a verification code to the new address (shared send-code
    // endpoint, fixed `type`).
    sendEmailCode: (payload: SendEmailCodePayload) =>
      post<MessageResult>('/auth/send-code', { ...payload, type: 'change_email', locale: currentUiLocale() }),
    // Step 2: confirm the change with the current password + received code.
    changeEmail: (payload: ChangeEmailPayload) =>
      post<MessageResult>('/user/setting/email', payload),

    // --- Account deletion (two-step) ----------------------------------------
    // Step 1: email a code to the bound address (no body — the server picks the
    // address). Admins and moderators get FORBIDDEN.
    sendDeletionCode: () => post<MessageResult>('/user/account/deletion-code'),
    // Step 2: delete the account and all its data. Every token, including the
    // current one, is revoked on success.
    deleteAccount: (payload: DeleteAccountPayload) =>
      post<AccountDeletionResult>('/user/account/deletion', payload),

    // --- Reset synced data --------------------------------------------------
    // Wipes the synced trophy data, zeroes points/rank and queues a full
    // re-sync. `psnid` must repeat the account's own PSN ID (confirmation).
    resetSync: (psnid: string) =>
      post<SyncResetResult>('/user/account/sync-reset', { psnid }),
  }
}
