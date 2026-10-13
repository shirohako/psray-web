import { ApiError } from '~/utils/ApiError'

/**
 * Provides `$api`: a configured ofetch instance that talks to the PSRay backend.
 *
 * - Prefixes `runtimeConfig.public.apiBase`.
 * - Sends `Accept: application/json` + an `X-Request-Id` for tracing.
 * - Injects `Authorization: Bearer <token>` from the `auth_token` cookie.
 * - During SSR, forwards the visitor's IP and User-Agent (see below).
 * - Normalizes every non-2xx response into a thrown {@link ApiError}.
 *
 * Returns the raw success envelope (`{ data, meta }`). Most call sites should
 * use the `useApi()` composable, which unwraps `data` for you.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // SSR calls reach the API from this host, not from the visitor, so the API
  // would see 127.0.0.1 and Node's User-Agent. That breaks token IPs and the
  // anonymous profile-view dedupe (by IP + UA). Pass the visitor's own through:
  // nginx sets X-Real-IP, so the visitor can't forge it, and the API trusts
  // X-Forwarded-For only from loopback.
  const visitor = import.meta.server ? useRequestHeaders(['x-real-ip', 'user-agent']) : {}

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    retry: 0,

    onRequest({ options }) {
      const token = useCookie<string | null>('auth_token', { readonly: true })
      const headers = new Headers(options.headers)
      headers.set('Accept', 'application/json')
      if (!headers.has('X-Request-Id')) headers.set('X-Request-Id', crypto.randomUUID())
      if (token.value && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token.value}`)
      }
      // Attach Accept-Language: the saved trophy-language preference when
      // enabled, otherwise the user's browser default. A per-call header wins.
      const acceptLanguage = usePreferences().acceptLanguage.value
      if (acceptLanguage && !headers.has('Accept-Language')) {
        headers.set('Accept-Language', acceptLanguage)
      }
      if (visitor['x-real-ip']) headers.set('X-Forwarded-For', visitor['x-real-ip'])
      if (visitor['user-agent']) headers.set('User-Agent', visitor['user-agent'])
      options.headers = headers
    },

    onResponseError({ response }) {
      // Replace ofetch's FetchError with our normalized, branchable ApiError.
      throw ApiError.fromResponse(response.status, response._data)
    },
  })

  return {
    provide: { api },
  }
})
