import { describe, expect, it } from 'vitest'
import { tipDraftKey } from '~/utils/trophy'

describe('trophy tip drafts', () => {
  it('keeps the stored key format, so drafts saved earlier are still found', () => {
    expect(tipDraftKey(12, 345)).toBe('trophy-tip-draft:12:345')
    expect(tipDraftKey(12, '345')).toBe('trophy-tip-draft:12:345')
  })
})
