import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa'
import { Cta } from './Cta'
import { gym } from '../content'
import { type CtaAction, ctaTracker } from '../lib/analytics'
import { telHref, whatsappHref } from '../lib/links'

const waHref = whatsappHref(
  `Hi ${gym.name}, I'd like to know more about membership.`,
)

const layouts = {
  responsive: 'flex-col sm:flex-row',
  row: 'flex-row',
  column: 'flex-col',
}

/**
 * The site's main call to action, everywhere it appears. Plans are sold in
 * person, so both buttons open a conversation rather than a form — the free
 * trial form in the hero is the one exception.
 */
export function CtaPair({
  location,
  size = 'lg',
  layout = 'responsive',
  fill = false,
  className = '',
  onNavigate,
}: {
  location: string
  size?: 'md' | 'lg' | 'xl'
  layout?: keyof typeof layouts
  /** Each button takes half the width — for the sticky bar and the menu sheet. */
  fill?: boolean
  className?: string
  onNavigate?: () => void
}) {
  const track = ctaTracker(location)

  const press = (action: CtaAction) => () => {
    track(action)
    onNavigate?.()
  }

  return (
    <div
      className={`flex ${layouts[layout]} items-stretch justify-center gap-3 ${fill ? 'w-full' : ''} ${className}`}
    >
      <Cta
        href={telHref}
        size={size}
        onClick={press('call')}
        className={fill ? 'flex-1' : ''}
      >
        <FaPhoneAlt className="size-4" aria-hidden="true" />
        Call now
      </Cta>
      <Cta
        href={waHref}
        size={size}
        tone="outline"
        external
        onClick={press('whatsapp')}
        className={fill ? 'flex-1' : ''}
      >
        <FaWhatsapp className="size-5" aria-hidden="true" />
        Chat now
      </Cta>
    </div>
  )
}
