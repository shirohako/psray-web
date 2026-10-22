import { describe, expect, it } from 'vitest'
import type { Profile } from '~/services/profile'
import { earnedTiers, formatHourInterval, levelTier, platformLabel, profilePageJsonLd, resolveHourInterval, stopwatch, toIsoDate } from '~/utils/profile'

const compact = (value: string | null) => value?.replace(/\s/g, '')

describe('profile formatting', () => {
  it('preserves PSPC as a distinct platform label', () => {
    expect(platformLabel('PSPC')).toBe('PSPC')
    expect(platformLabel('PSP')).toBe('PSP')
    expect(platformLabel('PSVITA')).toBe('PSV')
  })

  it('formats hour-based sync intervals without rounding', () => {
    expect(compact(formatHourInterval(1, 'ja-JP'))).toBe('1時間')
    expect(compact(formatHourInterval(24, 'ja-JP'))).toBe('1日')
    expect(compact(formatHourInterval(168, 'ja-JP'))).toBe('1週間')
    expect(compact(formatHourInterval(720, 'ja-JP'))).toBe('30日')
    expect(compact(formatHourInterval(8760, 'ja-JP'))).toBe('1年')
  })

  it('treats non-positive or missing intervals as unscheduled', () => {
    expect(formatHourInterval(0, 'ja-JP')).toBeNull()
    expect(formatHourInterval(null, 'ja-JP')).toBeNull()
  })

  it('resolves intervals for localized profile copy', () => {
    expect(resolveHourInterval(1)).toEqual({ amount: 1, unit: 'hour' })
    expect(resolveHourInterval(24)).toEqual({ amount: 1, unit: 'day' })
    expect(resolveHourInterval(168)).toEqual({ amount: 1, unit: 'week' })
    expect(resolveHourInterval(336)).toEqual({ amount: 2, unit: 'week' })
    expect(resolveHourInterval(8760)).toEqual({ amount: 1, unit: 'year' })
  })

  it('turns API timestamps into zoned ISO strings for <LocalTime>', () => {
    expect(toIsoDate('2026-08-10T15:23:07.000000Z')).toBe('2026-08-10T15:23:07.000Z')
    expect(toIsoDate(1_786_000_000)).toBe('2026-08-06T07:06:40.000Z')
    expect(toIsoDate(null)).toBeNull()
    expect(toIsoDate('')).toBeNull()
    expect(toIsoDate('not a date')).toBeNull()
  })

  it('reads durations like a stopwatch, keeping seconds', () => {
    expect(stopwatch(32_232)).toEqual({ days: 0, time: '8:57:12' })
    expect(stopwatch(59)).toEqual({ days: 0, time: '0:00:59' })
    expect(stopwatch(86_400 + 5 * 3600 + 610)).toEqual({ days: 1, time: '05:10:10' })
    expect(stopwatch(400 * 86_400 + 0.9)).toEqual({ days: 400, time: '00:00:00' })
    expect(stopwatch(-5)).toEqual({ days: 0, time: '0:00:00' })
  })

  it('lists earned counts per tier from platinum down, with each tier\'s dot', () => {
    expect(earnedTiers({ earned_platinum: 1, earned_gold: 2, earned_silver: 3, earned_bronze: 4 })).toEqual([
      { dot: 'bg-cyan-400', count: 1 },
      { dot: 'bg-amber-400', count: 2 },
      { dot: 'bg-slate-400', count: 3 },
      { dot: 'bg-orange-400', count: 4 },
    ])
  })

  it('maps trophy levels to the PlayStation level tiers', () => {
    expect(levelTier(1)).toBe('bronze')
    expect(levelTier(299)).toBe('bronze')
    expect(levelTier(300)).toBe('silver')
    expect(levelTier(599)).toBe('silver')
    expect(levelTier(600)).toBe('gold')
    expect(levelTier(998)).toBe('gold')
    expect(levelTier(999)).toBe('platinum')
    expect(levelTier(1500)).toBe('platinum')
  })
})

describe('profile structured data', () => {
  const profile = {
    psnid: 'player',
    avatar_url: 'https://img.example/avatar.webp',
    about_me: '',
    is_profile_public: true,
    registered_at: '2026-06-30T22:37:57.000000Z',
    follower_count: 3,
    following_count: 5,
    tip_count: 7,
  } as Profile
  const url = 'https://psray.net/p/player'

  it('describes a registered public profile as a ProfilePage about its player', () => {
    expect(profilePageJsonLd(profile, url, 'ja-JP')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      'url': url,
      'dateCreated': '2026-06-30T22:37:57.000Z',
      'inLanguage': 'ja-JP',
      'mainEntity': {
        '@id': `${url}#person`,
        '@type': 'Person',
        'name': 'player',
        'identifier': 'player',
        'url': url,
        'image': 'https://img.example/avatar.webp',
        'interactionStatistic': [
          { '@type': 'InteractionCounter', 'interactionType': 'https://schema.org/FollowAction', 'userInteractionCount': 3 },
        ],
        'agentInteractionStatistic': [
          { '@type': 'InteractionCounter', 'interactionType': 'https://schema.org/FollowAction', 'userInteractionCount': 5 },
          { '@type': 'InteractionCounter', 'interactionType': 'https://schema.org/WriteAction', 'userInteractionCount': 7 },
        ],
      },
    })
  })

  it('adds the about text when there is one', () => {
    const data = profilePageJsonLd({ ...profile, about_me: 'Hello' }, url, 'en-US')
    expect((data?.mainEntity as Record<string, unknown>).description).toBe('Hello')
  })

  it('advertises nothing for private or unregistered profiles', () => {
    expect(profilePageJsonLd({ ...profile, is_profile_public: false }, url, 'ja-JP')).toBeNull()
    expect(profilePageJsonLd({ ...profile, registered_at: null }, url, 'ja-JP')).toBeNull()
  })

  it('leaves out an unreadable registration date', () => {
    const data = profilePageJsonLd({ ...profile, registered_at: 'not a date' }, url, 'ja-JP')
    expect(JSON.parse(JSON.stringify(data))).not.toHaveProperty('dateCreated')
  })
})
