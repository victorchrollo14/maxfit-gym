# Static assets

Drop real files at these paths and they replace the placeholders automatically —
components fall back to a labelled block when a file is missing, so nothing
breaks while these are empty.

> **The videos and every photo here are currently Pexels stock** — free for
> commercial use, no attribution required, but none of it is MaxFit. The three
> clips are placeholder reels so the section is playable; replace them with your
> own phone footage (vertical 9:16, keep each well under ~5 MB).
>
> **`gym/hero.jpg` is currently a stock photo** — Pexels ID 29392546, free for
> commercial use, no attribution required. It is somebody else's gym. Fine as a
> placeholder, but replace it with a real shot of MaxFit before this is put in
> front of prospective members, or the room they walk into won't match the page.
> The hero backdrop is layered CSS underneath, so deleting the file degrades
> gracefully rather than leaving a hole.

```
public/
  logo.png                        Supplied square lockup (footer), alpha-keyed
  logo-wordmark.png               Cropped horizontal lockup (nav) — derived
  gym/hero.jpg                    Hero background (landscape, 16:9)
  videos/coach-1.mp4              Reel, vertical 9:16 (phone footage is ideal)
  videos/coach-1.jpg              Poster frame for the clip above
  videos/coach-2.mp4              Second coach reel
  videos/coach-2.jpg
  videos/gym-tour.mp4             Walk through the floor / interiors
  videos/gym-tour.jpg
  gallery/1.jpg … 10.jpg          Gallery tiles, mixed aspect ratios
```

Paths are set in `src/content.ts` — rename freely, just keep the two in sync.

**On the videos:** these ship in the repo and are served as plain files, so keep
each clip short and compress it hard (target well under 10 MB, 720p is plenty).
Git handles a few small MP4s fine; a folder of 100 MB raw phone footage will
bloat the repo permanently and slow every deploy.
