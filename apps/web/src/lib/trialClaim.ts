/*
 * Google Ads counts a lead conversion off /trial-claimed, so two separate
 * questions: may they see the page (yes, all session — a refresh to re-read the
 * address shouldn't bounce them), and should the conversion fire (once, ever).
 */

const SEEN_KEY = 'maxfit:trial-claim'
const CONVERSION_KEY = 'maxfit:trial-claim-conversion'

/* Fallback for blocked cookies: the redirect is a client-side navigation, so
   module state survives it. */
let claimedThisPageLoad = false
let conversionFiredThisPageLoad = false

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

function clear(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function markTrialClaimed() {
  claimedThisPageLoad = true
  write(SEEN_KEY, '1')
  write(CONVERSION_KEY, '1')
}

/** To open the page by hand: `sessionStorage.setItem('maxfit:trial-claim', '1')`. */
export function hasTrialClaim(): boolean {
  return claimedThisPageLoad || read(SEEN_KEY) === '1'
}

export function takeConversionToken(): boolean {
  if (conversionFiredThisPageLoad) return false
  const pending = read(CONVERSION_KEY) === '1' || claimedThisPageLoad
  if (!pending) return false
  conversionFiredThisPageLoad = true
  clear(CONVERSION_KEY)
  return true
}
