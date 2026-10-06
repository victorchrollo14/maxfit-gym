import { createServerFn } from '@tanstack/react-start'
import type { User } from '@supabase/supabase-js'
import { normalisePhone } from '@/lib/leads'
import { adminSupabase, throwawaySupabase } from '@/server/supabase'
import { requireAdmin } from './requireAdmin'

export const GENDERS = ['female', 'male', 'other'] as const
export type Gender = (typeof GENDERS)[number]

function cleanPhone(raw: string) {
  const phone = normalisePhone(raw)
  if (!phone) throw new Error("That doesn't look like a mobile number")
  return phone
}

function cleanName(raw: string) {
  const name = raw.trim()
  if (!name || name.length > 120) throw new Error('A name is required')
  return name
}

type PhoneCheck = 'pending' | 'passed'

/* Add member makes the auth user before the code is checked. app_metadata.phone_check
   marks such a user until the member is created, so a half-finished one (closed tab,
   failed send) can be reused or deleted, and nobody else's account ever is. Supabase
   may confirm the phone on creation, so phone_confirmed_at can't tell them apart. */
function phoneCheckOf(user: User): PhoneCheck | null {
  return (user.app_metadata?.phone_check as PhoneCheck | undefined) ?? null
}

// GoTrue keeps phones without the +.
function hasPhone(user: User, phone: string) {
  return `+${(user.phone ?? '').replace(/^\+/, '')}` === phone
}

async function userWithPhone(phone: string) {
  const db = adminSupabase()
  const { data: profile, error } = await db
    .from('user_profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()
  if (error) throw error
  if (!profile) return null

  const { data, error: userError } = await db.auth.admin.getUserById(profile.id)
  if (userError) throw userError
  return data.user
}

/** A half-finished user for this number, or null when there is none. */
async function pendingUserWithPhone(phone: string) {
  const user = await userWithPhone(phone)
  if (user && !phoneCheckOf(user)) throw new Error('This number already belongs to an account')
  return user
}

export const sendPhoneCode = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator((input: { phone: string; name: string }) => input)
  .handler(async ({ data }) => {
    const db = adminSupabase()
    const phone = cleanPhone(data.phone)
    const name = cleanName(data.name)

    let userId: string
    let created = false
    const pending = await pendingUserWithPhone(phone)
    if (pending) {
      const { error } = await db.auth.admin.updateUserById(pending.id, {
        user_metadata: { name },
        app_metadata: { phone_check: 'pending' },
      })
      if (error) throw error
      userId = pending.id
    } else {
      const { data: made, error } = await db.auth.admin.createUser({
        phone,
        user_metadata: { name },
        app_metadata: { phone_check: 'pending' },
      })
      if (error) throw error
      userId = made.user.id
      created = true
    }

    const { error } = await throwawaySupabase().auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false },
    })
    if (error) {
      console.error('sendPhoneCode: signInWithOtp failed', error)
      if (created) await db.auth.admin.deleteUser(userId)
      throw new Error(`Couldn't send the WhatsApp code: ${error.message}`)
    }
    return { userId }
  })

export const checkPhoneCode = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator((input: { phone: string; code: string }) => input)
  .handler(async ({ data }) => {
    const db = adminSupabase()
    const { data: verified, error } = await throwawaySupabase().auth.verifyOtp({
      phone: cleanPhone(data.phone),
      token: data.code.trim(),
      type: 'sms',
    })
    if (error || !verified.user) throw new Error('That code is wrong or has expired')

    /* Only the confirmed phone is wanted. Global, because with phone confirmations
       off the send itself can open a session too. The user is still pending here,
       so there's no real session of theirs to lose. */
    const pending = Boolean(phoneCheckOf(verified.user))
    if (verified.session) {
      await db.auth.admin.signOut(verified.session.access_token, pending ? 'global' : 'local')
    }
    if (pending) {
      const { error: markError } = await db.auth.admin.updateUserById(verified.user.id, {
        app_metadata: { phone_check: 'passed' },
      })
      if (markError) throw markError
    }
    return { verified: true }
  })

export const cancelPhoneCode = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator((input: { userId: string }) => input)
  .handler(async ({ data }) => {
    const db = adminSupabase()
    const { data: found, error } = await db.auth.admin.getUserById(data.userId)
    if (error || !found.user || !phoneCheckOf(found.user)) return { deleted: false }

    const { error: deleteError } = await db.auth.admin.deleteUser(data.userId)
    if (deleteError) console.error('cancelPhoneCode: delete failed', deleteError)
    return { deleted: !deleteError }
  })

export type NewMember = {
  name: string
  phone: string
  verifiedBy: 'code' | 'admin'
  /** The user sendPhoneCode made, when a code was sent. */
  userId?: string
  email?: string
  gender?: Gender | null
  dob?: string | null
  notes?: string
  leadId?: string
}

export const createMember = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator((input: NewMember) => input)
  .handler(async ({ data, context }) => {
    const db = adminSupabase()
    const phone = cleanPhone(data.phone)
    const name = cleanName(data.name)
    if (data.gender && !GENDERS.includes(data.gender)) throw new Error('Unknown gender')

    let userId: string
    if (data.verifiedBy === 'code') {
      if (!data.userId) throw new Error('Send and check a code first')
      const { data: found, error } = await db.auth.admin.getUserById(data.userId)
      if (error) throw error
      if (phoneCheckOf(found.user) !== 'passed' || !hasPhone(found.user, phone)) {
        throw new Error("The code hasn't been checked for this number")
      }
      userId = found.user.id
    } else {
      const pending = data.userId
        ? (await db.auth.admin.getUserById(data.userId)).data.user
        : await pendingUserWithPhone(phone)
      if (pending && (!phoneCheckOf(pending) || !hasPhone(pending, phone))) {
        throw new Error('This number already belongs to an account')
      }
      if (pending) {
        userId = pending.id
      } else {
        const { data: made, error } = await db.auth.admin.createUser({
          phone,
          phone_confirm: true,
          user_metadata: { name },
        })
        if (error) throw error
        userId = made.user.id
      }
    }

    // Either way the phone is now verified, and the user stops being half-finished.
    const { error: confirmError } = await db.auth.admin.updateUserById(userId, {
      phone_confirm: true,
      user_metadata: { name },
      app_metadata: { phone_check: null },
    })
    if (confirmError) throw confirmError

    const { error: profileError } = await db
      .from('user_profiles')
      .update({
        name,
        email: data.email?.trim() || null,
        gender: data.gender || null,
        dob: data.dob || null,
        notes: data.notes?.trim() || null,
        created_by: context.adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
    if (profileError) throw profileError

    // The lead it was opened from, plus any other open lead for the same number.
    const convert = { user_id: userId, status: 'converted', converted_at: new Date().toISOString() }
    if (data.leadId) {
      const { error } = await db
        .from('leads')
        .update(convert)
        .eq('id', data.leadId)
        .neq('status', 'converted')
      if (error) console.error('createMember: lead link failed', error)
    }
    const { error: leadsError } = await db
      .from('leads')
      .update(convert)
      .eq('phone', phone)
      .not('status', 'in', '(converted,lost)')
    if (leadsError) console.error('createMember: open leads not converted', leadsError)

    return { memberId: userId }
  })
