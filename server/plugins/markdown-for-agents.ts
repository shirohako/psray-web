import {
  acceptsMarkdown,
  CONTENT_SIGNAL,
  isConvertiblePath,
  markdownTokens,
  MARKDOWN_SUFFIX_HEADER,
  MAX_HTML_BYTES,
  mergeVary,
} from '../../shared/markdownAgents'

/** Where Nuxt renders `error.vue`, in a request of its own; `?url=` is the page. */
const ERROR_RENDER_PATH = '/__nuxt_error'

/**
 * Markdown for agents, the conversion half (see `shared/markdownAgents.ts`):
 * a rendered page goes out as Markdown when the request asked for it. Error
 * pages are converted too, since Nuxt renders them through the same hook.
 *
 * Headers follow Cloudflare's converter: the original ones are kept, except
 * those that describe the HTML body (length, encoding, validators).
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', async (response, { event }) => {
    const headers = response.headers
    if (!headers || !String(headers['content-type'] ?? '').toLowerCase().startsWith('text/html')) return
    const status = response.statusCode ?? 200
    if (status >= 300 && status < 400) return

    const isError = event.path.startsWith(ERROR_RENDER_PATH)
    const page = isError ? String(getQuery(event).url ?? '/') : event.path
    if (!isConvertiblePath(page.split(/[?#]/)[0] || '/')) return

    // The response depends on Accept from here on, HTML included. Nuxt's error
    // handler sends its own `Vary: accept, sec-fetch-mode` and copies ours over it.
    if (!isError) headers.vary = mergeVary(headers.vary, 'Accept')
    if (!acceptsMarkdown(getRequestHeader(event, 'accept'))) return
    if (typeof response.body !== 'string' || Buffer.byteLength(response.body) > MAX_HTML_BYTES) return

    const siteUrl = useRuntimeConfig(event).public.siteUrl.replace(/\/+$/, '')
    const suffix = getRequestHeader(event, MARKDOWN_SUFFIX_HEADER) === '1'
    let result
    try {
      const { htmlToMarkdown } = await import('../../shared/htmlToMarkdown')
      result = htmlToMarkdown(response.body, {
        siteUrl,
        pageUrl: `${siteUrl}${page}`,
        linkStyle: suffix ? 'suffix' : 'canonical',
      })
    }
    catch (error) {
      // Like Cloudflare: when conversion fails, the page still goes out as HTML.
      console.error('[markdown-for-agents]', event.path, error)
      return
    }

    response.body = result.markdown
    headers['content-type'] = 'text/markdown; charset=utf-8'
    headers['x-markdown-tokens'] = String(markdownTokens(result.markdown))
    if (!headers['content-signal']) headers['content-signal'] = CONTENT_SIGNAL
    // A noindex page stays noindex in its Markdown form.
    if (result.meta.robots && !headers['x-robots-tag']) headers['x-robots-tag'] = result.meta.robots
    // `.md` URLs are duplicates of the page; point search engines at the original.
    if (suffix && result.meta.url) {
      headers.link = [headers.link, `<${result.meta.url}>; rel="canonical"`].filter(Boolean).join(', ')
    }
    for (const name of ['content-length', 'content-encoding', 'etag', 'last-modified']) delete headers[name]
  })
})
