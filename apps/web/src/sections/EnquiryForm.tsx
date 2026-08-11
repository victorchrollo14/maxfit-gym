import { useState, type FormEvent } from 'react'
import { FieldError, Form, Input, Label, TextField } from '@heroui/react'
import { FaCheck } from 'react-icons/fa'
import { ctaClasses } from '../components/Cta'

type Status = 'idle' | 'sending' | 'sent'

export function EnquiryForm() {
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    setStatus('sending')

    // TODO: POST to the Express `/api/leads` endpoint once it exists, so this
    // lands in the admin Leads table. Until then it only logs.
    console.info('Lead captured (not yet persisted):', data)
    await new Promise((r) => setTimeout(r, 400))
    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/10 p-6 text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-full bg-accent text-accent-foreground">
          <FaCheck className="size-5" />
        </div>
        <h3 className="display mt-4 text-lg">Got it — keep your phone handy</h3>
        <p className="mt-2 text-sm text-muted text-pretty">
          Someone from the gym will call you within a few minutes to book your walk-in
          and free session.
        </p>
      </div>
    )
  }

  return (
    <Form onSubmit={handleSubmit} className="grid gap-4">
      <TextField name="name" isRequired className="w-full">
        <Label className="eyebrow text-muted">Name</Label>
        <Input placeholder="Your full name" />
        <FieldError />
      </TextField>

      <TextField name="phone" type="tel" isRequired className="w-full">
        <Label className="eyebrow text-muted">Phone</Label>
        <Input placeholder="10-digit mobile" inputMode="tel" />
        <FieldError />
      </TextField>

      <TextField name="email" type="email" className="w-full">
        <Label className="eyebrow text-muted">Email (optional)</Label>
        <Input placeholder="you@example.com" />
        <FieldError />
      </TextField>

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
