import { useState } from 'react'
import { CiShare1 } from 'react-icons/ci'
import { gym } from '../content'

const embedKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY

/* Two ways to draw this map, and they are not equivalent.

   With a key, the Maps Embed API labels the pin itself — that is the one we
   want, and it is free and unmetered. Without one there is no keyless URL that
   draws both a pin and a label: `q=<name>` gives an info card and no pin,
   `q=<lat>,<lng>` gives a pin and no label (checked at zoom 17-20). So the
   keyless path fakes the label in HTML, which only holds because that URL
   centres exactly on the marker — hence `pointer-events-none`, since panning
   would slide the map out from under it. Set the key and all of that goes. */
const src = embedKey
  ? `https://www.google.com/maps/embed/v1/place?key=${embedKey}&q=${encodeURIComponent(gym.mapsQuery)}&zoom=18`
  : gym.mapEmbedUrl

export function MapEmbed({ className = 'h-80 w-full' }: { className?: string }) {
  const [loaded, setLoaded] = useState(false)

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
        tabIndex={embedKey ? undefined : -1}
        onLoad={() => setLoaded(true)}
        referrerPolicy="no-referrer-when-downgrade"
        className={`border-0 ${embedKey ? '' : 'pointer-events-none'} ${className}`}
      />

      {!embedKey && (
        <span
          aria-hidden="true"
          className={`absolute top-[calc(50%-1.25rem)] left-[calc(50%+1.15rem)] -translate-y-1/2 text-[0.9375rem] font-bold whitespace-nowrap text-neutral-900 transition-opacity duration-300 [text-shadow:0_0_4px_#fff,0_0_4px_#fff,0_0_4px_#fff,0_0_4px_#fff,0_0_4px_#fff] ${loaded ? 'opacity-100' : 'opacity-0'}`}
        >
          {gym.name} gym
        </span>
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
