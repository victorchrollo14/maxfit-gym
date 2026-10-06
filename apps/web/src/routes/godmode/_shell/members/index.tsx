import { createFileRoute } from '@tanstack/react-router'
import { Members } from '@/godmode/members/Members'
import { parseMemberFilters } from '@/godmode/members/filters'

export const Route = createFileRoute('/godmode/_shell/members/')({
  validateSearch: parseMemberFilters,
  component: Members,
})
