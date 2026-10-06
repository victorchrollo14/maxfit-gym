import type { ReactNode } from 'react'

/* Note: `inline-flex` here sets `display`, so passing `hidden`/`sm:block` via
   `className` fights it and the winner is stylesheet order, not intent. Put
   responsive visibility on a wrapper element instead. */
const base =
  'display inline-flex items-center justify-center gap-2 rounded-full text-center transition duration-200 hover:brightness-115 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent'

const sizes = {
  md: 'px-6 py-3 text-xs sm:text-sm',
  lg: 'px-8 py-4 text-sm sm:text-base',
  /* Bigger type, tighter horizontal padding — for standalone centred CTAs
     where a wide pill looks stretched. */
  xl: 'px-7 py-4 text-base sm:text-lg',
}

const tones = {
  /* Transparent border, not none: `outline` carries a 1px one, and without a
     match here the two tones differ by 2px in height wherever they sit side by
     side. */
  solid:
    'border border-transparent bg-accent text-accent-foreground shadow-[0_8px_30px_-8px_var(--color-accent)]',
  outline: 'border border-border bg-surface/60 text-foreground hover:bg-surface',
  white: 'border border-transparent bg-white text-neutral-900 hover:bg-white/90',
}

export function Cta({
  href,
  children,
  size = 'lg',
  tone = 'solid',
  className = '',
  onClick,
  external,
}: {
  href: string
  children: ReactNode
  size?: keyof typeof sizes
  tone?: keyof typeof tones
  className?: string
  /** For same-page anchors that also need to dismiss something, e.g. the
      mobile menu closing as it jumps to the enquiry form. */
  onClick?: () => void
  /** Opens in a new tab — for links that leave the site, e.g. WhatsApp. */
  external?: boolean
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={`${base} ${sizes[size]} ${tones[tone]} ${className}`}
    >
      {children}
    </a>
  )
}

export const ctaClasses = (
  size: keyof typeof sizes = 'lg',
  tone: keyof typeof tones = 'solid',
) => `${base} ${sizes[size]} ${tones[tone]}`
