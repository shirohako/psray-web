import type {
  CreateFeedbackPayload,
  FeedbackDetail,
  FeedbackItem,
  FeedbackListQuery,
  FeedbackPageMeta,
  FeedbackReplyPayload,
} from '~/types/feedback'
import { FEEDBACK_TOKEN_HEADER } from '~/utils/feedback'

/**
 * Feedback reads and writes. A signed-in author is recognised by the auth
 * token; a guest author passes the credential they got when submitting.
 */
export function useFeedbackApi() {
  const { $api, get, post, raw } = useApi()
  const asAuthor = (guestToken?: string | null) => guestToken ? { [FEEDBACK_TOKEN_HEADER]: guestToken } : undefined

  return {
    /** Public feedback, newest first; `mine: 1` lists the signed-in viewer's own. */
    list: (query?: FeedbackListQuery) =>
      raw.get<FeedbackItem[], FeedbackPageMeta>('/feedback', { query }),

    /** One item with its replies. Pending and hidden ones need the author's credentials. */
    show: (id: number | string, guestToken?: string | null) =>
      get<FeedbackDetail>(`/feedback/${id}`, { headers: asAuthor(guestToken) }),

    /** Submit. A guest's response carries a one-time `guest_token`. */
    create: (payload: CreateFeedbackPayload) =>
      post<FeedbackDetail>('/feedback', payload),

    /** The author adds a follow-up; returns the updated thread. */
    reply: (id: number | string, payload: FeedbackReplyPayload, guestToken?: string | null) =>
      post<FeedbackDetail>(`/feedback/${id}/replies`, payload, { headers: asAuthor(guestToken) }),

    /** The author deletes it with every reply (204, no response body). */
    remove: (id: number | string, guestToken?: string | null) =>
      $api<void>(`/feedback/${id}`, { method: 'DELETE', headers: asAuthor(guestToken) }),
  }
}
