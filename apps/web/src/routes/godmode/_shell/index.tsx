import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '@/godmode/Dashboard'

export const Route = createFileRoute('/godmode/_shell/')({
  component: Dashboard,
})
