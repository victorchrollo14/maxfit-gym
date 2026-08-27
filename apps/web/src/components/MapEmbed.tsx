import { useState } from 'react'
import { CiShare1 } from 'react-icons/ci'
import { gym } from '../content'

const embedKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY

/* Two ways to draw this map, and they are not equivalent.

   With a key, the Maps Embed API labels the pin itself and takes a zoom, and
   it is free and unmetered. The keyless URL addresses the listing by its CID
   instead of running a search, so it loads the place rather than the bare
   coordinate a `q=<lat>,<lng>` embed pins with nothing to label — but on
   Google's own framing.

   The corner card names the place instead of floating a fake label over the
   marker. Anything positioned over the marker is a lie the moment the map
   moves — pan, zoom or switch to satellite and it is pointing at the wrong
   place, or gone. The card is attached to the frame, not the map,
   so it survives all three. Set the key and it goes.

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

      {!embedKey && (
        /* Inert: the address is already in the Location section as an
           <address>, and clicks belong to the map underneath. */
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-md bg-white px-3.5 py-2.5 shadow-lg"
        >
          <p className="display text-sm leading-tight text-neutral-900">
            {gym.name} gym
          </p>
          <p className="mt-1 text-xs leading-snug text-pretty text-neutral-600">
            {gym.address.line1}
          </p>
        </div>
      )}

      <a
        href={gym.mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="eyebrow absolute top-3 left-3 flex items-center gap-2 rounded-md bg-white px-3.5 py-3 text-accent shadow-lg transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="-mr-[0.2em] leading-none">Open in Maps</span>
        <CiShare1 className="size-4 shrink-0" aria-hidden="true" strokeWidth={1} />
      </a>
    </div>
  )
}
