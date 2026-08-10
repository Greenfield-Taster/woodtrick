# Unidragon store redesign — design demo

A non-functional design concept for a wooden-puzzle store aimed at the US and EU
markets. Built to show what the storefront could look like, not to take orders.

Reference site being replaced: `unidragon.us`. Design spec:
[`docs/superpowers/specs/2026-08-10-unidragon-redesign-design.md`](docs/superpowers/specs/2026-08-10-unidragon-redesign-design.md).

## What is in it

- **Hero** — the wordmark assembles itself out of ~560 laser-cut wooden pieces,
  self-playing, no scroll needed. The name is sampled from live type, so it stays
  exact at any width and re-sets over two lines on a phone.
- **Home** — three reasons, collections, a bestseller rail, an interactive size
  comparison with a to-scale mug, the hidden-side story with a piece that turns
  as you scroll, and a trust block.
- **Catalog** — filter by collection, build time and price; instant, client-side.
- **Product page** — a real 3D puzzle that re-cuts itself when you change size,
  drag to turn, and flips to show the artwork on the back.
- **Cart** — side drawer with a free-delivery progress bar and a USD/EUR toggle.

Nothing is wired to a backend. Checkout is a dead button by design.

## Assets

There are none, and that is deliberate. Every picture in the app is generated in
code at runtime:

- Puzzle piece outlines are cut procedurally — real tabs, blanks and undercut
  necks, with matching edges across the grid (`src/three/piece/outline.ts`).
- Product artwork is drawn to canvas from a recipe per product: mandalas,
  marquetry animals, and layered landscapes (`src/art/`).
- Plywood grain, knots and the reverse-side artwork are generated the same way.

So the repo carries no photography, no third-party models, and no licensing
questions — and a card, the product page and the 3D model can never disagree
about what a product looks like.

## Running it

```powershell
aspire start        # server + Vite together, service discovery works
```

Frontend only:

```powershell
cd frontend
npm install
npm run dev
```

## Stack

React 19 · Vite 8 · TypeScript · React Router 7 · Tailwind v4 · zustand ·
three r185 · @react-three/fiber v9 · @react-three/drei

Quality tiers resolve once at startup — `high`, `low` (phones, weak GPUs) and
`still` (honours `prefers-reduced-motion`, composes the hero instantly and never
animates). Tier drives piece count, device pixel ratio and shadows.

## Notes for the next session

- Frame cost of the hero measures at **0.4 ms** for 96 draw calls and ~935k
  triangles. Headless Chromium reports 1 FPS for any page with a WebGL canvas
  regardless of scene contents, so end-to-end FPS has to be checked in a real
  browser.
- `three` and `@react-three` currently land in one 892 kB chunk (238 kB gzip);
  the manual chunk split does not take effect under Rolldown and was left as is.
- The `/bake` route described in the spec — pre-rendering product shots with
  Playwright — was not needed: canvas artwork paints fast enough that the
  catalogue draws directly.
