/**
 * The endpoints documented on /docs/api, and the helpers that turn one of them
 * plus a set of parameter values into a request URL, a curl command or a
 * `fetch` snippet. The page, its code samples and its "Try it" panel all read
 * from here, so a sample can never drift from the request Try it sends.
 *
 * Descriptions are i18n keys (`…Key`), which `pnpm check:locales` verifies.
 * Example responses are real API output, trimmed to one or two items per
 * array: see `apiDocExamples.json`.
 */
import examples from './apiDocExamples.json'

export type ApiGroupId = 'trophies' | 'profile' | 'games' | 'series'

export interface ApiParam {
  /** Query name as sent; array parameters end in `[]` (`platform[]`). */
  name: string
  in: 'path' | 'query'
  type: string
  required?: boolean
  default?: string
  /** Value used in the code samples and prefilled in Try it. */
  example?: string
  /** Accepted values, listed under the description. */
  options?: string[]
  descKey: string
  descArgs?: Record<string, string | number>
}

export interface ApiField {
  name: string
  type: string
  descKey: string
}

export interface ApiErrorRef {
  status: number
  code: string
}

export interface ApiEndpoint {
  /** Anchor id on the page. */
  id: string
  group: ApiGroupId
  method: 'GET'
  path: string
  titleKey: string
  descKey: string
  /** List endpoints return `meta` with pagination. */
  paginated?: boolean
  params: ApiParam[]
  fields: ApiField[]
  errors: ApiErrorRef[]
  example: unknown
}

export const API_GROUPS: { id: ApiGroupId, labelKey: string }[] = [
  { id: 'trophies', labelKey: 'apiDocs.groups.trophies' },
  { id: 'profile', labelKey: 'apiDocs.groups.profile' },
  { id: 'games', labelKey: 'apiDocs.groups.games' },
  { id: 'series', labelKey: 'apiDocs.groups.series' },
]

const TROPHY_PLATFORMS = ['PS5', 'PS4', 'PS3', 'PSVITA', 'PSPC']

const page: ApiParam = { name: 'page', in: 'query', type: 'integer', default: '1', descKey: 'apiDocs.params.page' }
const perPage = (max: number): ApiParam => ({ name: 'per_page', in: 'query', type: 'integer', default: '24', example: '1', descKey: 'apiDocs.params.perPage', descArgs: { max } })
const lang: ApiParam = { name: 'lang', in: 'query', type: 'string', descKey: 'apiDocs.params.lang' }

const names: ApiField = { name: 'name / localized_name', type: 'string', descKey: 'apiDocs.fields.names' }

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    id: 'trophies-browse',
    group: 'trophies',
    method: 'GET',
    path: '/trophies',
    titleKey: 'apiDocs.endpoints.trophiesBrowse.title',
    descKey: 'apiDocs.endpoints.trophiesBrowse.description',
    paginated: true,
    params: [
      { name: 'q', in: 'query', type: 'string', example: 'horizon', descKey: 'apiDocs.params.qTrophies' },
      { name: 'sort', in: 'query', type: 'string', default: 'newest', options: ['newest', 'trending', 'popular'], descKey: 'apiDocs.params.sortTrophies' },
      { name: 'platform[]', in: 'query', type: 'string[]', options: TROPHY_PLATFORMS, descKey: 'apiDocs.params.platformTrophies' },
      { name: 'has_platinum', in: 'query', type: 'boolean', options: ['true', 'false'], descKey: 'apiDocs.params.hasPlatinum' },
      page,
      perPage(100),
      lang,
    ],
    fields: [
      { name: 'id', type: 'integer', descKey: 'apiDocs.fields.trophySetId' },
      { name: 'np_communication_id', type: 'string', descKey: 'apiDocs.fields.npwr' },
      names,
      { name: 'platform', type: 'string[]', descKey: 'apiDocs.fields.platform' },
      { name: 'icon_url', type: 'string', descKey: 'apiDocs.fields.icon' },
      { name: 'defined_trophies', type: 'object', descKey: 'apiDocs.fields.definedTrophies' },
      { name: 'owners', type: 'integer', descKey: 'apiDocs.fields.owners' },
      { name: 'platinum_rate / completion_rate', type: 'number | null', descKey: 'apiDocs.fields.rates' },
      { name: 'median_completion_time', type: 'integer | null', descKey: 'apiDocs.fields.medianTime' },
    ],
    errors: [{ status: 422, code: 'VALIDATION_FAILED' }],
    example: examples.trophiesBrowse,
  },
  {
    id: 'trophies-show',
    group: 'trophies',
    method: 'GET',
    path: '/trophies/{id}',
    titleKey: 'apiDocs.endpoints.trophiesShow.title',
    descKey: 'apiDocs.endpoints.trophiesShow.description',
    params: [
      { name: 'id', in: 'path', type: 'integer', required: true, example: '5059', descKey: 'apiDocs.params.trophySetId' },
      { name: 'psnid', in: 'query', type: 'string', descKey: 'apiDocs.params.psnidProgress' },
      lang,
    ],
    fields: [
      { name: 'trophy_set', type: 'object', descKey: 'apiDocs.fields.trophySet' },
      { name: 'display_language', type: 'string', descKey: 'apiDocs.fields.displayLanguage' },
      { name: 'available_languages', type: 'array', descKey: 'apiDocs.fields.availableLanguages' },
      { name: 'groups', type: 'array', descKey: 'apiDocs.fields.groups' },
      { name: 'groups[].trophies', type: 'array', descKey: 'apiDocs.fields.trophies' },
      { name: 'recent_players', type: 'array', descKey: 'apiDocs.fields.recentPlayers' },
      { name: 'game', type: 'object | null', descKey: 'apiDocs.fields.game' },
      { name: 'series', type: 'array', descKey: 'apiDocs.fields.seriesList' },
      { name: 'viewer_progress', type: 'object | null', descKey: 'apiDocs.fields.viewerProgress' },
    ],
    errors: [{ status: 404, code: 'TROPHY_SET_NOT_FOUND' }],
    example: examples.trophiesShow,
  },
  {
    id: 'profile-show',
    group: 'profile',
    method: 'GET',
    path: '/profile/{psnid}',
    titleKey: 'apiDocs.endpoints.profileShow.title',
    descKey: 'apiDocs.endpoints.profileShow.description',
    params: [
      { name: 'psnid', in: 'path', type: 'string', required: true, example: 'abyssmoe', descKey: 'apiDocs.params.psnidPath' },
      { ...lang, descKey: 'apiDocs.params.langTips' },
    ],
    fields: [
      { name: 'psnid', type: 'string', descKey: 'apiDocs.fields.psnid' },
      { name: 'avatar_url', type: 'string', descKey: 'apiDocs.fields.avatar' },
      { name: 'country', type: 'string | null', descKey: 'apiDocs.fields.country' },
      { name: 'trophy_level / progress', type: 'integer', descKey: 'apiDocs.fields.level' },
      { name: 'platinum / gold / silver / bronze', type: 'integer', descKey: 'apiDocs.fields.tierCounts' },
      { name: 'points', type: 'integer', descKey: 'apiDocs.fields.points' },
      { name: 'rank / server_rank', type: 'integer | null', descKey: 'apiDocs.fields.rank' },
      { name: 'is_profile_public', type: 'boolean', descKey: 'apiDocs.fields.isPublic' },
      { name: 'calendar', type: 'array | null', descKey: 'apiDocs.fields.calendar' },
      { name: 'recent_tips', type: 'array | null', descKey: 'apiDocs.fields.recentTips' },
    ],
    errors: [
      { status: 404, code: 'USER_NOT_FOUND' },
      { status: 410, code: 'USER_BANNED' },
    ],
    example: examples.profileShow,
  },
  {
    id: 'games-browse',
    group: 'games',
    method: 'GET',
    path: '/games',
    titleKey: 'apiDocs.endpoints.gamesBrowse.title',
    descKey: 'apiDocs.endpoints.gamesBrowse.description',
    paginated: true,
    params: [
      { name: 'q', in: 'query', type: 'string', example: 'horizon', descKey: 'apiDocs.params.qGames' },
      { name: 'platform[]', in: 'query', type: 'string[]', descKey: 'apiDocs.params.platformGames' },
      page,
      perPage(100),
      lang,
    ],
    fields: [
      { name: 'id', type: 'integer', descKey: 'apiDocs.fields.gameId' },
      names,
      { name: 'cover', type: 'object | null', descKey: 'apiDocs.fields.cover' },
      { name: 'first_release_date', type: 'string | null', descKey: 'apiDocs.fields.releaseDate' },
      { name: 'platforms', type: 'array', descKey: 'apiDocs.fields.platforms' },
      { name: 'trophy_set_count', type: 'integer', descKey: 'apiDocs.fields.trophySetCount' },
    ],
    errors: [{ status: 422, code: 'VALIDATION_FAILED' }],
    example: examples.gamesBrowse,
  },
  {
    id: 'games-show',
    group: 'games',
    method: 'GET',
    path: '/games/{id}',
    titleKey: 'apiDocs.endpoints.gamesShow.title',
    descKey: 'apiDocs.endpoints.gamesShow.description',
    params: [
      { name: 'id', in: 'path', type: 'integer', required: true, example: '6679', descKey: 'apiDocs.params.gameId' },
      lang,
    ],
    fields: [
      { name: 'summary / localized_summary', type: 'string | null', descKey: 'apiDocs.fields.summary' },
      { name: 'aliases', type: 'string[]', descKey: 'apiDocs.fields.aliases' },
      { name: 'releases', type: 'array', descKey: 'apiDocs.fields.releases' },
      { name: 'links', type: 'array', descKey: 'apiDocs.fields.links' },
      { name: 'trophy_sets', type: 'array', descKey: 'apiDocs.fields.trophySets' },
      { name: 'series', type: 'array', descKey: 'apiDocs.fields.seriesList' },
    ],
    errors: [{ status: 404, code: 'GAME_NOT_FOUND' }],
    example: examples.gamesShow,
  },
  {
    id: 'series-browse',
    group: 'series',
    method: 'GET',
    path: '/series',
    titleKey: 'apiDocs.endpoints.seriesBrowse.title',
    descKey: 'apiDocs.endpoints.seriesBrowse.description',
    paginated: true,
    params: [
      { name: 'q', in: 'query', type: 'string', example: 'horizon', descKey: 'apiDocs.params.qSeries' },
      { name: 'sort', in: 'query', type: 'string', default: 'popular', options: ['popular', 'recent', 'name'], descKey: 'apiDocs.params.sortSeries' },
      page,
      perPage(60),
      lang,
    ],
    fields: [
      { name: 'id', type: 'integer', descKey: 'apiDocs.fields.seriesId' },
      names,
      { name: 'covers', type: 'string[]', descKey: 'apiDocs.fields.covers' },
      { name: 'stage_count / side_count', type: 'integer', descKey: 'apiDocs.fields.stageCounts' },
      { name: 'trophy_set_count', type: 'integer', descKey: 'apiDocs.fields.seriesTrophySetCount' },
      { name: 'popularity', type: 'integer', descKey: 'apiDocs.fields.popularity' },
      { name: 'first_year / last_year', type: 'integer | null', descKey: 'apiDocs.fields.years' },
    ],
    errors: [{ status: 422, code: 'VALIDATION_FAILED' }],
    example: examples.seriesBrowse,
  },
  {
    id: 'series-show',
    group: 'series',
    method: 'GET',
    path: '/series/{id}',
    titleKey: 'apiDocs.endpoints.seriesShow.title',
    descKey: 'apiDocs.endpoints.seriesShow.description',
    params: [
      { name: 'id', in: 'path', type: 'integer', required: true, example: '860', descKey: 'apiDocs.params.seriesId' },
      { name: 'psnid', in: 'query', type: 'string', descKey: 'apiDocs.params.psnidSeries' },
      lang,
    ],
    fields: [
      { name: 'description', type: 'string | null', descKey: 'apiDocs.fields.description' },
      { name: 'tier_totals', type: 'object', descKey: 'apiDocs.fields.tierTotals' },
      { name: 'stages', type: 'array', descKey: 'apiDocs.fields.stages' },
      { name: 'stages[].entries', type: 'array', descKey: 'apiDocs.fields.entries' },
      { name: 'viewer', type: 'object | null', descKey: 'apiDocs.fields.viewer' },
    ],
    errors: [{ status: 404, code: 'SERIES_NOT_FOUND' }],
    example: examples.seriesShow,
  },
]

/** Shared error responses, shown in the overview sections. */
export const API_ERROR_EXAMPLES = {
  notFound: examples.notFound,
  validation: examples.validation,
}

/** Every error code the documented endpoints can return, for the reference table. */
export const API_ERROR_CODES: (ApiErrorRef & { descKey: string })[] = [
  { status: 404, code: 'NOT_FOUND', descKey: 'apiDocs.errors.codes.notFound' },
  { status: 404, code: 'TROPHY_SET_NOT_FOUND', descKey: 'apiDocs.errors.codes.trophySetNotFound' },
  { status: 404, code: 'USER_NOT_FOUND', descKey: 'apiDocs.errors.codes.userNotFound' },
  { status: 410, code: 'USER_BANNED', descKey: 'apiDocs.errors.codes.userBanned' },
  { status: 404, code: 'GAME_NOT_FOUND', descKey: 'apiDocs.errors.codes.gameNotFound' },
  { status: 404, code: 'SERIES_NOT_FOUND', descKey: 'apiDocs.errors.codes.seriesNotFound' },
  { status: 405, code: 'METHOD_NOT_ALLOWED', descKey: 'apiDocs.errors.codes.methodNotAllowed' },
  { status: 422, code: 'VALIDATION_FAILED', descKey: 'apiDocs.errors.codes.validationFailed' },
  { status: 500, code: 'INTERNAL_ERROR', descKey: 'apiDocs.errors.codes.internal' },
]

export type ApiParamValues = Record<string, string>

/** The values the samples use: each parameter's `example`, or blank. */
export function exampleValues(endpoint: ApiEndpoint): ApiParamValues {
  return Object.fromEntries(endpoint.params.map(param => [param.name, param.example ?? '']))
}

/** Required path parameters left blank. */
export function missingPathParams(endpoint: ApiEndpoint, values: ApiParamValues): string[] {
  return endpoint.params
    .filter(param => param.in === 'path' && !values[param.name]?.trim())
    .map(param => param.name)
}

/** `path` with each `{name}` replaced by its encoded value. */
export function resolvePath(path: string, values: ApiParamValues): string {
  return path.replace(/\{(\w+)\}/g, (_, name: string) => encodeURIComponent(values[name]?.trim() ?? ''))
}

/**
 * Query pairs in declaration order. Blank values are left out, and an array
 * parameter (`platform[]`) takes a comma-separated value and repeats per item.
 */
export function queryPairs(endpoint: ApiEndpoint, values: ApiParamValues): [string, string][] {
  const pairs: [string, string][] = []
  for (const param of endpoint.params) {
    if (param.in !== 'query') continue
    const raw = values[param.name]?.trim() ?? ''
    if (!raw) continue
    const items = param.name.endsWith('[]') ? raw.split(',').map(item => item.trim()).filter(Boolean) : [raw]
    for (const item of items) pairs.push([param.name, item])
  }
  return pairs
}

function joinBase(base: string, path: string) {
  return base.replace(/\/+$/, '') + path
}

/** The full request URL, query string encoded. */
export function requestUrl(base: string, endpoint: ApiEndpoint, values: ApiParamValues): string {
  const url = joinBase(base, resolvePath(endpoint.path, values))
  const query = new URLSearchParams(queryPairs(endpoint, values)).toString()
  return query ? `${url}?${query}` : url
}

/** POSIX single-quote a shell word. */
function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

/** JS single-quoted string literal. */
function jsString(value: string) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'')}'`
}

/**
 * A curl command for the request. Query parameters go through
 * `--get --data-urlencode`, which encodes them and keeps curl from reading the
 * `[]` in `platform[]` as a URL glob.
 */
export function curlCommand(base: string, endpoint: ApiEndpoint, values: ApiParamValues): string {
  const url = joinBase(base, resolvePath(endpoint.path, values))
  const pairs = queryPairs(endpoint, values)
  if (!pairs.length) return `curl ${shellQuote(url)}`
  return [`curl --get ${shellQuote(url)}`, ...pairs.map(([name, value]) => `  --data-urlencode ${shellQuote(`${name}=${value}`)}`)].join(' \\\n')
}

/** A browser / Node 18+ `fetch` snippet for the request. */
export function fetchSnippet(base: string, endpoint: ApiEndpoint, values: ApiParamValues): string {
  const url = joinBase(base, resolvePath(endpoint.path, values))
  const pairs = queryPairs(endpoint, values)
  const result = endpoint.paginated ? '{ data, meta }' : '{ data }'
  if (!pairs.length) {
    return [`const res = await fetch(${jsString(url)})`, `const ${result} = await res.json()`].join('\n')
  }
  return [
    `const url = new URL(${jsString(url)})`,
    ...pairs.map(([name, value]) => `url.searchParams.append(${jsString(name)}, ${jsString(value)})`),
    '',
    'const res = await fetch(url)',
    `const ${result} = await res.json()`,
  ].join('\n')
}
