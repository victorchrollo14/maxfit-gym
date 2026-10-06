import { useLayoutEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Toast } from '@heroui/react'
import { isSupabaseConfigured } from '@/lib/supabase'

/* The server renders <html class="dark">, and HeroUI's useTheme only adds its
   own class on load without removing that one, so a saved "light" ended up as
   "dark light" and stayed dark. It also only runs once the sidebar mounts. */
function useSavedTheme() {
  useLayoutEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem('heroui-theme')
    } catch {
      // Storage blocked: keep the dark default.
    }
    const theme =
      saved === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : saved === 'light'
          ? 'light'
          : 'dark'
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.setAttribute('data-theme', theme)
  }, [])
}

export function Godmode() {
  useSavedTheme()

  return (
    <div className="min-h-dvh bg-background text-foreground">
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
      <Toast.Provider placement="top" />
    </div>
  )
}
