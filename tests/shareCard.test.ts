import { describe, expect, it } from 'vitest'
import { SHARE_CARD_VERSION, shareCardUrl } from '~/utils/shareCard'

describe('share card URLs', () => {
  it('builds the card route under the card host, without a version', () => {
    expect(shareCardUrl('https://api.psray.net', 'profile', 'abyssmoe')).toBe('https://api.psray.net/card/profile/abyssmoe.png')
    expect(shareCardUrl('https://api.psray.net', 'trophies', 42)).toBe('https://api.psray.net/card/trophies/42.png')
  })

  it('tolerates a trailing slash on the host and encodes the slug', () => {
    expect(shareCardUrl('https://api.psray.net//', 'profile', 'a b')).toBe('https://api.psray.net/card/profile/a%20b.png')
  })

  it('keeps a version per card kind', () => {
    expect(SHARE_CARD_VERSION).toEqual({ profile: 4, trophies: 3 })
  })
})
