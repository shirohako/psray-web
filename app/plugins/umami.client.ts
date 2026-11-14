import { scrubUmamiPayload } from '~/utils/analytics'

/** Global the tracker looks up by name, via `data-before-send`. */
const BEFORE_SEND = '__psrayUmamiBeforeSend'

/**
 * Umami page-view analytics. Off unless both NUXT_PUBLIC_UMAMI_SCRIPT_URL and
 * NUXT_PUBLIC_UMAMI_WEBSITE_ID are set, so a checkout or deployment without
 * them reports nothing. The tracker follows client-side navigation itself (it
 * wraps `history.pushState`/`replaceState`), so it only needs loading once.
 * Admin pages are dropped and private URL params scrubbed in the before-send
 * hook (`utils/analytics.ts`).
 *
 * It's injected here rather than into the SSR head so that the before-send
 * hook is already on `window` when the tracker sends its first page view.
 */
export default defineNuxtPlugin(() => {
  const { scriptUrl, websiteId } = useRuntimeConfig().public.umami
  if (!scriptUrl || !websiteId) return

  Object.assign(window, { [BEFORE_SEND]: scrubUmamiPayload })

  useHead({
    script: [{
      key: 'umami',
      src: scriptUrl,
      defer: true,
      'data-website-id': websiteId,
      'data-before-send': BEFORE_SEND,
    }],
  })
})
