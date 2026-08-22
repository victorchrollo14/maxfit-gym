import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import {
  Button,
  Drawer,
  Dropdown,
  Label,
  Separator,
  Spinner,
  Toast,
  cn,
} from '@heroui/react'
import {
  LuLayoutDashboard,
  LuLogOut,
  LuRefreshCw,
  LuShield,
  LuTarget,
  LuUser,
} from 'react-icons/lu'
import { Logo } from '../components/Logo'
import { getSupabase } from '../lib/supabase'
import { GodmodeContext } from './context'
import { hasClaim, useSession } from './session'

type NavItem = {
  label: string
  to: string
  icon: ComponentType<{ className?: string }>
}

function NavItems({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active =
          item.to === '/godmode'
            ? pathname === '/godmode'
            : pathname.startsWith(item.to)
        const Icon = item.icon
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted hover:bg-surface hover:text-foreground',
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function UserMenu({ email }: { email?: string }) {
  const signOut = useCallback(async () => {
    const { error } = await getSupabase().auth.signOut()
    if (error) Toast.toast.danger('Could not sign out.')
  }, [])

  const refresh = useCallback(async () => {
    const { error } = await getSupabase().auth.refreshSession()
    if (error) {
      Toast.toast.danger('Could not refresh the session.')
      return
    }
    window.location.reload()
  }, [])

  return (
    <Dropdown className="w-full">
      <Dropdown.Trigger className="w-full">
        <div className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground">
          <LuUser className="size-[18px] shrink-0" />
          <span className="truncate font-medium">
            {email?.split('@')[0] ?? 'Account'}
          </span>
        </div>
      </Dropdown.Trigger>
      <Dropdown.Popover placement="top start">
        <Dropdown.Menu aria-label="Account">
          <Dropdown.Item id="refresh" textValue="Refresh session" onAction={refresh}>
            <LuRefreshCw />
            <Label>Refresh session</Label>
          </Dropdown.Item>
          <Dropdown.Item id="signout" textValue="Sign out" onAction={signOut}>
            <LuLogOut />
            <Label>Sign out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}

export function Layout() {
  const { session, loading } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isAdmin = hasClaim(session, 'admin')
  const isClaimsAdmin = hasClaim(session, 'claims_admin')
  const allowed = isAdmin || isClaimsAdmin

  useEffect(() => {
    if (loading || session) return
    const back = encodeURIComponent(location.pathname + location.searchStr)
    navigate({ to: '/godmode/login', search: { continue: back }, replace: true })
  }, [loading, session, navigate, location])

  const items = useMemo(() => {
    const nav: NavItem[] = []
    if (isAdmin) {
      nav.push({ label: 'Dashboard', to: '/godmode', icon: LuLayoutDashboard })
      nav.push({ label: 'Leads', to: '/godmode/leads', icon: LuTarget })
    }
    if (isClaimsAdmin) {
      nav.push({ label: 'Claims', to: '/godmode/claims', icon: LuShield })
    }
    return nav
  }, [isAdmin, isClaimsAdmin])

  if (loading || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="display text-2xl">No access</h1>
        <p className="text-sm text-pretty text-muted">
          {session.user.email} is signed in but has no staff claims yet.
        </p>
        <Button
          variant="secondary"
          onPress={() => getSupabase().auth.signOut()}
        >
          Sign out
        </Button>
      </div>
    )
  }

  const sidebar = (onNavigate?: () => void) => (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2 px-5">
        <Logo className="h-7" />
        <span className="eyebrow text-[10px] text-muted">admin</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <NavItems
          items={items}
          pathname={location.pathname}
          onNavigate={onNavigate}
        />
      </nav>
      <Separator />
      <div className="px-2 py-2">
        <UserMenu email={session.user.email} />
      </div>
    </>
  )

  return (
    <GodmodeContext
      value={{ session, openSidebar: () => setDrawerOpen(true) }}
    >
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-background lg:flex">
        {sidebar()}
      </aside>

      <Drawer.Backdrop isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content placement="left" className="w-64">
          <Drawer.Dialog
            aria-label="Godmode menu"
            className="flex flex-col items-start p-0"
          >
            {sidebar(() => setDrawerOpen(false))}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <main className="min-h-dvh lg:pl-56">
        <Outlet />
      </main>
    </GodmodeContext>
  )
}
