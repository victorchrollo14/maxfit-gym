import { getSupabase } from './supabase'

export type NewLead = {
  name: string
  phone: string
  email?: string
}

/** Returns E.164, or null if it isn't a number we can make sense of. */
export function normalisePhone(raw: string): string | null {
  const trimmed = raw.trim()
  const digits = trimmed.replace(/\D/g, '')

  if (trimmed.startsWith('+')) {
    return /^\+[1-9]\d{7,14}$/.test(`+${digits}`) ? `+${digits}` : null
  }

  const national = digits.replace(/^(?:91|0)/, '')
  return /^[6-9]\d{9}$/.test(national) ? `+91${national}` : null
}

export async function createLead(lead: NewLead): Promise<void> {
  const phone = normalisePhone(lead.phone)
  if (!phone) throw new Error('INVALID_PHONE')

  /* No `.select()`: anon has insert but no select on leads, so asking for the
     row back turns a successful write into an RLS error. */
  const { error } = await getSupabase().from('leads').insert({
    name: lead.name.trim(),
    phone,
    email: lead.email?.trim() || null,
    source: 'free_trial',
  })

  if (error) throw error
}
