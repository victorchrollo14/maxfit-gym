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

The PostHog token and the optional Google Maps embed key are in `src/config.js`.
PostHog only loads in production builds.
