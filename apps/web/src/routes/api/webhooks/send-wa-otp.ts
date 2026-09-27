import { createFileRoute } from '@tanstack/react-router'
import { Webhook } from 'standardwebhooks'
import { env } from '@/server/env'
import { sendWhatsAppOtp } from '@/server/whatsapp'

type SendSmsEvent = {
  user: { id: string; phone: string }
  sms: { otp: string; phone?: string; sms_type?: string }
}

function hookError(status: number, message: string) {
  return Response.json({ error: { http_code: status, message } }, { status })
}

// Supabase Auth's Send SMS hook: Auth generates, stores and verifies the code, this only delivers it.
export const Route = createFileRoute('/api/webhooks/send-wa-otp')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.text()
        let event: SendSmsEvent
        try {
          const secret = env('SEND_SMS_HOOK_SECRETS').replace('v1,whsec_', '')
          event = new Webhook(secret).verify(
            payload,
            Object.fromEntries(request.headers),
          ) as SendSmsEvent
        } catch (err) {
          console.error('send-wa-otp: rejected unsigned request', err)
          return hookError(401, 'Invalid signature')
        }

        // sms.phone is the number being verified, which differs from user.phone on a phone change.
        const to = (event.sms.phone || event.user.phone).replace(/\D/g, '')
        if (!to) return hookError(400, 'No phone number to send to')

        try {
          await sendWhatsAppOtp(to, event.sms.otp)
        } catch (err) {
          console.error(`send-wa-otp: delivery failed for user ${event.user.id}`, err)
          return hookError(500, 'Could not send the code on WhatsApp')
        }

        return Response.json({})
      },
    },
  },
})
