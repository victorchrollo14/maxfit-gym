import { useEffect } from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import { Landing } from './pages/Landing'
import { TrialClaimed } from './pages/TrialClaimed'
import { startAnalytics } from './lib/analytics'
import { hasTrialClaim } from './lib/trialClaim'

const rootRoute = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  /* Public site only, and loaded rather than imported: posthog-js stays out of
     the entry chunk, so /godmode neither downloads it nor initialises it. The
     CRM's lead names and phone numbers can't reach a session replay. */
  const isAdmin = pathname.startsWith('/godmode')
  useEffect(() => {
    if (!isAdmin) startAnalytics()
  }, [isAdmin])

  return <Outlet />
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Landing,
})

/* Gated so Google Ads can't count a bookmark or a shared link as a second
   lead — see lib/trialClaim.ts. */
const trialClaimedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trial-claimed',
  beforeLoad: () => {
    if (!hasTrialClaim()) throw redirect({ to: '/' })
  },
  component: TrialClaimed,
})

/* Lazy all the way down: none of the admin code, and none of the HeroUI it
   pulls in, reaches a visitor who only sees the landing page. */
const godmodeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/godmode',
  component: lazyRouteComponent(() => import('./godmode/Godmode'), 'Godmode'),
})

const loginRoute = createRoute({
  getParentRoute: () => godmodeRoute,
  path: 'login',
  validateSearch: (search: Record<string, unknown>) => ({
    continue: typeof search.continue === 'string' ? search.continue : undefined,
  }),
  component: lazyRouteComponent(() => import('./godmode/Login'), 'Login'),
})

const shellRoute = createRoute({
  getParentRoute: () => godmodeRoute,
  id: 'shell',
  component: lazyRouteComponent(() => import('./godmode/Layout'), 'Layout'),
})

const dashboardRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/',
  component: lazyRouteComponent(() => import('./godmode/Dashboard'), 'Dashboard'),
})

const leadsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: 'leads',
  component: lazyRouteComponent(() => import('./godmode/leads/Leads'), 'Leads'),
})

const claimsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: 'claims',
  component: lazyRouteComponent(() => import('./godmode/Claims'), 'Claims'),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  trialClaimedRoute,
  godmodeRoute.addChildren([
    loginRoute,
    shellRoute.addChildren([dashboardRoute, leadsRoute, claimsRoute]),
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
