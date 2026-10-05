# Three Blades

Portfolio site of Muhtasim Ibteda Shochcho. A static Next.js site; every fact on it comes from `content/portfolio.md`.

## Run

```
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/
```

## Checks

```
npm test           # content parser, derived views, tokens, copy rules
npm run lint
npm run typecheck
npm run check:copy # no em dashes, banned words or retired palette in shipped code
```

## Content

Edit `content/portfolio.md`. The build validates it and fails on unknown keys or invalid values. `/plain` shows all of it as plain text.

## Deploy

Vercel, framework preset Next.js, default settings. `next.config.ts` sets `output: "export"`, so the site is fully static.
