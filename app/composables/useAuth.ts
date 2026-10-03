import { ApiError } from '~/utils/ApiError'
import type { AuthRequirement, AuthSession, AuthUser, LoginPayload } from '~/services/auth'
import { useAuthApi } from '~/services/auth'

function toList(value?: string | string[]) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

// Cookie lifetime when the API issues a token with no `expires_at` (it never
// expires). 400 days is the longest expiry browsers will honour.
const NEVER_EXPIRES_MAX_AGE = 60 * 60 * 24 * 400

/**
 * The one writable `auth_token` ref. Every write goes through here so the cookie
 * always carries the token's expiry: a `useCookie` ref without `expires` writes
 * a browser-session cookie, which is dropped when the browser closes and logs
 * the user out long before the token itself expires. `refresh` re-writes the
 * cookie even when the value is unchanged, so re-stamping the expiry works.
 */
function authTokenCookie(expiresAt?: string | null) {
  return useCookie<string | null>('auth_token', {
    sameSite: 'lax',
    refresh: true,
    ...(expiresAt ? { expires: new Date(expiresAt) } : { maxAge: NEVER_EXPIRES_MAX_AGE }),
  })
}

export function useAuth() {
  // Read-only so this ref never writes the cookie itself (it has no expiry to
  // write it with); writes go through `authTokenCookie`, see `setToken`.
  const token = useCookie<string | null>('auth_token', { readonly: true }) as Ref<string | null>
  const user = useState<AuthUser | null>('auth:user', () => null)
  const roles = useState<string[]>('auth:roles', () => [])
  const permissions = useState<string[]>('auth:permissions', () => [])
  const tokenMeta = useState<AuthSession['token'] | null>('auth:tokenMeta', () => null)
  const ready = useState('auth:ready', () => false)
  const loading = useState('auth:loading', () => false)

  const loggedIn = computed(() => !!token.value && !!user.value)
  const hasToken = computed(() => !!token.value)

  function applySession(session: AuthSession) {
    user.value = session.user
    roles.value = session.roles ?? []
    permissions.value = session.permissions ?? []
    tokenMeta.value = session.token
    ready.value = true
  }

  function clearState() {
    user.value = null
    roles.value = []
    permissions.value = []
    tokenMeta.value = null
    ready.value = true
  }

  function setToken(value: string, expiresAt?: string | null) {
    authTokenCookie(expiresAt).value = value
    // Mirror into the read-only ref so `token` reads the new value right away.
    token.value = value
  }

  function clearToken() {
    authTokenCookie().value = null
    token.value = null
  }

  async function fetchMe() {
    const current = token.value
    if (!current) {
      clearState()
      return null
    }

    loading.value = true
    try {
      const session = await useAuthApi().me()
      applySession(session)
      // Re-stamp the cookie with the token's expiry on every session load. This
      // usually runs during SSR, so it arrives as a server `Set-Cookie`, which
      // Safari doesn't cap at 7 days the way it caps `document.cookie` writes.
      setToken(current, session.token?.expires_at)
      return session
    }
    catch (error) {
      if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') {
        clearToken()
        clearState()
        return null
      }

      ready.value = false
      throw error
    }
    finally {
      loading.value = false
    }
  }

  async function init(force = false) {
    if (ready.value && !force) return user.value
    if (!token.value) {
      clearState()
      return null
    }

    try {
      const session = await fetchMe()
      return session?.user ?? null
    }
    catch {
      return null
    }
  }

  // Login only yields a bearer token; the account is loaded through the same
  // `fetchMe()` path a normal session refresh uses, so login and refresh resolve
  // to an identical `AuthUser` with no shapes to keep in sync. (Registration
  // does not log in — see `useRegisterFlow`.)
  async function login(payload: LoginPayload) {
    loading.value = true
    try {
      const issued = await useAuthApi().login(payload)
      setToken(issued.token, issued.expiresAt)
      // `setToken` writes the `auth_token` cookie through a `useCookie` ref,
      // whose actual `document.cookie` write is flushed by a watcher on the next
      // tick, not synchronously. Without this wait the immediate `fetchMe()`
      // below can fire before the new cookie lands, so its Authorization header
      // re-reads the old (or absent) token and 401s.
      await nextTick()
      const session = await fetchMe()
      if (!session) {
        throw new ApiError({
          code: 'INTERNAL_ERROR',
          message: 'Login succeeded, but loading the account failed.',
          status: 500,
        })
      }
      return session
    }
    finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      if (token.value) await useAuthApi().logout()
    }
    catch (error) {
      if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') {
        clearToken()
        clearState()
        return
      }

      throw error
    }

    clearToken()
    clearState()
  }

  function hasRole(role: string) {
    return roles.value.includes(role)
  }

  function hasPermission(permission: string) {
    return permissions.value.includes(permission)
  }

  function can(requirement?: AuthRequirement | boolean) {
    if (!requirement) return true
    if (requirement === true) return loggedIn.value

    const checks = [
      ...toList(requirement.roles).map(hasRole),
      ...toList(requirement.permissions).map(hasPermission),
    ]

    if (!checks.length) return loggedIn.value
    return requirement.requireAll === false ? checks.some(Boolean) : checks.every(Boolean)
  }

  return {
    user,
    roles,
    permissions,
    tokenMeta,
    ready,
    loading,
    loggedIn,
    hasToken,
    init,
    login,
    fetchMe,
    logout,
    hasRole,
    hasPermission,
    can,
  }
}
