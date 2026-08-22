import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase } from '../lib/supabase'

export const CLAIMS = ['admin', 'plans_admin', 'claims_admin'] as const

export type Claim = (typeof CLAIMS)[number]

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabase()
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}

export function claimsOf(session: Session | null) {
  return (session?.user.app_metadata ?? {}) as Record<string, unknown>
}

export function hasClaim(session: Session | null, claim: string) {
  return claimsOf(session)[claim] === true
}

export function activeClaims(metadata: Record<string, unknown>) {
  return CLAIMS.filter((claim) => metadata[claim] === true)
}
