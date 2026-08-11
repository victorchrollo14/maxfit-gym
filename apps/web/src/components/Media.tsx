import { useState } from 'react'

/**
 * Image that degrades to a labelled placeholder when the file is missing, so
 * the page stays presentable before real photos are dropped into `public/`.
 */
export function Media({
  src,
  alt,
  className = '',
  label,
  hideOnError = false,
}: {
  src: string
  alt: string
  className?: string
  label?: string
  /** Render nothing instead of a placeholder — for decorative layers. */
  hideOnError?: boolean
}) {
  const [failed, setFailed] = useState(false)

  if (failed && hideOnError) return null

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center bg-surface-secondary bg-[repeating-linear-gradient(135deg,transparent,transparent_10px,var(--color-surface-tertiary)_10px,var(--color-surface-tertiary)_11px)] ${className}`}
      >
        <span className="px-3 text-center text-xs font-medium text-muted">
          {label ?? 'Photo coming soon'}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
