# Grand opening invite — 23 Aug 2026

Two directions for the same invite. Both are 1080 × 1620 (2:3, the same
proportion as the original flyer — right for WhatsApp and Instagram, and it
prints as a handbill).

| File | What it is |
|---|---|
| `invite-a-refined-original.html` | Direction A, standalone page — fonts and images inlined, opens anywhere offline |
| `invite-b-editorial.html` | Direction B, standalone page |
| `*.png` | 2160 × 3240 (2×) — share these |
| `*.pdf` | 810 × 1215 pt, one page, fonts embedded — send these to the printer |

## Re-rendering after an edit

Edit the `.html`, then:

```sh
google-chrome --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1080,1620 \
  --screenshot=invite-a-refined-original.png invite-a-refined-original.html

google-chrome --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=invite-a-refined-original.pdf invite-a-refined-original.html
```

## Notes

- Type is the site's own: Rajdhani for display, Manrope for body, embedded as
  woff2 data URIs so exports don't depend on Google Fonts being reachable.
- The logo is `apps/web/public/logo.png` (the alpha-keyed lockup), not a trace
  of the old JPEG.
- The QR is the supplied Google Business Profile code, cleaned to pure 1-bit
  black/white with a 4-module quiet zone. It decodes from both posters down to
  a 540px-wide view; below that it is too small for any scanner.
- These are near-black flood fills. On paper that drinks ink — worth telling
  the printer, or asking them for a matte stock.
