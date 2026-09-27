import { createFileRoute } from '@tanstack/react-router'
import { Leads } from '@/godmode/leads/Leads'

export const Route = createFileRoute('/godmode/_shell/leads')({
  component: Leads,
})
