/** How strong a password looks, from nothing typed yet to every criterion met. */
export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong'

export interface PasswordStrength {
  /** Criteria met, 0–4. */
  score: number
  level: PasswordStrengthLevel
}

/**
 * A rough strength for the meter under a new-password field: one point each
 * for at least 8 characters, both upper and lower case, a digit, and anything
 * else (a symbol). Only a hint; the API decides what it accepts.
 */
export function passwordStrength(value: string): PasswordStrength {
  if (!value) return { score: 0, level: 'empty' }

  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1

  const level = score <= 1 ? 'weak' : score === 2 ? 'fair' : score === 3 ? 'good' : 'strong'
  return { score, level }
}
