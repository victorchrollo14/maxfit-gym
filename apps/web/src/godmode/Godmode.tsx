import { Outlet } from '@tanstack/react-router'
import { Toast } from '@heroui/react'
import { gym } from '../content'
import { isSupabaseConfigured } from '../lib/supabase'

export function Godmode() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <title>{`Godmode — ${gym.name}`}</title>
      <meta name="robots" content="noindex, nofollow" />
      {isSupabaseConfigured ? (
        <Outlet />
      ) : (
        <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-2 px-6 text-center">
          <h1 className="display text-2xl">Not configured</h1>
          <p className="text-sm text-muted">
            Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then reload.
          </p>
        </div>
      )}
      <Toast.Provider placement="bottom end" />
    </div>
  )
}
