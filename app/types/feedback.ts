export type FeedbackType = 'bug' | 'suggestion' | 'other'

/** Maintained by staff: open → in_progress → done, or declined. */
export type FeedbackStatus = 'open' | 'in_progress' | 'done' | 'declined'

/**
 * `public` is visible to everyone. `pending` (a guest's feedback waiting for
 * review) and `hidden` (hidden by staff) only reach their author and staff.
 */
export type FeedbackVisibility = 'pending' | 'public' | 'hidden'

/** Public fields of a signed-in author or a staff member. */
export interface FeedbackUser {
  id: number
  psnid: string
  avatar_url: string | null
  country: string | null
  trophy_level: number | null
}

/** Who wrote a feedback item or a reply; `staff` only appears on replies. */
export type FeedbackAuthor =
  | { type: 'user', name: null, user: FeedbackUser | null }
  | { type: 'guest', name: string | null, user: null }
  | { type: 'staff', name: null, user: FeedbackUser | null }

/** One item of `GET /feedback`. */
export interface FeedbackItem {
  id: number
  type: FeedbackType
  status: FeedbackStatus
  visibility: FeedbackVisibility
  /** Plain text; render as text, never as HTML or Markdown. */
  content: string
  /** External https image links, at most four. */
  image_urls: string[]
  author: FeedbackAuthor
  reply_count: number
  has_staff_reply: boolean
  created_at: string
  last_activity_at: string
}

export interface FeedbackReply {
  id: number
  /** A staff answer; otherwise a follow-up from the feedback's own author. */
  is_staff: boolean
  author: FeedbackAuthor
  content: string
  image_urls: string[]
  created_at: string
}

/** `GET /feedback/:id`, and what creating or following up returns. */
export interface FeedbackDetail extends FeedbackItem {
  replies: FeedbackReply[]
  viewer: { is_author: boolean, can_reply: boolean, can_delete: boolean }
  /** Only on a guest's create response: the one-time author credential. */
  guest_token?: string
}

export interface FeedbackPageMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

/** Where the reader was when they wrote in. Only staff ever see it. */
export interface FeedbackContext {
  page_url?: string
  screen?: string
  viewport?: string
  locale?: string
  timezone?: string
}

export interface CreateFeedbackPayload {
  type: FeedbackType
  content: string
  image_urls?: string[]
  /** Ignored for signed-in authors. */
  guest_name?: string
  context?: FeedbackContext
}

export interface FeedbackReplyPayload {
  content: string
  image_urls?: string[]
}
