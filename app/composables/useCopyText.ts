/**
 * Copy text to the clipboard with the site's usual toasts: "{label} copied"
 * on success, the clipboard-permission hint on failure. Resolves to whether
 * the copy worked, so a button can show its own confirmation.
 */
export function useCopyText() {
  const { t } = useI18n()
  const toast = useToast()

  return async function copyText(text: string, label: string): Promise<boolean> {
    if (!import.meta.client) return false
    try {
      await navigator.clipboard.writeText(text)
      toast.success({ title: t('toast.copied', { label }) })
      return true
    } catch {
      toast.error({
        title: t('toast.copyFailed.title'),
        description: t('toast.copyFailed.description'),
      })
      return false
    }
  }
}
