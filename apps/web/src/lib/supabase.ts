import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

/* Created on first use, not at module load: `createClient` throws when the env
   vars are missing, and this module is reached from the hero form, so a
   mistyped Vercel variable would white-screen the landing page. */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY',
    )
  }
  client ??= createClient(url, anonKey, {
    auth: { detectSessionInUrl: false, persistSession: true },
  })
  return client
}

export const isSupabaseConfigured = Boolean(url && anonKey)

if (import.meta.env.DEV && !isSupabaseConfigured) {
  console.warn(
    'Supabase env vars missing — the free-trial form will fail. Copy apps/web/.env.example to .env.local.',
  )
}
