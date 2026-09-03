import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import { html as toVdom } from 'satori-html'
import { CARD_HEIGHT, CARD_WIDTH } from './ogCard'
import { UNDECODABLE, pngPlease, sniffImageType } from './ogImage'

/**
 * The satori → resvg pipeline behind `/og/*`, plus the asset fetching those
 * cards need. Kept apart from `ogCard.ts` so the markup stays unit-testable.
 *
 * `@resvg/resvg-js` is a native module: production must run `pnpm install` and
 * `pnpm build` on the deployment host, not ship a `.output` built elsewhere.
 */

/** Inter, in the two weights the cards use. Parsed once, then held for the process. */
let fontsPromise: Promise<{ name: string; data: Buffer; weight: 400 | 600; style: 'normal' }[]> | null = null

function loadFonts() {
  fontsPromise ??= (async () => {
    // `server/assets/**` is mounted at `assets:server` by Nitro, which keeps the
    // fonts inside the server bundle instead of exposing them under `public/`.
    const assets = useStorage('assets:server')
    const [regular, semibold] = await Promise.all([
      assets.getItemRaw<Buffer>('fonts/Inter-Regular.ttf'),
      assets.getItemRaw<Buffer>('fonts/Inter-SemiBold.ttf'),
    ])
    if (!regular || !semibold) throw new Error('og: Inter font assets are missing from the server bundle')
    return [
      { name: 'Inter', data: Buffer.from(regular), weight: 400 as const, style: 'normal' as const },
      { name: 'Inter', data: Buffer.from(semibold), weight: 600 as const, style: 'normal' as const },
    ]
  })()
  return fontsPromise
}

/**
 * The gamepad mark, inlined once and held for the process.
 *
 * A copy of `public/logo.png` lives under `server/assets/brand/` so the renderer
 * can read it straight out of the server bundle: registering `public/` itself as
 * a server asset would drag the whole flag set in with it.
 */
let logoPromise: Promise<string | null> | null = null

export function brandLogo(): Promise<string | null> {
  logoPromise ??= (async () => {
    try {
      const raw = await useStorage('assets:server').getItemRaw<Buffer>('brand/logo.png')
      return raw ? `data:image/png;base64,${Buffer.from(raw).toString('base64')}` : null
    }
    catch {
      return null
    }
  })()
  return logoPromise
}

/**
 * Fetch a remote image and inline it as a data URI — satori resolves no URLs of
 * its own.
 *
 * Best-effort throughout: a CDN hiccup, or a format satori cannot read, costs the
 * card its art rather than turning the whole request into a 500.
 */
export async function imageDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const response = await fetch(pngPlease(url), { signal: AbortSignal.timeout(5_000) })
    if (!response.ok) return null

    const body = Buffer.from(await response.arrayBuffer())
    const type = sniffImageType(body)
    if (!type || UNDECODABLE.has(type)) return null

    return `data:${type};base64,${body.toString('base64')}`
  }
  catch {
    return null
  }
}

/**
 * Google Fonts family per script, keyed by the codes satori reports for a run of
 * glyphs none of the loaded fonts cover.
 */
const SCRIPT_FONTS: Record<string, string> = {
  'ja-JP': 'Noto Sans JP',
  'ko-KR': 'Noto Sans KR',
  'zh-CN': 'Noto Sans SC',
  'zh-TW': 'Noto Sans TC',
  'zh-HK': 'Noto Sans HK',
  'th-TH': 'Noto Sans Thai',
  'ar-AR': 'Noto Sans Arabic',
  'he-IL': 'Noto Sans Hebrew',
  'devanagari': 'Noto Sans Devanagari',
}

/** Old enough that the CSS API answers with `woff`; satori cannot parse `woff2`. */
const LEGACY_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/25.0.1349.2 Safari/537.36'

type SatoriFont = Exclude<Parameters<typeof satori>[1]['fonts'], undefined>[number]

/**
 * Fonts for one run of text, memoised by script and exact string. Cleared wholesale
 * once it grows past a few hundred titles rather than tracking per-entry age — a
 * card render costs one HTTP round trip at worst.
 */
const scriptFonts = new Map<string, SatoriFont[]>()

/**
 * Fetch just the glyphs a title actually uses.
 *
 * A trophy set's name comes in whatever language the set defaults to, so the cards
 * need Japanese, Korean and Chinese coverage. Bundling that would mean 10-16MB of
 * outlines resident for text that is usually a dozen characters, so the `&text=`
 * parameter of the Google Fonts CSS API is used instead: it returns a subset font
 * carrying only those characters, typically a few KB.
 *
 * The trade is a network call on a cache miss. It is deliberately best-effort — if
 * Google is slow or unreachable the card still renders, just with blanks where the
 * title's glyphs would be.
 */
async function loadScriptFont(code: string, text: string): Promise<SatoriFont[]> {
  // Han characters belong to several scripts at once, so satori asks for those
  // with a ranked, pipe-joined code such as `ja-JP|zh-CN|zh-TW|zh-HK`. Take its
  // first choice we have a family for; ignoring these left 野球 as tofu while the
  // surrounding kana rendered.
  const family = code.split('|').map(part => SCRIPT_FONTS[part]).find(Boolean)
  if (!family) return []

  const key = `${family}|${text}`
  const cached = scriptFonts.get(key)
  if (cached) return cached

  try {
    const query = `family=${encodeURIComponent(family)}:wght@600&text=${encodeURIComponent(text)}`
    const css = await fetch(`https://fonts.googleapis.com/css2?${query}`, {
      headers: { 'user-agent': LEGACY_UA },
      signal: AbortSignal.timeout(4_000),
    }).then(r => (r.ok ? r.text() : ''))

    const src = css.match(/src:\s*url\(([^)]+)\)/)?.[1]
    if (!src) return []

    const response = await fetch(src, { signal: AbortSignal.timeout(4_000) })
    if (!response.ok) return []

    const fonts: SatoriFont[] = [{
      // Each subset covers only one run of the title, so it needs a family name
      // of its own: registering several under `Noto Sans JP` leaves satori with
      // whichever arrived last, and the rest of the title renders as tofu.
      name: `${family} ${text}`,
      data: await response.arrayBuffer(),
      weight: 600,
      style: 'normal',
    }]
    if (scriptFonts.size > 300) scriptFonts.clear()
    scriptFonts.set(key, fonts)
    return fonts
  }
  catch {
    return []
  }
}

/** Render card markup to a PNG at the fixed 1200×630 social-card geometry. */
export async function renderCard(markup: string): Promise<Buffer> {
  const svg = await satori(toVdom(markup), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: await loadFonts(),
    loadAdditionalAsset: (code, segment) => loadScriptFont(code, segment),
  })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH } })
  return Buffer.from(png.render().asPng())
}
