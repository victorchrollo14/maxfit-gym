import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { getSupabase } from '@/lib/supabase'
import { adminSupabase } from '@/server/supabase'

/* The CRM session lives in the browser, not a cookie, so the token is sent
   along with each call and checked here: the same admin claim RLS reads. */
export const requireAdmin = createMiddleware({ type: 'function' })
  .client(async ({ next }) => {
    const { data } = await getSupabase().auth.getSession()
    return next({
      headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    })
  })
  .server(async ({ next }) => {
    const token = getRequestHeader('authorization')?.replace(/^Bearer /, '')
    if (!token) throw new Error('Not signed in')

    const { data, error } = await adminSupabase().auth.getClaims(token)
    const claims = (data?.claims.app_metadata ?? {}) as Record<string, unknown>
    if (error || !data || claims.admin !== true) {
      throw new Error('Not allowed')
    }
    return next({ context: { adminId: data.claims.sub, claims } })
  })
