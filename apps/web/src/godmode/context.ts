import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type GodmodeValue = {
  session: Session
  openSidebar: () => void
}

export const GodmodeContext = createContext<GodmodeValue | null>(null)

export function useGodmode() {
  const value = useContext(GodmodeContext)
  if (!value) throw new Error('useGodmode used outside the godmode layout')
  return value
}
