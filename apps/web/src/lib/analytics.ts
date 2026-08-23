import type { PostHog } from 'posthog-js'

export type CtaAction = 'call' | 'whatsapp' | 'instagram' | 'email'

let client: PostHog | null = null
let status: 'idle' | 'loading' | 'ready' | 'off' = 'idle'
const queued: { name: string; properties?: Record<string, unknown> }[] = []

/**
 * Loads posthog-js on demand. Keeping it out of the entry chunk is the whole
 * point: /godmode never calls this, so the CRM never downloads the ~250kB.
 */
export function startAnalytics() {
  if (status !== 'idle') return

  const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN
  const apiHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST

  if (!apiKey || !apiHost) {
    status = 'off'
    if (import.meta.env.DEV) {
      const missingVariable = apiKey
        ? 'VITE_PUBLIC_POSTHOG_HOST'
        : 'VITE_PUBLIC_POSTHOG_PROJECT_TOKEN'
      throw new Error(
        `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
      )
    }
    return
  }

  status = 'loading'
  import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(apiKey, {
        api_host: apiHost,
        defaults: '2026-01-30',
        capture_exceptions: true,
        debug: import.meta.env.DEV,
        /* Already the default, pinned because the enquiry form takes a name
           and a phone number — nothing typed should reach a replay. */
        session_recording: { maskAllInputs: true },
      })
      client = posthog
      status = 'ready'
      for (const event of queued) posthog.capture(event.name, event.properties)
      queued.length = 0
    })
    .catch((err) => {
      console.error('PostHog failed to load', err)
      status = 'off'
      queued.length = 0
    })
}

/* A click can beat the chunk, so hold events until posthog is up rather than
   dropping the first one. */
export function capture(name: string, properties?: Record<string, unknown>) {
  if (status === 'ready') client?.capture(name, properties)
  else if (status === 'loading') queued.push({ name, properties })
}

/**
 * `location` is where on the page the button sits — the event is only useful if
 * we can tell the nav's Call now from the one in the sticky bar.
 */
export function ctaTracker(location: string) {
  return (action: CtaAction, properties?: Record<string, unknown>) =>
    capture('cta_clicked', { action, location, ...properties })
}
