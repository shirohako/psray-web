/** Height of the fixed top bar plus a little breathing room. */
const TOP_BAR_OFFSET = 80

/**
 * Scroll the window so `el`'s top sits just under the fixed top bar — e.g. the
 * first row of a list after changing page from a pager at its bottom. Does
 * nothing when that top is already comfortably on screen, and jumps instead of
 * gliding when the reader prefers reduced motion.
 */
export function revealTop(el: Element | null | undefined, offset = TOP_BAR_OFFSET) {
  if (!el || !import.meta.client) return
  const top = el.getBoundingClientRect().top
  if (top >= offset && top <= window.innerHeight * 0.4) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: window.scrollY + top - offset, behavior: reduced ? 'auto' : 'smooth' })
}
