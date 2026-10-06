import { env } from './env'

const GRAPH_API = 'https://graph.facebook.com/v26.0'
const PHONE_NUMBER_ID = '1325160657353546'
const OTP_TEMPLATE = 'login_otp'

export async function sendWhatsAppOtp(to: string, otp: string) {
  const res = await fetch(`${GRAPH_API}/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('WHATSAPP_ACCESS_TOKEN')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: OTP_TEMPLATE,
        language: { code: 'en' },
        // Authentication templates take the code twice: once for the body, once for the copy-code button.
        components: [
          { type: 'body', parameters: [{ type: 'text', text: otp }] },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otp }],
          },
        ],
      },
    }),
    // Auth gives the whole hook 5s.
    signal: AbortSignal.timeout(4000),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
    throw new Error(body?.error?.message ?? `Cloud API returned ${res.status}`)
  }
}
