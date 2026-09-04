import { Resvg } from '@resvg/resvg-js'
import QRCode from 'qrcode'
import satori from 'satori'
import { html as toVdom } from 'satori-html'
import { CARD_HEIGHT, CARD_WIDTH } from './ogCard'
import type { Size } from './ogImage'
import { UNDECODABLE, imageSize, pngPlease, sniffImageType } from './ogImage'

/**
 * The satori → resvg pipeline behind `/card/*`, plus the asset fetching those
 * cards need. Kept apart from `ogCard.ts` so the markup stays unit-testable.
 *
 * `@resvg/resvg-js` is a native module: production must run `pnpm install` and
 * `pnpm build` on the deployment host, not ship a `.output` built elsewhere.
 */

/**
 * Device-pixel scale of the rendered PNG.
 *
 * 1× — 1200×630, the geometry every platform crops to — because that is already
 * the resolution the previews need: the widest slot any of them gives a card is
 * around 600 CSS px (Twitter ~600, LinkedIn ~552, Discord ~500, Slack ~360), so
 * 1200 source pixels is a 2× image everywhere it is actually seen.
 *
 * Rendering at 2× was measured at 562KB against 205KB — PNG is a poor container
 * for this card, which is half smooth gradient and half photograph, and lossless
 * detail nobody displays is pure weight. It only pays off for someone opening the
 * `.png` URL at full size.
 *
 * Raise it only alongside a lossy encoder: at 2×, JPEG q85 lands near 277KB, half
 * the PNG. `og:image:width` / `:height` on the pages must state the rendered size,
 * so keep them in step with this.
 */
export const CARD_SCALE = 1

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
 * A vector version lives under `server/assets/brand/` so the small header mark
 * stays sharp after social platforms rescale the card. The PNG remains as a
 * fallback; registering `public/` itself would drag the whole flag set in.
 */
let logoPromise: Promise<string | null> | null = null

export function brandLogo(): Promise<string | null> {
  logoPromise ??= (async () => {
    try {
      const assets = useStorage('assets:server')
      const svg = await assets.getItemRaw<Buffer>('brand/logo.svg')
      if (svg) return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

      const png = await assets.getItemRaw<Buffer>('brand/logo.png')
      return png ? `data:image/png;base64,${Buffer.from(png).toString('base64')}` : null
    }
    catch {
      return null
    }
  })()
  return logoPromise
}

/** A fetched image: inlined bytes plus the intrinsic size the card lays it out by. */
export interface FetchedImage {
  uri: string
  natural: Size | null
}

/**
 * Fetch a remote image and inline it as a data URI — satori resolves no URLs of
 * its own — along with the size read from its header.
 *
 * SVGs are passed through as SVG. satori nests them into its output untouched, so
 * resvg draws them as vectors at the card's full device resolution; flattening one
 * to a PNG first — the flags used to arrive as a 120px raster — pins it to that
 * raster's resolution and hands resvg a downscale to smear instead.
 *
 * Best-effort throughout: a CDN hiccup, or a format satori cannot read, costs the
 * card its art rather than turning the whole request into a 500.
 */
export async function fetchImage(url: string | null | undefined): Promise<FetchedImage | null> {
  if (!url) return null
  try {
    const response = await fetch(pngPlease(url), { signal: AbortSignal.timeout(5_000) })
    if (!response.ok) return null

    const body = Buffer.from(await response.arrayBuffer())
    const type = sniffImageType(body)
    if (!type || UNDECODABLE.has(type)) return null

    return {
      uri: `data:${type};base64,${body.toString('base64')}`,
      natural: imageSize(body),
    }
  }
  catch {
    return null
  }
}

/**
 * QR for the concrete public page represented by a card, not its image route.
 *
 * Emitted as SVG rather than `toDataURL`'s PNG: a QR is a grid of hard-edged
 * squares, and the raster one had to be resampled into a 72px box, which blurred
 * module boundaries. As vector geometry the modules land on the output grid at
 * whatever scale the card is rasterised at.
 */
export async function pageQrCode(url: string): Promise<string | null> {
  try {
    const svg = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      color: { dark: '#111936', light: '#ffffff' },
    })
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
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
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH * CARD_SCALE } })
  return Buffer.from(png.render().asPng())
}
