import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/_layout')({
  component: PublicShell,
})

function PublicShell() {
  return (
    /* Pinned: godmode's theme switch writes light/dark to <html>, and the
       public site's art direction — the hero glows, the outlined display type
       — only reads on near black. Nothing here renders through a portal, so
       pinning the shell is enough to hold every page under it. */
    <div data-theme="dark" className="min-h-dvh bg-background text-foreground">
      <Outlet />
    </div>
  )
}
