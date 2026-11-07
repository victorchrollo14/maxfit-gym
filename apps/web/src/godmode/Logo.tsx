/* The artwork is silver-and-red on black, so `plate` gives it a dark field on
   the light theme. `wordmark` is the horizontal crop for small heights; `full`
   is the square lockup. */export function Logo({
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
      alt="maxfit Gym"
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
