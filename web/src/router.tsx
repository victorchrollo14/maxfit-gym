import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { Landing } from './pages/Landing'
import { TrialClaimed } from './pages/TrialClaimed'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Landing,
})

/* Conversion page for the free-trial forms. Deliberately not linked yet — the
   forms don't submit anywhere until `POST /api/leads` exists. See the note in
   TrialClaimed.tsx before wiring it up. */
const trialClaimedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trial-claimed',
  component: TrialClaimed,
})

const routeTree = rootRoute.addChildren([indexRoute, trialClaimedRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
