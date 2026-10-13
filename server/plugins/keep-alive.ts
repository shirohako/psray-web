import { Agent, setGlobalDispatcher } from 'undici'

/**
 * Keeps SSR's connections to the API open between requests.
 *
 * SSR reaches the API over HTTPS on this host. Node's fetch closes an idle
 * connection after 4s, and SSR traffic is sparse enough that about one API
 * call in four paid a fresh TLS handshake (~20ms). 60s keeps them warm.
 *
 * Stay below nginx's keepalive_timeout (65s): if nginx closed first, fetch
 * could send a request down a connection nginx is already closing.
 *
 * This replaces the process-wide dispatcher, so it applies to every
 * server-side fetch, not just API calls. Browsers are unaffected. undici's
 * major version must match the one bundled with Node (7 on Node 24), or
 * Node's built-in fetch may not accept the dispatcher.
 */
export default defineNitroPlugin(() => {
  setGlobalDispatcher(new Agent({ keepAliveTimeout: 60_000 }))
})
