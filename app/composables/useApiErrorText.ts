import { ApiError } from '~/utils/ApiError'

/**
 * Words for a failed request, e.g. a toast's description: our own copy for
 * its code (`errors.api.<CODE>`) when the catalog has some, otherwise the
 * API's message. Nothing for a failure that never reached the API.
 *
 * ```ts
 * const errorText = useApiErrorText()
 * toast.error({ title: t('feedback.form.submitFailed'), description: errorText(error) })
 * ```
 */
export function useApiErrorText() {
  const { t, te } = useI18n()

  return (error: unknown): string | undefined => {
    if (!(error instanceof ApiError)) return undefined
    const key = `errors.api.${error.code}`
    return te(key) ? t(key) : error.message
  }
}
