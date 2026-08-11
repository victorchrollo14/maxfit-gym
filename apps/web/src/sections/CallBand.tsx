import { FaPhoneAlt, FaWhatsapp } from 'react-icons/fa'
import { gym } from '../content'

const telHref = `tel:${gym.phone.replace(/\s/g, '')}`
const waHref = `https://wa.me/${gym.whatsapp}?text=${encodeURIComponent(
  `Hi ${gym.name}, I'd like to know more about membership.`,
)}`

/**
 * Full-bleed red band. Sits where the reference put its ratings strip — a new
 * gym has no numbers to boast yet, so it carries a call to action instead.
 */
export function CallBand() {
  return (
    <section className="bg-accent px-5 py-10 text-accent-foreground sm:py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-7 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="display text-2xl sm:text-4xl">
            Come see the place before you commit
          </p>
          <p className="eyebrow mt-2.5 opacity-85">
            Call us and we'll show you around — no pressure, no sales pitch
          </p>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
          <a
            href={telHref}
            /* Same look the WhatsApp button takes on hover: white fill, red
               label. border-2 matches that button's height exactly. */
            className="display inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-accent-foreground bg-accent-foreground px-7 py-4 text-sm text-accent transition hover:brightness-90"
          >
            <FaPhoneAlt className="size-4" />
            Call now
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="display inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-accent-foreground/70 px-7 py-4 text-sm text-accent-foreground transition hover:bg-accent-foreground hover:text-accent"
          >
            <FaWhatsapp className="size-5" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
