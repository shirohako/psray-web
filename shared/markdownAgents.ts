import { isPrivatePath } from './sitemap'

/**
 * "Markdown for agents": every public page is also served as Markdown, to a
 * request that asks for `text/markdown` or appends `.md` to the path. The idea
 * and the response contract follow Cloudflare's feature of the same name
 * (developers.cloudflare.com/fundamentals/reference/markdown-for-agents), which
 * we implement ourselves in `server/plugins/markdown-for-agents.ts` and
 * `server/middleware/markdown-for-agents.ts`; see `docs/seo.md`.
 *
 * This module is the pure, dependency-free half — safe to import from the app
 * (useSeo uses `toMarkdownUrl`). The HTML → Markdown conversion lives in
 * `htmlToMarkdown.ts`, which pulls in the parser and is only loaded server-side
 * on the first Markdown request.
 */

/** Content Signals policy (contentsignals.org) sent unless a response has its own. */
export const CONTENT_SIGNAL = 'ai-train=yes, search=yes, ai-input=yes'

/** Marks the internal fetch made for a `.md` URL, so links stay in `.md` form. */
export const MARKDOWN_SUFFIX_HEADER = 'x-markdown-suffix'

/**
 * Accept for that internal fetch. `text/html` must be present: Nuxt answers an
 * error with JSON when it isn't and the client looks like curl (`isJsonRequest`).
 */
export const MARKDOWN_ACCEPT = 'text/markdown, text/html;q=0.1'

/** Largest HTML document converted (decompressed), as on Cloudflare. */
export const MAX_HTML_BYTES = 6 * 1024 * 1024

/**
 * Whether an Accept header lists `text/markdown` with a non-zero quality.
 * Wildcards (`*\/*`, `text/*`) don't count: those clients want the page.
 */
export function acceptsMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false
  return accept.split(',').some((part) => {
    const [type, ...params] = part.split(';').map(s => s.trim())
    if (type?.toLowerCase() !== 'text/markdown') return false
    const q = params.find(p => /^q\s*=/i.test(p))
    if (!q) return true
    const value = Number.parseFloat(q.slice(q.indexOf('=') + 1))
    return !Number.isFinite(value) || value > 0
  })
}

/**
 * The same Accept with a low-priority `text/html` appended when it has none, so
 * Nuxt renders `error.vue` (which we then convert) instead of a JSON error.
 */
export function withHtmlFallback(accept: string): string {
  return /\btext\/html\b/i.test(accept) ? accept : `${accept}, text/html;q=0.01`
}

/** A Vary header value with `token` added, unless it is already covered. */
export function mergeVary(existing: string | null | undefined, token: string): string {
  if (!existing?.trim()) return token
  const names = existing.split(',').map(s => s.trim().toLowerCase())
  if (names.includes('*') || names.includes(token.toLowerCase())) return existing
  return `${existing}, ${token}`
}

/** Rough token estimate, as Cloudflare reports it: UTF-8 bytes / 4, rounded down. */
export function markdownTokens(text: string): number {
  return Math.floor(new TextEncoder().encode(text).length / 4)
}

/**
 * The page path a `.md` URL stands for (`/index.md` is the home page), or
 * `null` when the path isn't a Markdown URL.
 */
export function markdownSourcePath(pathname: string): string | null {
  if (!pathname.endsWith('.md') || pathname.startsWith('/_')) return null
  if (pathname === '/index.md') return '/'
  const source = pathname.slice(0, -3)
  if (!source.startsWith('/') || source.endsWith('/')) return null
  return source
}

/**
 * Whether a page path has a Markdown view: not private, not internal (`/_nuxt`,
 * `/__nuxt_error`) and not a file (`/sitemap.xml`, `/flags/4x3/jp.svg`).
 */
export function isConvertiblePath(pathname: string): boolean {
  if (!pathname.startsWith('/') || pathname.startsWith('/_')) return false
  if (isPrivatePath(pathname)) return false
  const last = pathname.slice(pathname.lastIndexOf('/') + 1)
  return !/\.[a-z0-9]+$/i.test(last)
}

/**
 * The `.md` form of a page URL, absolute or root-relative, keeping its query
 * and hash: `https://psray.net/?lang=en` → `https://psray.net/index.md?lang=en`.
 */
export function toMarkdownUrl(url: string): string {
  const match = /^((?:[a-z][a-z0-9+.-]*:)?\/\/[^/?#]*)?([^?#]*)(.*)$/i.exec(url)
  if (!match) return url
  const [, origin = '', rawPath = '', rest = ''] = match
  const path = rawPath.replace(/\/+$/, '')
  return `${origin}${path ? `${path}.md` : '/index.md'}${rest}`
}
