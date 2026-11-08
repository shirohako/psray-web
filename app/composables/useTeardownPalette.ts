import motion from '~/assets/teardown/handheld.json'

/** Colours the page draws beside the teardown drawing in one of its schemes. */
export interface TeardownPageColours {
  /** Callout tags: fill, text, outline, and their leader lines. */
  bg: string
  fg: string
  ring: string
  line: string
  /** Highlighters over the hero copy, one per phrase in turn: [band, text]. */
  marks: string[][]
}

const palettes = motion.palettes as Record<string, TeardownPageColours>
const DEFAULT_PALETTE = Object.keys(palettes)[0]!
/** Remembers the last scheme shown, so a reload always brings a different one. */
const STORAGE_KEY = 'psray:teardown-palette'

let chosen: string | undefined

/**
 * The home page's colour scheme: the console drawing's palette, which the
 * hero copy beside it follows. One per page load, at random but never the
 * one shown last; it holds while navigating within the site, and a reload
 * picks again. `pick()` is for the client, after mount; until then the
 * scheme is the default.
 */
export function useTeardownPalette() {
  const name = useState<string | null>('teardown-palette', () => null)
  const colours = computed(() => palettes[name.value ?? DEFAULT_PALETTE]!)

  function pick() {
    if (!chosen) {
      let last: string | null = null
      try {
        last = localStorage.getItem(STORAGE_KEY)
      }
      catch {}
      const choices = Object.keys(palettes).filter(n => n !== last)
      chosen = choices[Math.floor(Math.random() * choices.length)] ?? DEFAULT_PALETTE
      try {
        localStorage.setItem(STORAGE_KEY, chosen)
      }
      catch {}
    }
    name.value = chosen
    return chosen
  }

  return { name, colours, pick }
}
