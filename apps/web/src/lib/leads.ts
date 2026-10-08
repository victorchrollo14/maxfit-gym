/** Returns E.164, or null if it isn't a number we can make sense of. */
export function normalisePhone(raw: string): string | null {
  const trimmed = raw.trim()
  const digits = trimmed.replace(/\D/g, '')

  if (trimmed.startsWith('+')) {
    return /^\+[1-9]\d{7,14}$/.test(`+${digits}`) ? `+${digits}` : null
  }

  const national = digits.replace(/^(?:91|0)/, '')
  return /^[6-9]\d{9}$/.test(national) ? `+91${national}` : null
}
