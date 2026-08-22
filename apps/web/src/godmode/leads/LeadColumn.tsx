import { Virtuoso } from 'react-virtuoso'
import { LeadCard } from './LeadCard'
import type { Lead } from './shared'

export function LeadColumn({
  leads,
  onOpen,
}: {
  leads: Lead[]
  onOpen: (lead: Lead) => void
}) {
  return (
    <div className="h-full w-full flex-1">
      <Virtuoso
        className="h-full"
        data={leads}
        itemContent={(_, lead) => (
          <div className="px-3 py-1.5">
            <LeadCard lead={lead} onOpen={onOpen} />
          </div>
        )}
      />
    </div>
  )
}
