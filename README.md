# PSRay Web

The Nuxt 4 frontend for **[psray.net](https://psray.net)** — a community site that
pulls a PlayStation player's trophy data into one readable profile: earned
trophies, recently played games, milestones, leaderboards, and player-written
trophy tips.

PSRay is an independent community project. It is not affiliated with, endorsed
by, or operated by Sony Interactive Entertainment Inc.

## Stack

- **[Nuxt 4](https://nuxt.com)** (Vue 3, SSR via Nitro)
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **[@nuxtjs/i18n](https://i18n.nuxtjs.org)** — five UI locales, `ja` default
- **[@psray/markdown-editor](https://www.npmjs.com/package/@psray/markdown-editor)** — the tip editor and syntax guide
- `animejs`, `lucide`, `qrcode`
- **Vitest** for unit tests
- **pnpm** (see `packageManager` in `package.json`)

The backend lives in a separate repository; this app talks to it over HTTP.

## Getting started

```bash
pnpm install
cp .env.example .env   # then point it at the API you want to develop against
pnpm dev               # http://localhost:3630 (or NUXT_PORT)
```

### Environment

`.env` is gitignored; `.env.example` is the template.

| Variable | Meaning |
| --- | --- |
| `NUXT_PUBLIC_API_BASE` | Base URL of the PSRay API. Defaults to `http://localhost:8000/api`; production is `https://api.psray.net` |
| `NUXT_PUBLIC_SITE_URL` | Absolute origin, no trailing slash. Canonical / hreflang / OG URLs are built from it. Defaults to `https://psray.net`; set it to your local origin when testing local metadata |
| `NUXT_PUBLIC_CARD_BASE` | Origin serving backend-generated OG images, without `/api` or `/card`. Defaults to `https://api.psray.net` |
| `NUXT_PORT` | Dev/preview port |

## Deployment

Profile and trophy OG images are generated and updated by the backend. The frontend
links directly to `${NUXT_PUBLIC_CARD_BASE}/card/profile/<lowercase-psnid>.png`
and `${NUXT_PUBLIC_CARD_BASE}/card/trophies/<id>.png`; it has no card rendering routes
or render cache. Trailing slashes are removed from the configured origin.
Set `NUXT_PUBLIC_CARD_BASE=https://api.dev.psray.net` to use development cards.
The static brand image remains the fallback for pages without a card.

`pnpm build` produces a Nitro server bundle in `.output/`; run it with
`node .output/server/index.mjs` behind your process manager of choice, with the
env vars above set. Production must explicitly set
`NUXT_PUBLIC_SITE_URL=https://psray.net`; the matching default is a safeguard
against publishing localhost canonical or social-card URLs if deployment
configuration is accidentally omitted. `nitro.compressPublicAssets`
precompresses the flag SVGs, so serve `public/` assets with content negotiation
enabled.
