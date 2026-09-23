import { createFileRoute } from '@tanstack/react-router'
import { gym } from '../content'
import { Godmode } from '../godmode/Godmode'

/* The CRM is signed-in only and its session lives in localStorage, so there's
   nothing for the server to render. Every route below inherits this. */
export const Route = createFileRoute('/godmode')({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Godmode — ${gym.name}` },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: Godmode,
})
