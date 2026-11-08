import { localizeTo } from '~/utils/locale'

/**
 * Progressively enhance a public trophy-set link with the profile currently in
 * context. Crawlers, copied links, new-tab gestures, and no-JS navigation keep
 * the clean public href; an ordinary click opens the viewer-progress variant.
 */
export function openTrophyWithProgress(
  event: MouseEvent,
  trophySetId: number,
  psnid: string,
) {
  if (!isPlainClick(event)) return

  event.preventDefault()
  return navigateTo(localizeTo({
    path: `/trophies/${trophySetId}`,
    query: { psnid },
  }))
}

/**
 * A plain left click that nothing has handled yet — the one kind of click a
 * real link may take over for in-app navigation. Middle, modifier and
 * keyboard-with-modifier clicks keep the browser's own behaviour (new tab, …).
 */
export function isPlainClick(event: MouseEvent): boolean {
  return !event.defaultPrevented
    && event.button === 0
    && !event.metaKey
    && !event.ctrlKey
    && !event.shiftKey
    && !event.altKey
}

/** Take a plain click over for `navigate`; anything else falls through to the link's `href`. */
export function interceptClick(event: MouseEvent, navigate: () => unknown): void {
  if (!isPlainClick(event)) return
  event.preventDefault()
  navigate()
}
