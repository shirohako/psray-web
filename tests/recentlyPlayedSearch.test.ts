import { describe, expect, it } from 'vitest'
import { recentlyPlayedPath, validateRecentlyPlayedSearch } from '~/utils/recentlyPlayedSearch'

describe('recently played search', () => {
  it('accepts up to three effective whitespace-delimited keywords', () => {
    expect(validateRecentlyPlayedSearch('  final   fantasy vii  ')).toEqual({
      query: 'final   fantasy vii',
      error: null,
    })
  })

  it('counts Chinese characters as keyword characters', () => {
    expect(validateRecentlyPlayedSearch('最终 幻想')).toEqual({ query: '最终 幻想', error: null })
  })

  it('ignores short words when counting effective keywords', () => {
    expect(validateRecentlyPlayedSearch('a final of fantasy')).toEqual({
      query: 'a final of fantasy',
      error: null,
    })
  })

  it('rejects non-empty input without an effective keyword', () => {
    expect(validateRecentlyPlayedSearch('a b c').error).toBe('noValidKeywords')
  })

  it('rejects more than three effective keywords and input over 100 characters', () => {
    expect(validateRecentlyPlayedSearch('one two three four').error).toBe('tooManyKeywords')
    expect(validateRecentlyPlayedSearch('游'.repeat(101)).error).toBe('tooLong')
  })

  it('serializes q safely alongside the current page', () => {
    expect(recentlyPlayedPath('player/name', 2, '最终 幻想')).toBe(
      '/profile/player%2Fname/recently-played?page=2&q=%E6%9C%80%E7%BB%88+%E5%B9%BB%E6%83%B3',
    )
  })
})
