import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from './env'

const options = { auth: { persistSession: false, autoRefreshToken: false } }

function url() {
  return import.meta.env.VITE_SUPABASE_URL ?? env('VITE_SUPABASE_URL')
}

let admin: SupabaseClient | null = null

/** Service-role client: bypasses RLS. Only call it after requireAdmin. */
export function adminSupabase() {
  admin ??= createClient(url(), env('SUPABASE_SECRET_KEY'), options)
  return admin
}

/* A fresh client per call, so the member session verifyOtp creates is dropped
   with it and never shared between requests. */
export function throwawaySupabase() {
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env('VITE_SUPABASE_PUBLISHABLE_KEY')
  return createClient(url(), key, options)
}
