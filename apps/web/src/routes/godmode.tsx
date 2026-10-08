import { createFileRoute } from '@tanstack/react-router'
import { Godmode } from '@/godmode/Godmode'

/* The CRM is signed-in only and its session lives in localStorage, so there's
   nothing for the server to render. Every route below inherits this. */
export const Route = createFileRoute('/godmode')({
  ssr: false,
  head: () => ({
    meta: [
      { title: 'Godmode — maxfit' },
    ],
  }),
  component: Godmode,
})
