# Night Market — Vendors Live

Internal ops dashboard for **Night Market** (Ghana food delivery, Abonten Technologies). It visualizes vendor go-lives from two lanes:

- **Roseline Dromo** — Taken Live (54 vendors)
- **Ibrahim Abubakar / LeeHo Mingle** — Taken Live / Audited for Live (25 submitted brands)

No login. Counts are computed from the roster file; they are not typed in by hand.

**Live site:** https://stunner100.github.io/night-market-vendors-live/

As of **27 Aug 2026**.

## Headline metrics

| Metric | Value |
| --- | --- |
| Roseline taken live | 54 |
| Ibrahim submitted brands | 25 (24 unique after MaxMart de-dupe) |
| Ibrahim chain locations | 80 on 7 chains |
| Ibrahim singles | 17 |
| Overlaps | 3 chain branches already live on Roseline |

MaxMart appears twice on Ibrahim's list (once as a name, once as 5 branches); counted as one brand / 5 locations.

## Run locally

```bash
npm install
npm run verify
npm run dev
```

App: [http://127.0.0.1:43127](http://127.0.0.1:43127)

```bash
npm run build
```

Static export lands in `out/`.

## Update the roster

Edit **`src/data/roster.json`**.

1. Keep Roseline names in go-live order under `roseline.vendors`.
2. Keep Ibrahim rows under `ibrahim.brands` in submitted order. Add `"branches": N` only when a branch count was given.
3. If a chain branch is already on Roseline's list, add it to `overlaps` (`roselineName` + `ibrahimChain`).
4. Cuisine tags are inferred from names (`waakye`, `pizza`, `shawarma`, `breakfast`, `kenkey`, `chicken`) and are skipped when the name is not obvious.
5. Run `npm run verify` — it asserts  the current expected totals so a bad edit fails the build.

Then commit and push. GitHub Pages deploys from `main`. If this repo is also connected to Vercel, production follows the same branch.

## Stack

Next.js (static export), TypeScript, Tailwind CSS, shadcn/ui.
