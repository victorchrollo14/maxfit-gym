import { Cta } from './Cta'
import { FaPhoneAlt } from 'react-icons/fa'
import { gym } from '../content'

const telHref = `tel:${gym.phone.replace(/\s/g, '')}`

/**
 * Mobile-only persistent CTA. The page is long, so this recovers people who
 * scroll past the hero form.
 */
export function StickyCta() {
  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3">
        <a
          href={telHref}
          className="eyebrow flex flex-1 items-center justify-center gap-2 rounded-full border border-accent/50 px-4 py-3 text-accent"
        >
          <FaPhoneAlt className="size-4" />
          Call now
        </a>
        <Cta href="#enquiry" size="md" className="flex-1">
          Free trial
        </Cta>
      </div>
    </div>
  )
}
