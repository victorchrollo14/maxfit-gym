# site — maxfitbangalore.in

The public landing page: one static `index.html` styled with Tailwind, plus a
small `src/main.js` for the menu, videos, map and click tracking. Deployed on
Vercel (root directory `apps/site`, settings in `vercel.json`).

```sh
pnpm --filter site dev     # http://localhost:5173
pnpm --filter site build   # static files in apps/site/dist
```

Icons live in the `<svg>` sprite at the top of `<body>`; use one with
`<svg class="size-4"><use href="#i-phone"></use></svg>`. Theme colours, fonts
and the `btn` classes are in `src/style.css`.

Build-time variables (set them in Vercel; all optional, all public):

- `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN`, `VITE_PUBLIC_POSTHOG_HOST` — analytics
- `VITE_GOOGLE_MAPS_EMBED_KEY` — labelled map pin; without it the map uses the keyless embed
