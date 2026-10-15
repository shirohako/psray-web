import type { FeedbackContext, FeedbackStatus, FeedbackType, FeedbackVisibility } from '~/types/feedback'

/** The request header that carries a guest author's credential. */
export const FEEDBACK_TOKEN_HEADER = 'X-Feedback-Token'

// Limits mirrored from the API (FeedbackService / FeedbackController).
export const FEEDBACK_CONTENT_MIN = 5
export const FEEDBACK_CONTENT_MAX = 5000
export const FEEDBACK_MAX_IMAGES = 4
export const FEEDBACK_GUEST_NAME_MAX = 32

export const FEEDBACK_TYPES: readonly FeedbackType[] = ['bug', 'suggestion', 'other']
export const FEEDBACK_STATUSES: readonly FeedbackStatus[] = ['open', 'in_progress', 'done', 'declined']

/** Badge colours: types by kind, statuses by how much attention they still need. */
export const FEEDBACK_TYPE_TONE: Record<FeedbackType, string> = {
  bug: 'bg-rose-50 text-rose-700 ring-rose-200',
  suggestion: 'bg-violet-50 text-violet-700 ring-violet-200',
  other: 'bg-slate-100 text-slate-600 ring-slate-200',
}
export const FEEDBACK_STATUS_TONE: Record<FeedbackStatus, string> = {
  open: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_progress: 'bg-sky-50 text-sky-700 ring-sky-200',
  done: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  declined: 'bg-slate-100 text-slate-500 ring-slate-200',
}
export const FEEDBACK_VISIBILITY_TONE: Record<Exclude<FeedbackVisibility, 'public'>, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  hidden: 'bg-slate-800 text-white ring-slate-800',
}

// ── List page state ──────────────────────────────────────────────────────────

export interface FeedbackListState {
  type: FeedbackType | null
  status: FeedbackStatus | null
  mine: boolean
  page: number
}

type RouteQueryValue = string | null | (string | null)[] | undefined

const first = (value: RouteQueryValue) =>
  (Array.isArray(value) ? value : [value]).find((item): item is string => typeof item === 'string') ?? ''

const oneOf = <T extends string>(values: readonly T[], value: string): T | null =>
  (values as readonly string[]).includes(value) ? value as T : null

/** Read the list state from the route query, ignoring anything unrecognised. */
export function parseFeedbackQuery(query: Record<string, RouteQueryValue>): FeedbackListState {
  const page = Number.parseInt(first(query.page), 10)
  return {
    type: oneOf(FEEDBACK_TYPES, first(query.type)),
    status: oneOf(FEEDBACK_STATUSES, first(query.status)),
    mine: first(query.mine) === '1',
    page: Number.isFinite(page) && page > 1 ? page : 1,
  }
}

/** Inverse of `parseFeedbackQuery`; defaults are left out to keep URLs short. */
export function feedbackRouteQuery(state: FeedbackListState): Record<string, string> {
  const query: Record<string, string> = {}
  if (state.mine) query.mine = '1'
  if (state.type) query.type = state.type
  if (state.status) query.status = state.status
  if (state.page > 1) query.page = String(state.page)
  return query
}

// ── Text ─────────────────────────────────────────────────────────────────────

export type FeedbackTextSegment = { type: 'text', value: string } | { type: 'link', value: string }

// Only URL characters (RFC 3986), so a link ends where CJK prose resumes without a space.
const URL_PATTERN = /https?:\/\/[\w\-.~:/?#[\]@!$&'()*+,;=%]+/g
const TRAILING = /[.,;:!?'"\]}>]/

/** Sentence punctuation after a URL belongs to the sentence; a `)` stays when it closes one inside the URL. */
function trimUrl(url: string): string {
  let end = url.length
  while (end > 0) {
    const char = url[end - 1]!
    if (char === ')') {
      const head = url.slice(0, end)
      if (head.split('(').length >= head.split(')').length) break
    }
    else if (!TRAILING.test(char)) {
      break
    }
    end--
  }
  return url.slice(0, end)
}

/** Plain text split into text and http(s) link segments, for rendering without v-html. */
export function linkifyText(text: string): FeedbackTextSegment[] {
  const segments: FeedbackTextSegment[] = []
  let last = 0
  for (const match of text.matchAll(URL_PATTERN)) {
    const url = trimUrl(match[0])
    if (!/^https?:\/\/[^/?#]+/.test(url)) continue
    const start = match.index
    if (start > last) segments.push({ type: 'text', value: text.slice(last, start) })
    segments.push({ type: 'link', value: url })
    last = start + url.length
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) })
  return segments
}

/** One line of the text, for lists and the guest's local history. */
export function feedbackExcerpt(content: string, maxLength = 80): string {
  const plain = content.replace(/\s+/g, ' ').trim()
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trimEnd()}…` : plain
}

export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname !== ''
  }
  catch {
    return false
  }
}

// ── Page context ─────────────────────────────────────────────────────────────

// Query parameters that can carry credentials (unsubscribe links, codes…).
const SENSITIVE_PARAM = /token|code|key|secret|pass|sig|auth/i

/** The page URL to report: no fragment, and no parameter that might be a credential. */
export function sanitizePageUrl(href: string): string | undefined {
  try {
    const url = new URL(href)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_PARAM.test(key)) url.searchParams.delete(key)
    }
    url.hash = ''
    return url.toString().slice(0, 2048)
  }
  catch {
    return undefined
  }
}

type ContextWindow = Pick<Window, 'innerWidth' | 'innerHeight' | 'devicePixelRatio'> & {
  location: Pick<Location, 'href'>
  screen: Pick<Screen, 'width' | 'height'>
}

/** What the reader was looking at, to help staff reproduce a bug. Sent with the feedback; staff-only. */
export function collectFeedbackContext(win: ContextWindow, locale: string): FeedbackContext {
  let timezone: string | undefined
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  }
  catch {
    timezone = undefined
  }
  const ratio = Math.round((win.devicePixelRatio || 1) * 100) / 100
  return {
    page_url: sanitizePageUrl(win.location.href),
    screen: `${win.screen.width}x${win.screen.height}@${ratio}`,
    viewport: `${win.innerWidth}x${win.innerHeight}`,
    locale,
    timezone,
  }
}

// ── A guest's own submissions ────────────────────────────────────────────────

/**
 * A guest's submission, remembered in this browser: the credential is the only
 * way back to a pending item, and the excerpt lets the "Mine" tab list them
 * without asking the API.
 */
export interface GuestFeedbackEntry {
  id: number
  token: string
  excerpt: string
  created_at: string
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

const GUEST_STORE_KEY = 'psray:feedback:guest'
const GUEST_STORE_LIMIT = 50

function isGuestEntry(value: unknown): value is GuestFeedbackEntry {
  const entry = value as GuestFeedbackEntry
  return typeof entry === 'object' && entry !== null
    && Number.isSafeInteger(entry.id) && typeof entry.token === 'string'
    && typeof entry.excerpt === 'string' && typeof entry.created_at === 'string'
}

/** `localStorage`, or nothing when the browser blocks it (private modes, disabled site data). */
export function feedbackStorage(): StorageLike | undefined {
  try {
    return import.meta.client ? window.localStorage : undefined
  }
  catch {
    return undefined
  }
}

export function readGuestFeedback(storage: StorageLike | undefined): GuestFeedbackEntry[] {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(GUEST_STORE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isGuestEntry) : []
  }
  catch {
    return []
  }
}

function writeGuestFeedback(storage: StorageLike | undefined, entries: GuestFeedbackEntry[]) {
  try {
    storage?.setItem(GUEST_STORE_KEY, JSON.stringify(entries.slice(0, GUEST_STORE_LIMIT)))
  }
  catch {
    // Full or blocked storage: the guest just loses the shortcut back.
  }
}

export function rememberGuestFeedback(storage: StorageLike | undefined, entry: GuestFeedbackEntry) {
  writeGuestFeedback(storage, [entry, ...readGuestFeedback(storage).filter(item => item.id !== entry.id)])
}

export function forgetGuestFeedback(storage: StorageLike | undefined, id: number) {
  writeGuestFeedback(storage, readGuestFeedback(storage).filter(item => item.id !== id))
}

export function guestFeedbackToken(storage: StorageLike | undefined, id: number): string | null {
  return readGuestFeedback(storage).find(item => item.id === id)?.token ?? null
}
