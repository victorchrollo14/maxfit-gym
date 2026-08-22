import { useCallback, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  Button,
  Input,
  InputOTP,
  REGEXP_ONLY_DIGITS,
  TextField,
  Toast,
} from '@heroui/react'
import { Logo } from '../components/Logo'
import { getSupabase } from '../lib/supabase'

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

/* Only ever bounce back inside godmode — a `continue` off the open internet is
   an open redirect. */
function safeContinue(value: unknown) {
  return typeof value === 'string' && /^\/godmode(\/|$)/.test(value)
    ? value
    : '/godmode'
}

export function Login() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { continue?: string }
  const target = safeContinue(search.continue)

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const sendCode = useCallback(async () => {
    if (!isEmail(email)) return
    setLoading(true)
    try {
      const { error } = await getSupabase().auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      console.error('signInWithOtp failed', err)
      Toast.toast.danger('Could not send the code. Is that address on staff?')
    } finally {
      setLoading(false)
    }
  }, [email])

  const verify = useCallback(
    async (token: string) => {
      setLoading(true)
      try {
        const { error } = await getSupabase().auth.verifyOtp({
          email: email.trim(),
          token,
          type: 'email',
        })
        if (error) throw error
        navigate({ to: target, replace: true })
      } catch (err) {
        console.error('verifyOtp failed', err)
        setOtp('')
        Toast.toast.danger('That code was wrong or has expired.')
      } finally {
        setLoading(false)
      }
    },
    [email, navigate, target],
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-6">
      <div className="flex flex-col items-center gap-2">
        <Logo variant="full" className="h-24" />
        <p className="eyebrow text-base tracking-[0.08em] text-muted">
          Staff sign in
        </p>
      </div>

      {sent ? (
        <>
          <p className="text-center text-sm text-pretty text-muted">
            Six-digit code sent to <b className="text-foreground">{email}</b>.
          </p>
          <InputOTP
            autoFocus
            aria-label="Sign-in code"
            maxLength={6}
            value={otp}
            onChange={setOtp}
            onComplete={verify}
            pattern={REGEXP_ONLY_DIGITS}
            isDisabled={loading}
            className="justify-center"
          >
            <InputOTP.Group className="gap-2">
              <InputOTP.Slot index={0} />
              <InputOTP.Slot index={1} />
              <InputOTP.Slot index={2} />
              <InputOTP.Slot index={3} />
              <InputOTP.Slot index={4} />
              <InputOTP.Slot index={5} />
            </InputOTP.Group>
          </InputOTP>
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              isDisabled={loading}
              onPress={() => {
                setOtp('')
                setSent(false)
              }}
            >
              Back
            </Button>
            <Button
              variant="primary"
              isPending={loading}
              isDisabled={otp.length < 6}
              onPress={() => verify(otp)}
            >
              Verify
            </Button>
          </div>
        </>
      ) : (
        <>
          <TextField
            value={email}
            onChange={setEmail}
            type="email"
            aria-label="Email"
            autoFocus
          >
            <Input
              placeholder="you@maxfitbangalore.in"
              autoComplete="email"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') sendCode()
              }}
            />
          </TextField>
          <Button
            variant="primary"
            isPending={loading}
            isDisabled={!isEmail(email)}
            onPress={sendCode}
          >
            Send code
          </Button>
        </>
      )}
    </div>
  )
}
