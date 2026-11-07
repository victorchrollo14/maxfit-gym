import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/config'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { detectSessionInUrl: false, persistSession: true },
  })
  return client
}
