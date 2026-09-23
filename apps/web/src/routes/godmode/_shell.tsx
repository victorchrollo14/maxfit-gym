import { createFileRoute } from '@tanstack/react-router'
import { Layout } from '../../godmode/Layout'

export const Route = createFileRoute('/godmode/_shell')({
  component: Layout,
})
