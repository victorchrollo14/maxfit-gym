# Static assets

Drop real files at these paths and they replace the placeholders automatically —
components fall back to a labelled block when a file is missing, so nothing
breaks while these are empty.

> **The videos are still Pexels stock** — free for commercial use, no
> attribution required, but none of it is MaxFit. The three clips are
> placeholder reels so the section is playable; replace them with your own phone
> footage (vertical 9:16, keep each well under ~5 MB). The gallery is real.
>
> **`gym/hero.jpg` is currently a stock photo** — Pexels ID 29392546, free for
> commercial use, no attribution required. It is somebody else's gym. Fine as a
> placeholder, but replace it with a real shot of MaxFit before this is put in
> front of prospective members, or the room they walk into won't match the page.
> The hero backdrop is layered CSS underneath, so deleting the file degrades
> gracefully rather than leaving a hole.

```
public/
  logo-wordmark.png               Cropped horizontal lockup (nav), alpha-keyed
  logo-square.png                 Full lockup on black — footer, schema.org logo
  favicon.ico                     M monogram on black, 16/32/48 — derived
  icon-192.png                    Same monogram, PNG for Google and Android
  apple-touch-icon.png            Same monogram, 180px for iOS home screens
  gym/hero.jpg                    Hero background (landscape, 16:9)
  videos/coach-1.mp4              Reel, vertical 9:16 (phone footage is ideal)
  videos/coach-1.jpg              Poster frame for the clip above
  videos/coach-2.mp4              Second coach reel
  videos/coach-2.jpg
  videos/gym-tour.mp4             Walk through the floor / interiors
  videos/gym-tour.jpg
  gallery/1.jpg … n.jpg           Gallery tiles, cropped to 4:5
```

Paths are set in `src/content.ts` — rename freely, just keep the two in sync.
The icons and `logo-square.png` are derived from the supplied lockup and are
flattened onto black on purpose: the artwork is silver-and-red on a black field
that was keyed out into an alpha channel, so on a light surface the "MAX" and
"GYM" simply vanish — which is what Google's white favicon chip, and godmode's
light theme, both are. `logo-square.png` uses the dark theme's own background,
so it is seamless in the footer. Regenerate them if the logo ever changes.

**On the videos:** these ship in the repo and are served as plain files, so keep
each clip short and compress it hard (target well under 10 MB, 720p is plenty).
Git handles a few small MP4s fine; a folder of 100 MB raw phone footage will
bloat the repo permanently and slow every deploy.
