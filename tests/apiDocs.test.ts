import { describe, expect, it } from 'vitest'
import {
  API_ENDPOINTS,
  curlCommand,
  exampleValues,
  fetchSnippet,
  missingPathParams,
  queryPairs,
  requestUrl,
  resolvePath,
  type ApiEndpoint,
} from '~/utils/apiDocs'
import { tokenizeLine } from '~/utils/codeTokens'

const BASE = 'https://api.psray.net'
const endpoint = (id: string): ApiEndpoint => API_ENDPOINTS.find(e => e.id === id)!

describe('api docs endpoints', () => {
  it('give every path parameter an example, so the samples and Try it work as shipped', () => {
    for (const e of API_ENDPOINTS) {
      const pathParams = [...e.path.matchAll(/\{(\w+)\}/g)].map(m => m[1])
      expect(e.params.filter(p => p.in === 'path').map(p => p.name), e.id).toEqual(pathParams)
      expect(missingPathParams(e, exampleValues(e)), e.id).toEqual([])
    }
  })

  it('use unique anchor ids', () => {
    const ids = API_ENDPOINTS.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ship an example response with a data envelope', () => {
    for (const e of API_ENDPOINTS) {
      expect(e.example, e.id).toHaveProperty('data')
      if (e.paginated) expect(e.example, e.id).toHaveProperty('meta.total')
    }
  })
})

describe('request building', () => {
  it('encodes path parameters', () => {
    expect(resolvePath('/profile/{psnid}', { psnid: ' a b/c ' })).toBe('/profile/a%20b%2Fc')
  })

  it('reports blank path parameters', () => {
    expect(missingPathParams(endpoint('trophies-show'), { id: ' ' })).toEqual(['id'])
  })

  it('drops blank query values and splits array parameters on commas', () => {
    const pairs = queryPairs(endpoint('trophies-browse'), { 'q': 'horizon', 'sort': '', 'platform[]': 'PS5, PS4,,', 'page': '2' })
    expect(pairs).toEqual([['q', 'horizon'], ['platform[]', 'PS5'], ['platform[]', 'PS4'], ['page', '2']])
  })

  it('builds the full URL, with or without a query', () => {
    expect(requestUrl(`${BASE}/`, endpoint('games-show'), { id: '6679', lang: '' })).toBe(`${BASE}/games/6679`)
    expect(requestUrl(BASE, endpoint('trophies-browse'), { 'q': 'final fantasy', 'platform[]': 'PS5' }))
      .toBe(`${BASE}/trophies?q=final+fantasy&platform%5B%5D=PS5`)
  })

  it('writes curl with --data-urlencode so [] is never globbed', () => {
    expect(curlCommand(BASE, endpoint('trophies-show'), { id: '5059' })).toBe(`curl '${BASE}/trophies/5059'`)
    expect(curlCommand(BASE, endpoint('trophies-browse'), { 'q': "it's", 'platform[]': 'PS5' })).toBe([
      `curl --get '${BASE}/trophies' \\`,
      `  --data-urlencode 'q=it'\\''s' \\`,
      `  --data-urlencode 'platform[]=PS5'`,
    ].join('\n'))
  })

  it('writes fetch snippets that destructure meta only for lists', () => {
    expect(fetchSnippet(BASE, endpoint('series-show'), { id: '860' })).toBe([
      `const res = await fetch('${BASE}/series/860')`,
      'const { data } = await res.json()',
    ].join('\n'))
    expect(fetchSnippet(BASE, endpoint('games-browse'), { q: 'horizon', per_page: '1' })).toBe([
      `const url = new URL('${BASE}/games')`,
      `url.searchParams.append('q', 'horizon')`,
      `url.searchParams.append('per_page', '1')`,
      '',
      'const res = await fetch(url)',
      'const { data, meta } = await res.json()',
    ].join('\n'))
  })
})

describe('code tokens', () => {
  const kinds = (line: string, language: Parameters<typeof tokenizeLine>[1]) =>
    tokenizeLine(line, language).filter(t => t.text.trim()).map(t => [t.text.trim(), t.kind])

  it('tells JSON keys from string values', () => {
    expect(kinds('  "name": "Horizon", "owners": 30142, "region": null,', 'json')).toEqual([
      ['"name"', 'key'], [':', 'punct'], ['"Horizon"', 'string'], [',', 'punct'],
      ['"owners"', 'key'], [':', 'punct'], ['30142', 'number'], [',', 'punct'],
      ['"region"', 'key'], [':', 'punct'], ['null', 'literal'], [',', 'punct'],
    ])
  })

  it('colours curl commands', () => {
    expect(kinds(`curl --get 'https://api.psray.net/games' \\`, 'bash')).toEqual([
      ['curl', 'command'], ['--get', 'flag'], [`'https://api.psray.net/games'`, 'string'], ['\\', 'punct'],
    ])
  })

  it('does not treat keywords inside identifiers as keywords', () => {
    expect(kinds('const constant = await fetch(url)', 'js')).toEqual([
      ['const', 'keyword'], ['constant', 'plain'], ['=', 'punct'], ['await', 'keyword'],
      ['fetch', 'plain'], ['(', 'punct'], ['url', 'plain'], [')', 'punct'],
    ])
  })

  it('keeps every character', () => {
    const line = `  url.searchParams.append('platform[]', 'PS5') // ok`
    expect(tokenizeLine(line, 'js').map(t => t.text).join('')).toBe(line)
  })
})
