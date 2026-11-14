import { useLayoutEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Toast } from '@heroui/react'

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
      <Outlet />
      <Toast.Provider placement="top" />
    </div>
  )
}
