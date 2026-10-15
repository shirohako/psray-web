<script setup lang="ts">
const props = withDefaults(defineProps<{
  value: number | null | undefined
  duration?: number
  from?: number
  animateInitial?: boolean
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  /**
   * Hold the width of the final value while counting, so text after the number
   * (e.g. "/ 22") doesn't shift as digits are added. Needs `tabular-nums`.
   */
  reserveWidth?: boolean
  /** Text shown with the number (e.g. `#`, `%`), so it appears together with it. */
  prefix?: string
  suffix?: string
}>(), {
  duration: 700,
  from: 0,
  animateInitial: true,
  locale: 'en-US',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  reserveWidth: false,
  prefix: '',
  suffix: '',
})

const target = computed(() => Number.isFinite(Number(props.value)) ? Number(props.value) : 0)

/*
 * On a server-rendered page the HTML shows well before the app hydrates, so a
 * count started on mount would leave the number waiting. Instead:
 *   1. The server renders the final value, invisible (holding its space), with
 *      the count's parameters as data attributes.
 *   2. A prehydrate script, inlined in the HTML and run as soon as it's parsed,
 *      reveals the digits and counts them up at once. Every counter on the page
 *      shares one start time.
 *   3. On hydration the component picks the count up where the script got to
 *      and finishes it. Ease-out cubic is self-similar, so restarting it over
 *      the remaining time continues the same curve.
 * Client-side navigation is already hydrated and simply counts on mount.
 */
interface CountUpWindow { __countUpStart?: number, __countUpHydrated?: boolean }

const nuxtApp = useNuxtApp()
let from = props.from
let firstDuration: number | null = null
let started = !props.animateInitial || (import.meta.client && !nuxtApp.isHydrating)

if (import.meta.client && nuxtApp.isHydrating && props.animateInitial) {
  const w = window as CountUpWindow
  if (w.__countUpStart != null) {
    // The prehydrate script is counting: stop it and take over from here.
    w.__countUpHydrated = true
    const ratio = props.duration > 0 ? Math.min(1, (performance.now() - w.__countUpStart) / props.duration) : 1
    from = props.from + (target.value - props.from) * (1 - (1 - ratio) ** 3)
    firstDuration = props.duration * (1 - ratio)
    started = true
  }
}

const shown = ref(started)
onMounted(() => { shown.value = true })

const displayValue = useAnimatedNumber(() => shown.value ? target.value : from, {
  // The first tween only covers what the prehydrate script hadn't counted yet.
  duration: () => firstDuration ?? props.duration,
  from,
  animateInitial: props.animateInitial,
})
firstDuration = null

const formatter = computed(() => new Intl.NumberFormat(props.locale, {
  minimumFractionDigits: props.minimumFractionDigits,
  maximumFractionDigits: props.maximumFractionDigits,
}))

const final = computed(() => props.prefix + formatter.value.format(target.value) + props.suffix)
const formatted = computed(() => shown.value
  ? props.prefix + formatter.value.format(displayValue.value) + props.suffix
  : final.value)

const style = computed(() => props.reserveWidth ? { minWidth: `${final.value.length}ch` } : undefined)

// Runs in the browser as soon as the server HTML is parsed (see above). It must
// be self-contained: Nuxt inlines its source.
onPrehydrate((el: HTMLElement) => {
  const digits = el.firstElementChild as HTMLElement | null
  const data = el.dataset
  if (!digits || data.countTo === undefined) return
  const w = window as unknown as { __countUpStart?: number, __countUpHydrated?: boolean }
  const to = Number(data.countTo)
  const from = Number(data.countFrom)
  const duration = Number(data.countDuration)
  const format = new Intl.NumberFormat(data.countLocale, {
    minimumFractionDigits: Number(data.countMin),
    maximumFractionDigits: Number(data.countMax),
  })
  const text = (v: number) => (data.countPrefix || '') + format.format(v) + (data.countSuffix || '')
  const start = w.__countUpStart ??= performance.now()
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const at = (now: number) => {
    const ratio = reduced || duration <= 0 ? 1 : Math.min(1, (now - start) / duration)
    return { ratio, value: from + (to - from) * (1 - (1 - ratio) ** 3) }
  }
  digits.textContent = text(at(performance.now()).value)
  digits.classList.remove('invisible')
  const tick = (now: number) => {
    if (w.__countUpHydrated) return
    const { ratio, value } = at(now)
    digits.textContent = text(value)
    if (ratio < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
</script>

<template>
  <!-- The counting digits are decoration: screen readers and crawlers get the
       final value instead. -->
  <span
    :class="{ 'inline-block text-right': reserveWidth }"
    :style="style"
    :data-count-to="animateInitial ? target : undefined"
    :data-count-from="animateInitial ? props.from : undefined"
    :data-count-duration="animateInitial ? duration : undefined"
    :data-count-locale="animateInitial ? locale : undefined"
    :data-count-min="animateInitial ? minimumFractionDigits : undefined"
    :data-count-max="animateInitial ? maximumFractionDigits : undefined"
    :data-count-prefix="animateInitial && prefix ? prefix : undefined"
    :data-count-suffix="animateInitial && suffix ? suffix : undefined"
  >
    <span aria-hidden="true" data-allow-mismatch="text" :class="{ invisible: !shown }">{{ formatted }}</span><span class="sr-only">{{ final }}</span>
  </span>
</template>
