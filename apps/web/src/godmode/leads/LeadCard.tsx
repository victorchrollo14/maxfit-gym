import { Card, cn } from '@heroui/react'
import { LuPhone, LuStickyNote } from 'react-icons/lu'
import { FaWhatsapp } from 'react-icons/fa'
import {
  type Lead,
  prettyPhone,
  shortDate,
  sourceLabel,
  waHref,
} from './shared'

export function LeadCard({
  lead,
  onOpen,
}: {
  lead: Lead
  onOpen: (lead: Lead) => void
}) {
  return (
    <Card
      className="w-full cursor-pointer border border-border bg-surface transition-colors hover:border-accent/50"
      onClick={() => onOpen(lead)}
    >
      <Card.Content className="flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold">{lead.name}</h3>
          <span className="shrink-0 text-xs text-muted">
            {shortDate(lead.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="tabular-nums text-sm text-muted">
            {prettyPhone(lead.phone)}
          </span>
          {/* Stop propagation, or tapping call also opens the drawer. */}
          <a
            href={`tel:${lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Call ${lead.name}`}
            className="ml-auto rounded p-1.5 text-muted hover:bg-surface-secondary hover:text-foreground"
          >
            <LuPhone className="size-3.5" />
          </a>
          <a
            href={waHref(lead.phone)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`WhatsApp ${lead.name}`}
            className="rounded p-1.5 text-muted hover:bg-surface-secondary hover:text-foreground"
          >
            <FaWhatsapp className="size-3.5" />
          </a>
        </div>

        {lead.notes?.trim() && (
          <div className="flex items-start gap-1.5 rounded-lg bg-surface-secondary p-2">
            <LuStickyNote className="mt-0.5 size-3 shrink-0 text-muted" />
            <p className="line-clamp-2 text-xs text-pretty text-muted">
              {lead.notes}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
              'bg-surface-secondary text-muted',
            )}
          >
            {sourceLabel[lead.source] ?? lead.source}
          </span>
        </div>
      </Card.Content>
    </Card>
  )
}
