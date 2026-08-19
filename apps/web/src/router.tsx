import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { Landing } from './pages/Landing'
import { TrialClaimed } from './pages/TrialClaimed'
import { hasTrialClaim } from './lib/trialClaim'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

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

const routeTree = rootRoute.addChildren([indexRoute, trialClaimedRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
