import type { AccountPlatform, ProfileAccount } from '~/services/profile'

/**
 * The "other platforms" showcase: the owner's game accounts outside PSN and
 * their social media. The rules mirror psray-api `App\Support\ProfileAccounts`
 * (the API normalizes and validates again on save); keep the two in step.
 *
 * Brand glyphs are from simple-icons 16.38.1 (CC0-1.0), 24×24 viewBox.
 */

/** Every platform, in the order the settings "Add" menu lists them. */
export const ACCOUNT_PLATFORMS = [
  'nintendo', 'steam', 'xbox', 'x', 'instagram', 'facebook', 'threads', 'youtube', 'bilibili',
] as const satisfies readonly AccountPlatform[]

/** What the owner types for a platform; `settings.showcase.accounts.fields.*`. */
export type AccountField = 'friendCode' | 'profileLink' | 'gamertag' | 'username' | 'channel' | 'uid'

export interface AccountPlatformMeta {
  /** Brand name, not translated. */
  name: string
  /** Brand colour for the glyph. */
  color: string
  /** simple-icons path data. */
  path: string
  /** Game accounts get a row each on the profile; the rest are icon links. */
  game: boolean
  field: AccountField
  /** Shown in front of the settings input: the part of the link not typed. */
  prefix: string
  placeholder: string
}

export const ACCOUNT_META: Record<AccountPlatform, AccountPlatformMeta> = {
  nintendo: {
    name: 'Nintendo Switch',
    color: '#E60012',
    path: 'M14.176 24h3.674c3.376 0 6.15-2.774 6.15-6.15V6.15C24 2.775 21.226 0 17.85 0H14.1c-.074 0-.15.074-.15.15v23.7c-.001.076.075.15.226.15zm4.574-13.199c1.351 0 2.399 1.125 2.399 2.398 0 1.352-1.125 2.4-2.399 2.4-1.35 0-2.4-1.049-2.4-2.4-.075-1.349 1.05-2.398 2.4-2.398zM11.4 0H6.15C2.775 0 0 2.775 0 6.15v11.7C0 21.226 2.775 24 6.15 24h5.25c.074 0 .15-.074.15-.149V.15c.001-.076-.075-.15-.15-.15zM9.676 22.051H6.15c-2.326 0-4.201-1.875-4.201-4.201V6.15c0-2.326 1.875-4.201 4.201-4.201H9.6l.076 20.102zM3.75 7.199c0 1.275.975 2.25 2.25 2.25s2.25-.975 2.25-2.25c0-1.273-.975-2.25-2.25-2.25s-2.25.977-2.25 2.25z',
    game: true,
    field: 'friendCode',
    prefix: 'SW-',
    placeholder: '1234-5678-9012',
  },
  steam: {
    name: 'Steam',
    color: '#1B2838',
    path: 'M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z',
    game: true,
    field: 'profileLink',
    prefix: 'steamcommunity.com/',
    placeholder: 'id/…',
  },
  xbox: {
    name: 'Xbox',
    color: '#107C10',
    path: 'M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.002 17.48 24 14.861 24 12.004c0-3.34-1.365-6.362-3.57-8.536 0 0-.027-.022-.082-.042-.063-.022-.152-.045-.281-.045-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042C1.365 5.642 0 8.664 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245-.131 0-.223.021-.281.046v-.002zM12 3.551S9.055 1.828 6.755 1.746c-.903-.033-1.454.295-1.521.339C7.379.646 9.659 0 11.984 0H12c2.334 0 4.605.646 6.766 2.085-.068-.046-.615-.372-1.52-.339C14.946 1.828 12 3.545 12 3.545v.006z',
    game: true,
    field: 'gamertag',
    prefix: '',
    placeholder: 'Gamertag',
  },
  x: {
    name: 'X',
    color: '#0F172A',
    path: 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z',
    game: false,
    field: 'username',
    prefix: 'x.com/',
    placeholder: 'username',
  },
  instagram: {
    name: 'Instagram',
    color: '#FF0069',
    path: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077',
    game: false,
    field: 'username',
    prefix: 'instagram.com/',
    placeholder: 'username',
  },
  facebook: {
    name: 'Facebook',
    color: '#0866FF',
    path: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
    game: false,
    field: 'username',
    prefix: 'facebook.com/',
    placeholder: 'username',
  },
  threads: {
    name: 'Threads',
    color: '#0F172A',
    path: 'M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z',
    game: false,
    field: 'username',
    prefix: 'threads.com/@',
    placeholder: 'username',
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    game: false,
    field: 'channel',
    prefix: 'youtube.com/@',
    placeholder: 'handle',
  },
  bilibili: {
    name: 'bilibili',
    color: '#00A1D6',
    path: 'M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373Z',
    game: false,
    field: 'uid',
    prefix: 'space.bilibili.com/',
    placeholder: '12345678',
  },
}

export const isAccountPlatform = (value: unknown): value is AccountPlatform =>
  (ACCOUNT_PLATFORMS as readonly unknown[]).includes(value)

/** How an account reads on the profile: `@handle`, `UID 123`, the friend code as is. */
export function accountLabel(account: Pick<ProfileAccount, 'platform' | 'value'>): string {
  switch (account.platform) {
    case 'steam': return account.value.replace(/^(?:id|profiles)\//, '')
    case 'x':
    case 'instagram':
    case 'threads':
    case 'youtube': return `@${account.value}`
    case 'bilibili': return `UID ${account.value}`
    default: return account.value
  }
}

/** A saved value as the settings input holds it: the prefix shown beside the input is left off. */
export function accountInput(platform: AccountPlatform, value: string): string {
  return platform === 'nintendo' ? value.replace(/^SW-/, '') : value
}

/** Longest input the API accepts, pasted links included (characters). */
export const ACCOUNT_INPUT_MAX = 200

const HOSTS: Partial<Record<AccountPlatform, string[]>> = {
  steam: ['steamcommunity.com'],
  x: ['x.com', 'twitter.com'],
  instagram: ['instagram.com'],
  facebook: ['facebook.com', 'fb.com'],
  threads: ['threads.com', 'threads.net'],
  youtube: ['youtube.com'],
  bilibili: ['space.bilibili.com', 'bilibili.com'],
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** For a pasted link to this platform, the path after the host (no leading `/`, query or hash); otherwise the input. */
function linkPath(platform: AccountPlatform, input: string): string {
  const hosts = (HOSTS[platform] ?? []).map(escapeRegExp).join('|')
  const match = new RegExp(`^(?:https?://)?(?:(?:www|m|mobile)\\.)?(?:${hosts})(?=[/?#]|$)([^?#]*)`, 'i').exec(input)
  return match ? match[1]!.replace(/^\/+|\/+$/g, '') : input
}

/** First path segment (a pasted link may point at one post), without a leading `@`. */
function handle(path: string, pattern: RegExp): string | null {
  const value = path.split('/')[0]!.replace(/^@+/, '')
  return pattern.test(value) ? value : null
}

function friendCode(input: string): string | null {
  const digits = input.replace(/^SW[\s-]*/i, '').replace(/[\s-]+/g, '')
  return /^\d{12}$/.test(digits) ? `SW-${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}` : null
}

function steam(path: string): string | null {
  const match = /^(id|profiles)\/([^/]+)/i.exec(path)
  const kind = match ? match[1]!.toLowerCase() : /^\d{17}$/.test(path) ? 'profiles' : 'id'
  const id = match ? match[2]! : path
  const valid = kind === 'profiles' ? /^\d{17}$/.test(id) : /^[A-Za-z0-9_-]{2,32}$/.test(id)
  return valid ? `${kind}/${id}` : null
}

function gamertag(input: string): string | null {
  const value = input.replace(/\s+/gu, ' ')
  return Array.from(value).length <= 20
    && /^[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N} ]*[\p{L}\p{M}\p{N}])?(?:#\d{1,4})?$/u.test(value)
    ? value
    : null
}

function facebook(input: string): string | null {
  const id = /^(?:https?:\/\/)?(?:(?:www|m)\.)?(?:facebook|fb)\.com\/profile\.php\?(?:[^#]*&)?id=(\d+)/i.exec(input)
  if (id) return id[1]!
  const value = linkPath('facebook', input).split('/')[0]!.replace(/^@+/, '')
  return /^\d{5,20}$/.test(value) || /^[A-Za-z0-9.]{5,50}$/.test(value) ? value : null
}

function youtube(input: string): string | null {
  const path = linkPath('youtube', input)
  // A pasted link has to be the `@handle` one: /channel/UC…, /c/… and videos don't name a handle.
  if (path !== input && !path.startsWith('@')) return null
  return handle(path, /^[\p{L}\p{M}\p{N}._-]{3,30}$/u)
}

function bilibili(input: string): string | null {
  const value = linkPath('bilibili', input).replace(/^UID[\s:：]*/iu, '').replace(/^space\//, '').split('/')[0]!
  return /^\d{1,20}$/.test(value) ? value : null
}

/**
 * What the owner typed (a handle, an ID or a pasted profile link) as the value
 * the API stores, or `null` when it can't be one.
 */
export function normalizeAccount(platform: AccountPlatform, input: string): string | null {
  const value = input.trim()
  if (!value || Array.from(value).length > ACCOUNT_INPUT_MAX) return null
  switch (platform) {
    case 'nintendo': return friendCode(value)
    case 'steam': return steam(linkPath('steam', value))
    case 'xbox': return gamertag(value)
    case 'x': return handle(linkPath('x', value), /^\w{1,15}$/)
    case 'instagram':
    case 'threads': return handle(linkPath(platform, value), /^[A-Za-z0-9._]{1,30}$/)
    case 'facebook': return facebook(value)
    case 'youtube': return youtube(value)
    case 'bilibili': return bilibili(value)
    default: return null
  }
}

/** An account row as the settings form holds it: the text in its input. */
export interface AccountDraft {
  platform: AccountPlatform
  input: string
}

export function toDrafts(accounts: readonly ProfileAccount[]): AccountDraft[] {
  return accounts.map(account => ({ platform: account.platform, input: accountInput(account.platform, account.value) }))
}

export function sameDrafts(a: readonly AccountDraft[], b: readonly AccountDraft[]): boolean {
  return a.length === b.length && a.every((draft, i) => draft.platform === b[i]?.platform && draft.input === b[i]?.input)
}

/** A row the owner typed something into that can't be saved. */
export const isInvalidDraft = (draft: AccountDraft) => draft.input.trim() !== '' && normalizeAccount(draft.platform, draft.input) === null

/** What `PATCH /user/setting` stores: rows left empty are dropped. Call once no row is invalid. */
export function accountsPayload(drafts: readonly AccountDraft[]): { platform: AccountPlatform, value: string }[] {
  return drafts.flatMap((draft) => {
    const value = normalizeAccount(draft.platform, draft.input)
    return value === null ? [] : [{ platform: draft.platform, value }]
  })
}
