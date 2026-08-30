import { gym } from '../content'

/**
 * The supplied artwork is silver-and-red on black, so it only reads on a dark
 * field. `wordmark` is a real alpha PNG — the black was un-premultiplied into
 * an alpha channel — and sits over the hero photo fine. `full` is the square
 * lockup flattened back onto the dark theme's own background, so it is opaque
 * and safe anywhere; on the public site the tile is seamless.
 *
 * `wordmark` is a horizontal crop of the same file (MAX FIT GYM only), because
 * the full square lockup goes illegible at nav height. `full` keeps the emblem
 * and figure for places with vertical room.
 *
 * `plate` puts the same dark field behind the mark for surfaces that can turn
 * light — godmode, which has a theme switch. The admin panel uses the dark
 * artwork in both themes rather than swapping to a light cut.
 */
export function Logo({
  variant = 'wordmark',
  className = 'h-11',
  plate = false,
}: {
  variant?: 'wordmark' | 'full'
  className?: string
  plate?: boolean
}) {
  const img = (
    <img
      src={variant === 'full' ? '/logo-square.png' : '/logo-wordmark.png'}
      alt={`${gym.name} Gym`}
      className={`${className} w-auto`}
    />
  )

  if (!plate) return img
  return (
    <span className="logo-plate inline-flex items-center rounded-lg p-1.5">
      {img}
    </span>
  )
}
