import type { AdminFeedbackSummary } from '~/types/admin'

/**
 * Feedback waiting on staff: pending review and awaiting a reply. One shared
 * copy feeds the sidebar badge and the feedback page's tab counts, so a
 * moderation action on the page updates both.
 */
export function useAdminFeedbackSummary() {
  const summary = useState<AdminFeedbackSummary | null>('admin:feedback-summary', () => null)
  const api = useAdminApi()

  async function refresh() {
    try {
      summary.value = await api.get<AdminFeedbackSummary>('/feedback/summary')
    }
    catch {
      // Keep the last counts; the page shows its own errors.
    }
  }

  return { summary, refresh }
}
