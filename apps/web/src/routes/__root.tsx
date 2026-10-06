import { useEffect, type ReactNode } from 'react'
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router'
import { startAnalytics } from '@/lib/analytics'
import { siteHead } from '@/seo'
import '@/index.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { name: 'theme-color', content: '#0a0a0a' },
      ...siteHead.meta,
    ],
    links: [
      /* The full lockup is dark-on-dark artwork; Google draws favicons on a
         white chip, so these are the M monogram on its own black square. */
      { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
      { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icon-192.png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ...siteHead.links,
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap',
      },
    ],
    scripts: siteHead.scripts,
  }),
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootDocument({ children }: { children: ReactNode }) {
  return (
    /* HeroUI's theme switch rewrites the class and data-theme on <html> from
       localStorage, so the server's `dark` won't always match. */
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

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
