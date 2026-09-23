import { createFileRoute } from '@tanstack/react-router'
import { Claims } from '../../../godmode/Claims'

export const Route = createFileRoute('/godmode/_shell/claims')({
  component: Claims,
})
