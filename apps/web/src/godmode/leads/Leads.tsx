import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, SearchField, Spinner, Toast, cn } from '@heroui/react'
import { LuRefreshCw } from 'react-icons/lu'
import { getSupabase } from '../../lib/supabase'
import { PageHeader } from '../PageHeader'
import { AddLead } from './AddLead'
import { LeadColumn } from './LeadColumn'
import { LeadDrawer } from './LeadDrawer'
import {
  LEAD_COLUMNS,
  LEAD_FIELDS,
  type Lead,
  columnAccent,
  dayBounds,
  todayLocal,
} from './shared'

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [day, setDay] = useState('')
  const [query, setQuery] = useState('')
  const [openLead, setOpenLead] = useState<Lead | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    let request = getSupabase()
      .from('leads')
      .select(LEAD_FIELDS)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (day) {
      const { from, to } = dayBounds(day)
      request = request.gte('created_at', from).lt('created_at', to)
    }

    const { data, error } = await request
    if (error) {
      console.error('leads select failed', error)
      Toast.toast.danger('Could not load leads.')
    }
    setLeads((data as Lead[] | null) ?? [])
    setLoading(false)
  }, [day])

  useEffect(() => {
    load()
  }, [load])

  const upsert = useCallback((lead: Lead) => {
    setLeads((current) => {
      const found = current.some((row) => row.id === lead.id)
      return found
        ? current.map((row) => (row.id === lead.id ? lead : row))
        : [lead, ...current]
    })
    setOpenLead((current) => (current?.id === lead.id ? lead : current))
  }, [])

  const byStatus = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const digits = needle.replace(/\D/g, '')
    const matching = needle
      ? leads.filter(
          (lead) =>
            lead.name.toLowerCase().includes(needle) ||
            (digits.length > 0 && lead.phone.includes(digits)),
        )
      : leads

    const grouped: Record<string, Lead[]> = {}
    for (const column of LEAD_COLUMNS) grouped[column.value] = []
    for (const lead of matching) grouped[lead.status]?.push(lead)
    return grouped
  }, [leads, query])

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <PageHeader
        title="Leads"
        actions={
          <>
            <Button
              isIconOnly
              variant="ghost"
              aria-label="Refresh"
              isPending={loading}
              onPress={load}
            >
              <LuRefreshCw className="size-4" />
            </Button>
            <AddLead onAdded={upsert} />
          </>
        }
      />

      <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <SearchField
          aria-label="Search leads"
          value={query}
          onChange={setQuery}
          className="min-w-52 flex-1 sm:max-w-xs"
        >
          <Input placeholder="Search name or phone" />
        </SearchField>

        <input
          type="date"
          aria-label="Filter by day"
          value={day}
          max={todayLocal()}
          onChange={(e) => setDay(e.target.value)}
          className="h-10 rounded-(--field-radius) border border-border bg-field-background px-3 text-sm text-field-foreground"
        />
        <Button
          variant="secondary"
          size="sm"
          onPress={() => setDay(day === todayLocal() ? '' : todayLocal())}
        >
          {day === todayLocal() ? 'All days' : 'Today'}
        </Button>
      </div>

      <div className="min-h-0 w-full flex-1">
        {loading && leads.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="flex h-full w-full gap-4 overflow-x-auto px-4 pb-4 sm:px-6">
            {LEAD_COLUMNS.map((column) => {
              const columnLeads = byStatus[column.value] ?? []
              return (
                <div
                  key={column.value}
                  className="flex h-full min-h-0 w-80 shrink-0 flex-col rounded-lg bg-surface-secondary py-2"
                >
                  <div className="flex items-center gap-2 px-4 py-2">
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        columnAccent[column.value],
                      )}
                    />
                    <p className="text-sm font-medium">{column.label}</p>
                    <span className="text-sm font-bold text-muted">
                      {columnLeads.length}
                    </span>
                  </div>

                  {columnLeads.length > 0 ? (
                    <LeadColumn leads={columnLeads} onOpen={setOpenLead} />
                  ) : (
                    <p className="px-4 py-6 text-center text-xs text-muted">
                      Nothing here
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <LeadDrawer
        lead={openLead}
        onClose={() => setOpenLead(null)}
        onSaved={upsert}
      />
    </div>
  )
}
