import { useRef, useState } from 'react'
import { Section } from '../components/Section'
import { Media } from '../components/Media'
import { FaPause, FaPlay } from 'react-icons/fa'
import { gym, videos } from '../content'

function VideoCard({ video }: { video: (typeof videos)[number] }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)

  function toggle() {
    const el = ref.current
    if (!el) return
    if (el.paused) el.play()
    else el.pause()
  }

  return (
    /* 9:16 — these are phone-shot reels, so the frame matches the source. */
    <figure className="group relative aspect-9/16 w-72 shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-surface-secondary sm:w-80 lg:w-[22rem]">
      {failed ? (
        /* No video file yet — still show the poster so the section reads as
           designed, with the missing filename called out over it. */
        <>
          <Media
            src={video.poster}
            alt=""
            hideOnError
            className="absolute inset-0 size-full object-cover grayscale"
          />
          <div className="absolute inset-0 grid place-items-center bg-background/55 px-4 text-center">
            <p className="text-xs text-muted">
              Add <code>{video.src}</code> to public/
            </p>
          </div>
        </>
      ) : (
        <>
          {/* `src` goes on the element itself, not a <source> child — error
              events from <source> don't reach this handler. Native controls are
              off; the overlay button below drives playback. */}
          <video
            ref={ref}
            preload="metadata"
            playsInline
            src={video.src}
            poster={video.poster}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-cover"
          />

          {/* Full-card hit area: one tap toggles on mobile, where there is no
              hover to reveal a control. */}
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? `Pause ${video.title}` : `Play ${video.title}`}
            className="absolute inset-0 grid place-items-center"
          >
            <span
              className={`grid size-16 place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_8px_30px_-6px_var(--color-accent)] transition-opacity duration-200 ${
                playing
                  ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                  : 'opacity-100'
              }`}
            >
              {playing ? (
                <FaPause className="size-5" />
              ) : (
                <FaPlay className="size-5 translate-x-0.5" />
              )}
            </span>
          </button>
        </>
      )}

      {/* Caption sits in the frame, over a scrim so it stays legible on any
          footage. pointer-events-none so it never blocks the tap-to-play. */}
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-background via-background/75 to-transparent p-4 pt-20">
        <span className="eyebrow inline-block rounded bg-accent px-2 py-1 text-accent-foreground">
          {video.tag}
        </span>
        <h3 className="display mt-2.5 text-xl">{video.title}</h3>
        <p className="eyebrow mt-1 text-accent">{video.caption}</p>
      </figcaption>
    </figure>
  )
}

export function Videos() {
  if (videos.length === 0) return null

  return (
    <Section
      id="inside"
      lead="Inside"
      accent={gym.name}
      sub="Hear it from the coaches, and see the floor before you visit"
    >
      {/* Horizontal reel strip. Negative margin + padding lets cards bleed to
          the screen edge on mobile while staying aligned on desktop. */}
      <div className="-mx-5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex snap-x snap-mandatory gap-4 lg:justify-center">
          {videos.map((v) => (
            <VideoCard key={v.src} video={v} />
          ))}
        </div>
      </div>
    </Section>
  )
}
