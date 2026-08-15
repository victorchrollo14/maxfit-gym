import { gym } from '../content'

/**
 * Both files are real alpha PNGs — the supplied artwork's black field was
 * un-premultiplied into an alpha channel — so this needs no blend mode and no
 * opaque surface behind it. It sits over the hero photo fine.
 *
 * The artwork's own interior shading is dark, so it still reads best on a dark
 * backdrop; on the red band or a light surface it will look thin.
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
      src={variant === 'full' ? '/logo.png' : '/logo-wordmark.png'}
      alt={`${gym.name} Gym`}
      className={`${className} w-auto`}
    />
  )
}
