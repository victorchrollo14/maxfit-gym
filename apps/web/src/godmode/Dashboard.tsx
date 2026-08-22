import { useCallback, useEffect, useState } from 'react'
import { Button, Spinner } from '@heroui/react'
import { LuRefreshCw } from 'react-icons/lu'
import { getSupabase } from '../lib/supabase'
import { PageHeader } from './PageHeader'

type Stats = {
  total_members: number
  active_members: number
  paused_today: number
  leads_today: number
  open_leads: number
}

const tiles = [
  { key: 'total_members', label: 'Members', hint: 'Anyone who has ever had a plan' },
  { key: 'active_members', label: 'Active today', hint: 'Plan running right now' },
  { key: 'paused_today', label: 'Paused today', hint: 'On a freeze that covers today' },
  { key: 'leads_today', label: 'Leads today', hint: 'Enquiries since midnight' },
  { key: 'open_leads', label: 'Open leads', hint: 'Not converted or lost' },
] as const

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getSupabase().rpc('admin_dashboard_stats')
    if (error) console.error('admin_dashboard_stats failed', error)
    setStats((data as Stats[] | null)?.[0] ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Refresh"
            isPending={loading}
            onPress={load}
          >
            <LuRefreshCw className="size-4" />
          </Button>
        }
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {loading && !stats ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tiles.map((tile) => (
              <div
                key={tile.key}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <p className="eyebrow text-muted">{tile.label}</p>
                <p className="display mt-3 text-4xl">{stats?.[tile.key] ?? '—'}</p>
                <p className="mt-2 text-xs text-muted">{tile.hint}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
