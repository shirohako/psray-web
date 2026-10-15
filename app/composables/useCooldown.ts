/**
 * Per-second countdown for "resend code in Ns" buttons. `remaining` is 0 when
 * idle; the timer is cleared when it runs out, on `stop()`, and on unmount.
 *
 * ```ts
 * const { remaining, start, stop } = useCooldown()
 * start(60)
 * ```
 */
export function useCooldown() {
  const remaining = ref(0)
  let timer: ReturnType<typeof setInterval> | undefined

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
    remaining.value = 0
  }

  function start(seconds = 60) {
    stop()
    remaining.value = seconds
    timer = setInterval(() => {
      remaining.value -= 1
      if (remaining.value <= 0) stop()
    }, 1000)
  }

  onBeforeUnmount(stop)

  return { remaining, start, stop }
}
