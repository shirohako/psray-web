import { ApiError } from '~/utils/ApiError'

/**
 * Report a failed settings form: toast the API's message (or a generic one)
 * and return the messages to show under the inputs, which are the validation
 * errors plus `byCode`, routing a known error code onto one field.
 *
 * ```ts
 * const toastFormError = useFormErrorToast()
 * errors.value = toastFormError(error, { INVALID_CREDENTIALS: 'current_password' })
 * ```
 */
export function useFormErrorToast() {
  const toast = useToast()
  const { t } = useI18n()

  return (error: unknown, byCode: Record<string, string> = {}): Record<string, string> => {
    if (!(error instanceof ApiError)) {
      toast.error({ title: t('settings.security.errors.generic') })
      return {}
    }
    const fields = error.isValidation ? error.fieldErrors() : {}
    const field = byCode[error.code]
    toast.error({ title: error.message })
    return field ? { ...fields, [field]: error.message } : fields
  }
}
