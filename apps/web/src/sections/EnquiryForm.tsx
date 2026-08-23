import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FieldError, Form, Input, Label, TextField } from '@heroui/react'
import { ctaClasses } from '../components/Cta'
import { capture, ctaTracker } from '../lib/analytics'
import { createLead, normalisePhone } from '../lib/leads'
import { markTrialClaimed } from '../lib/trialClaim'
import { gym } from '../content'
import { telHref } from '../lib/links'

type Status = 'idle' | 'sending' | 'failed'

export function EnquiryForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<ReactNode>(null)
  const navigate = useNavigate()
  const track = ctaTracker('enquiry_form_error')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '')
    const phone = String(data.get('phone') ?? '')

    if (!normalisePhone(phone)) {
      setError("That doesn't look like a mobile number — 10 digits, please.")
      setStatus('failed')
      capture('trial_form_failed', { reason: 'invalid_phone' })
      return
    }

    setStatus('sending')
    setError(null)

    try {
      await createLead({ name, phone })
    } catch (err) {
      console.error('Lead submission failed', err)
      setError(
        <>
          Something went wrong on our side. Call us on{' '}
          <a
            href={telHref}
            onClick={() => track('call')}
            className="underline underline-offset-4"
          >
            {gym.phone}
          </a>{' '}
          and we'll sort it out.
        </>,
      )
      setStatus('failed')
      capture('trial_form_failed', { reason: 'request_failed' })
      return
    }

    capture('trial_claimed')
    markTrialClaimed()
    navigate({ to: '/trial-claimed' })
  }

  return (
    <Form onSubmit={handleSubmit} className="grid gap-4">
      <TextField name="name" isRequired className="w-full">
        <Label className="eyebrow text-muted">Name</Label>
        <Input placeholder="Your full name" autoComplete="name" />
        <FieldError />
      </TextField>

      <TextField name="phone" type="tel" isRequired className="w-full">
        <Label className="eyebrow text-muted">Phone</Label>
        <Input placeholder="10-digit mobile" inputMode="tel" autoComplete="tel" />
        <FieldError />
      </TextField>

      {error && (
        <p role="alert" className="text-sm text-pretty text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className={`${ctaClasses('lg')} mt-2 w-full disabled:opacity-60`}
      >
        {status === 'sending' ? 'Sending…' : 'Claim free trial'}
      </button>

      <p className="text-center text-xs text-muted">
        We'll only use this to contact you about your membership.
      </p>
    </Form>
  )
}
