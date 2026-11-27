import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_META,
  ACCOUNT_PLATFORMS,
  accountInput,
  accountLabel,
  accountsPayload,
  isInvalidDraft,
  normalizeAccount,
  sameDrafts,
  toDrafts,
} from '~/utils/profileAccounts'

// The same cases as psray-api `ProfileShowcaseTest` / `ProfileAccounts`: the two must agree.
describe('normalizeAccount', () => {
  it.each([
    ['nintendo', ' sw 4182 7730 5921 ', 'SW-4182-7730-5921'],
    ['nintendo', '123456789012', 'SW-1234-5678-9012'],
    ['steam', 'https://steamcommunity.com/id/abyssmoe/', 'id/abyssmoe'],
    ['steam', 'steamcommunity.com/profiles/76561198000000000/games', 'profiles/76561198000000000'],
    ['steam', 'abyssmoe', 'id/abyssmoe'],
    ['steam', '76561198000000000', 'profiles/76561198000000000'],
    ['xbox', 'Abyss  Moe', 'Abyss Moe'],
    ['xbox', 'Abyss#1234', 'Abyss#1234'],
    ['xbox', 'ゆめ', 'ゆめ'],
    ['x', '@abyssmoe', 'abyssmoe'],
    ['x', 'https://twitter.com/abyssmoe/status/1', 'abyssmoe'],
    ['instagram', 'instagram.com/abyss.moe?igsh=x', 'abyss.moe'],
    ['facebook', 'https://m.facebook.com/profile.php?id=100012345678901', '100012345678901'],
    ['facebook', 'fb.com/abyss.moe', 'abyss.moe'],
    ['threads', 'https://www.threads.net/@abyss.moe', 'abyss.moe'],
    ['youtube', 'https://www.youtube.com/@abyssmoe/videos', 'abyssmoe'],
    ['youtube', '@ゆめちゃんねる', 'ゆめちゃんねる'],
    ['bilibili', 'https://space.bilibili.com/3546598?spm_id_from=333', '3546598'],
    ['bilibili', 'm.bilibili.com/space/3546598', '3546598'],
    ['bilibili', 'UID:3546598', '3546598'],
  ] as const)('%s %j → %j', (platform, input, expected) => {
    expect(normalizeAccount(platform, input)).toBe(expected)
  })

  it.each([
    ['nintendo', 'SW-1234-5678'],
    ['nintendo', 'SW-1234-5678-90123'],
    ['steam', 'steamcommunity.com/profiles/123'],
    ['xbox', '#123'],
    ['x', 'a_very_long_handle_1'],
    ['x', 'x.com'],
    ['instagram', 'https://example.com/abyss'],
    ['facebook', 'abc'],
    ['youtube', 'https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv'],
    ['youtube', 'ab'],
    ['bilibili', 'abyssmoe'],
    ['x', '   '],
    ['x', 'a'.repeat(201)],
  ] as const)('%s %j is rejected', (platform, input) => {
    expect(normalizeAccount(platform, input)).toBeNull()
  })
})

describe('accountLabel', () => {
  it('shows each platform the way people write it', () => {
    expect(accountLabel({ platform: 'nintendo', value: 'SW-4182-7730-5921' })).toBe('SW-4182-7730-5921')
    expect(accountLabel({ platform: 'steam', value: 'id/abyssmoe' })).toBe('abyssmoe')
    expect(accountLabel({ platform: 'steam', value: 'profiles/76561198000000000' })).toBe('76561198000000000')
    expect(accountLabel({ platform: 'x', value: 'abyssmoe' })).toBe('@abyssmoe')
    expect(accountLabel({ platform: 'youtube', value: 'abyssmoe' })).toBe('@abyssmoe')
    expect(accountLabel({ platform: 'facebook', value: 'abyss.moe' })).toBe('abyss.moe')
    expect(accountLabel({ platform: 'bilibili', value: '3546598' })).toBe('UID 3546598')
  })
})

describe('settings drafts', () => {
  const saved = [
    { platform: 'nintendo' as const, value: 'SW-4182-7730-5921', url: null },
    { platform: 'x' as const, value: 'abyssmoe', url: 'https://x.com/abyssmoe' },
  ]

  it('leaves the shown prefix out of the input', () => {
    expect(accountInput('nintendo', 'SW-4182-7730-5921')).toBe('4182-7730-5921')
    expect(toDrafts(saved)).toEqual([{ platform: 'nintendo', input: '4182-7730-5921' }, { platform: 'x', input: 'abyssmoe' }])
    // The friend code input, prefix and all, comes back as the same code.
    expect(normalizeAccount('nintendo', '4182-7730-5921')).toBe('SW-4182-7730-5921')
  })

  it('sends normalized values and drops empty rows', () => {
    const drafts = [
      { platform: 'x' as const, input: 'https://x.com/abyssmoe' },
      { platform: 'youtube' as const, input: '  ' },
      { platform: 'nintendo' as const, input: '4182 7730 5921' },
    ]
    expect(drafts.some(isInvalidDraft)).toBe(false)
    expect(accountsPayload(drafts)).toEqual([
      { platform: 'x', value: 'abyssmoe' },
      { platform: 'nintendo', value: 'SW-4182-7730-5921' },
    ])
    expect(isInvalidDraft({ platform: 'bilibili', input: 'abyssmoe' })).toBe(true)
  })

  it('compares by platform, order and input', () => {
    const drafts = toDrafts(saved)
    expect(sameDrafts(drafts, toDrafts(saved))).toBe(true)
    expect(sameDrafts(drafts, [...drafts].reverse())).toBe(false)
    expect(sameDrafts(drafts, [drafts[0]!, { platform: 'x', input: 'other' }])).toBe(false)
  })
})

it('has a brand entry for every platform', () => {
  for (const platform of ACCOUNT_PLATFORMS) {
    expect(ACCOUNT_META[platform].path).toMatch(/^M/)
    expect(ACCOUNT_META[platform].color).toMatch(/^#[0-9A-F]{6}$/)
  }
})
