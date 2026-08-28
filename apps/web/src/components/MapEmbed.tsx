import { useState } from 'react'
import { gym } from '../content'

const embedKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY

/* Two ways to draw this map, and they are not equivalent.

   With a key, the Maps Embed API labels the pin itself and takes a zoom, and
   it is free and unmetered. The keyless URL addresses the listing by its CID
   instead of running a search, so it loads the place rather than the bare
   coordinate a `q=<lat>,<lng>` embed pins with nothing to label — but on
   Google's own framing, with its own info card and "Open in Maps" button.

   Click-to-activate stays for a separate reason: an always-live map swallows
   one-finger scroll on touch, halfway down a long page. */
const src = embedKey
  ? `https://www.google.com/maps/embed/v1/place?key=${embedKey}&q=${encodeURIComponent(gym.mapsQuery)}&zoom=18`
  : gym.mapEmbedUrl

export function MapEmbed({ className = 'h-80 w-full' }: { className?: string }) {
  const [active, setActive] = useState(!!embedKey)

  if (!src) {
    return (
      <div className="grid h-80 place-items-center rounded-xl border border-border bg-surface px-6 text-center">
        <p className="max-w-xs text-sm text-pretty text-muted">
          Add a Google Maps embed URL to{' '}
          <code className="text-foreground">gym.mapEmbedUrl</code> in content.ts
        </p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-neutral-100">
      <iframe
        src={src}
        title={`Map to ${gym.name} gym`}
        loading="lazy"
        tabIndex={active ? undefined : -1}
        referrerPolicy="no-referrer-when-downgrade"
        className={`border-0 ${active ? '' : 'pointer-events-none'} ${className}`}
      />

      {!active && (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={`Activate the map to ${gym.name} gym`}
          className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        />
      )}
    </div>
  )
}
