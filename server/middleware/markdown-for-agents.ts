import {
  acceptsMarkdown,
  isConvertiblePath,
  MARKDOWN_ACCEPT,
  MARKDOWN_SUFFIX_HEADER,
  markdownSourcePath,
  toMarkdownUrl,
  withHtmlFallback,
} from '../../shared/markdownAgents'

/**
 * Markdown for agents, the request half (see `shared/markdownAgents.ts`; the
 * conversion is `server/plugins/markdown-for-agents.ts`).
 *
 * `Accept: text/markdown`: the page renders as usual. Accept only gets a
 * low-priority `text/html` added when it has none, or Nuxt would answer a 404
 * from curl-like clients with JSON rather than render `error.vue`.
 *
 * `/path.md`: h3 resets the request path before every handler, so it can't be
 * rewritten here. Instead the page is fetched internally (as Nuxt's own error
 * handler does), so route rules, legacy redirects, i18n and error pages all see
 * an ordinary request, and the answer is relayed.
 */

/** Request headers that don't carry over to the internal fetch. */
const DROPPED_REQUEST_HEADERS = [
  'accept-encoding', 'connection', 'content-length', 'if-match', 'if-modified-since',
  'if-none-match', 'if-range', 'if-unmodified-since', 'keep-alive', 'range', 'te',
  'trailer', 'transfer-encoding', 'upgrade',
]

/** Response headers not relayed: framing is ours, and a `.md` URL doesn't vary by Accept. */
const DROPPED_RESPONSE_HEADERS = new Set(['connection', 'content-length', 'keep-alive', 'set-cookie', 'transfer-encoding', 'vary'])

export default defineEventHandler(async (event) => {
  const split = event.path.search(/[?#]/)
  const pathname = split < 0 ? event.path : event.path.slice(0, split)
  const search = split < 0 ? '' : event.path.slice(split)
  const source = markdownSourcePath(pathname)

  if (source === null) {
    const accept = getRequestHeader(event, 'accept')
    if (accept && acceptsMarkdown(accept) && isConvertiblePath(pathname)) {
      const value = withHtmlFallback(accept)
      if (value !== accept) {
        event.node.req.headers.accept = value
        event.headers.set('accept', value)
      }
    }
    return
  }

  if (event.method !== 'GET' && event.method !== 'HEAD') return
  if (!isConvertiblePath(source)) {
    setResponseStatus(event, 404)
    setResponseHeader(event, 'content-type', 'text/markdown; charset=utf-8')
    return '# Not Found\n'
  }

  const headers = new Headers(event.headers)
  for (const name of DROPPED_REQUEST_HEADERS) headers.delete(name)
  headers.set('accept', MARKDOWN_ACCEPT)
  headers.set(MARKDOWN_SUFFIX_HEADER, '1')

  const res = await useNitroApp().localFetch(source + search, { method: 'GET', headers, redirect: 'manual' })

  setResponseStatus(event, res.status, res.statusText)
  for (const [name, value] of res.headers.entries()) {
    if (name === 'set-cookie') appendResponseHeader(event, name, value)
    else if (!DROPPED_RESPONSE_HEADERS.has(name)) setResponseHeader(event, name, value)
  }

  // A redirect to another page keeps the client on Markdown URLs.
  const location = res.headers.get('location')
  if (location && res.status >= 300 && res.status < 400) {
    const siteUrl = useRuntimeConfig(event).public.siteUrl
    const target = new URL(location, siteUrl)
    const sameSite = location.startsWith('/') ? !location.startsWith('//') : target.origin === new URL(siteUrl).origin
    if (sameSite && isConvertiblePath(target.pathname)) setResponseHeader(event, 'location', toMarkdownUrl(location))
    return ''
  }
  return await res.text()
})
