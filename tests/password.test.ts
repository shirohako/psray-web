import { describe, expect, it } from 'vitest'
import { passwordStrength } from '~/utils/password'

describe('password strength', () => {
  it('is empty until something is typed', () => {
    expect(passwordStrength('')).toEqual({ score: 0, level: 'empty' })
  })

  it('scores a point each for length, mixed case, a digit and a symbol', () => {
    expect(passwordStrength('abc')).toEqual({ score: 0, level: 'weak' })
    expect(passwordStrength('abcdefgh')).toEqual({ score: 1, level: 'weak' })
    expect(passwordStrength('abcdEFGH')).toEqual({ score: 2, level: 'fair' })
    expect(passwordStrength('abcdEFG1')).toEqual({ score: 3, level: 'good' })
    expect(passwordStrength('abcdEF1!')).toEqual({ score: 4, level: 'strong' })
  })

  it('needs both cases for the case point, and counts any other character as a symbol', () => {
    expect(passwordStrength('ABCDEFGH').score).toBe(1)
    expect(passwordStrength('short1!')).toEqual({ score: 2, level: 'fair' })
    expect(passwordStrength('パスワード')).toEqual({ score: 1, level: 'weak' })
  })
})
