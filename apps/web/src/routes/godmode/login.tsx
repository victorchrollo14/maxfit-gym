import { createFileRoute } from '@tanstack/react-router'
import { Login } from '@/godmode/Login'

export const Route = createFileRoute('/godmode/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    continue: typeof search.continue === 'string' ? search.continue : undefined,
  }),
  component: Login,
})
