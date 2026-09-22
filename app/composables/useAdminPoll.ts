export function useAdminPoll(refresh: () => Promise<unknown>) {
  let timer: ReturnType<typeof setInterval> | undefined
  let busy = false
  const tick = async () => {
    if (document.hidden || busy) return
    busy = true
    try {
      await refresh()
    } catch {
      /* page owns error display */
    } finally {
      busy = false
    }
  }
  onMounted(() => {
    timer = setInterval(tick, 15000)
    document.addEventListener('visibilitychange', tick)
  })
  onBeforeUnmount(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', tick)
  })
}
