import { usePostHog } from '@posthog/react'

export type CtaAction = 'call' | 'whatsapp' | 'instagram' | 'email'

/**
 * `location` is where on the page the button sits — the event is only useful if
 * we can tell the nav's Call now from the one in the sticky bar.
 */
export function useCtaTracker(location: string) {
  const posthog = usePostHog()
  return (action: CtaAction, properties?: Record<string, unknown>) => {
    posthog.capture('cta_clicked', { action, location, ...properties })
  }
}
