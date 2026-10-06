import { createFileRoute } from '@tanstack/react-router'
import { MemberPage } from '@/godmode/members/MemberPage'

export const Route = createFileRoute('/godmode/_shell/members/$memberId')({
  validateSearch: (search: Record<string, unknown>): { sell?: boolean } =>
    search.sell === true || search.sell === 'true' ? { sell: true } : {},
  component: function Member() {
    const { memberId } = Route.useParams()
    const { sell } = Route.useSearch()
    // Keyed so moving between partners' pages starts from a clean slate.
    return <MemberPage key={memberId} memberId={memberId} sell={sell} />
  },
})
