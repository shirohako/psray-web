/**
 * One-off context for the next page that its URL shouldn't carry, such as
 * which player to find on the leaderboard. It rides in the new history entry (`history.state`),
 * so links, the address bar and shared URLs stay plain. Reload and Back keep
 * it. A link opened in a new tab goes without it and opens the plain page.
 *
 * Hand it to `<AppLink :state>` or put it on a `navigateTo()` target as `state`;
 * the page reads it with `readNavState()` once mounted.
 */
export type NavStateKey = 'leaderboardPlayer'

export function navState(key: NavStateKey, value: string | number): Record<string, string> {
  return { [key]: String(value) }
}

/** This history entry's value for `key`; `null` on the server or when it has none. */
export function readNavState(key: NavStateKey): string | null {
  if (!import.meta.client) return null
  const value: unknown = window.history.state?.[key]
  return typeof value === 'string' && value ? value : null
}
