import { gym } from '../content'

/**
 * The logo artwork sits on a pure-black field. `mix-blend-lighten` maps that
 * black onto whatever dark surface is behind it, so it reads as transparent
 * without needing a cut-out PNG. It relies on a dark backdrop — don't place
 * this on a light or red surface.
 *
 * `wordmark` is a horizontal crop of the same file (MAX FIT GYM only), because
 * the full square lockup goes illegible at nav height. `full` keeps the emblem
 * and figure for places with vertical room.
 */
export function Logo({
  variant = 'wordmark',
  className = 'h-11',
}: {
  variant?: 'wordmark' | 'full'
  className?: string
}) {
  return (
    <img
      src={variant === 'full' ? '/logo.jpeg' : '/logo-wordmark.jpg'}
      alt={`${gym.name} Gym`}
      className={`${className} w-auto mix-blend-lighten`}
    />
  )
}
