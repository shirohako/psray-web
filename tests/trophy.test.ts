import { describe, expect, it } from 'vitest'
import { isRareTrophy, tipDraftKey } from '~/utils/trophy'

describe('trophy tip drafts', () => {
  it('keeps the stored key format, so drafts saved earlier are still found', () => {
    expect(tipDraftKey(12, 345)).toBe('trophy-tip-draft:12:345')
    expect(tipDraftKey(12, '345')).toBe('trophy-tip-draft:12:345')
  })
})

describe('rare trophies', () => {
  it('takes a PSN earn rate strictly below 5%, as the API counts difficult trophies', () => {
    expect(isRareTrophy({ psn_earned_rate: 0 })).toBe(true)
    expect(isRareTrophy({ psn_earned_rate: '4.9' })).toBe(true)
    expect(isRareTrophy({ psn_earned_rate: 5 })).toBe(false)
    expect(isRareTrophy({ psn_earned_rate: '5.0' })).toBe(false)
    expect(isRareTrophy({ psn_earned_rate: 'n/a' })).toBe(false)
  })
})
