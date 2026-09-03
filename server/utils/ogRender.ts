import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import { html as toVdom } from 'satori-html'
import { CARD_HEIGHT, CARD_WIDTH } from './ogCard'

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
 * Fetch a remote image and inline it as a data URI — satori resolves no URLs of
 * its own. Best-effort by design: a PSN CDN hiccup should cost the card its art,
 * not turn the whole request into a 500.
 */
export async function imageDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) })
    if (!response.ok) return null
    const type = response.headers.get('content-type') || 'image/png'
    if (!type.startsWith('image/')) return null
    const body = Buffer.from(await response.arrayBuffer())
    return `data:${type};base64,${body.toString('base64')}`
  }
  catch {
    return null
  }
}

/** Render card markup to a PNG at the fixed 1200×630 social-card geometry. */
export async function renderCard(markup: string): Promise<Buffer> {
  const svg = await satori(toVdom(markup), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: await loadFonts(),
  })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH } })
  return Buffer.from(png.render().asPng())
}
