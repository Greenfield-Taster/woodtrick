# Unidragon store redesign

A design concept for a wooden-puzzle store aimed at the US and EU markets, built to show what the storefront could be rather than to take orders. The hero wordmark assembles itself out of laser-cut wooden pieces in 3D, the product page re-cuts a real puzzle when you change its size, a visitor can upload their own picture and see it cut, and the site ships a browser jigsaw that two people can solve together with no server behind it.

- **Live:** https://unidragon.pages.dev
- **Reference site being redesigned:** `unidragon.us`
- **Design specs:** [`docs/superpowers/specs/`](docs/superpowers/specs/) — the store redesign, the light theme and the jigsaw game

Nothing is wired to a backend. Checkout is a dead button by design.

## What is in it

- **Hero** — the wordmark is sampled from live type and rebuilt from hundreds of procedurally cut wooden pieces. It plays on its own, keeps the letters exact at any width, and re-sets over two lines on a phone. Pieces are sized from the stem width of the letters, so the word stays legible on a 320 px screen and on a desktop alike.
- **Home** — collections open the page, followed by a draggable bestseller rail, an interactive size comparison with a to-scale mug, and a trust block.
- **Catalogue** (`/shop`) — real product photographs on a grid that lines up across rows; filter by collection, build time and price, instantly and client-side. The filter column folds away on a phone.
- **Product page** (`/puzzle/…`) — a 3D puzzle that re-cuts itself when you change size, turns when you drag it, and flips to show the artwork on the back.
- **Custom puzzle** (`/custom`) — upload a picture and see it cut into pieces in 3D before choosing anything. The picture never leaves the browser: it is read with `FileReader`, painted to a canvas and handed straight to the preview.
- **Play** — a jigsaw you solve in the browser on a 2D canvas: pieces snap, groups merge, the camera pans and pinch-zooms, progress saves, and finishing earns a discount that the cart honours.
- **Co-op** — share the room link and a second player joins the same table. Peers find each other over public Nostr relays through [Trystero](https://github.com/dmotz/trystero) and then exchange piece moves directly over WebRTC. Only actions cross the wire; the cut is a pure function of the seed in the URL, so both browsers already agree on every piece.
- **Cart** — a side drawer with a free-delivery progress bar and a USD/EUR toggle.
- **Themes** — dark and light. The first visit follows the system; a chosen theme is remembered and applied before first paint.

## Generated where it can be, photographed where it must

Puzzle piece outlines are cut procedurally, with real tabs, blanks and undercut necks whose edges match across the grid. Each cut is derived from its own coordinates, so neighbouring pieces agree without consulting each other. Plywood grain and knots are generated too, so the 3D wordmark, the product model and the custom-puzzle board never need a texture file.

The catalogue, on the other hand, shows the real puzzles. Product shots are cut-outs on transparency, and `npm run photos` resizes each one to the widths the layout actually draws it at and writes a manifest, so a catalogue card downloads a 400 px image rather than the 1400 px master. The script also fails the build if the catalogue names a photograph that is not in `public/`.

## Tech stack

| Layer | Choice |
|---|---|
| UI | React 19, TypeScript 6, React Router 7 |
| Build | Vite 8 |
| 3D | three r185, @react-three/fiber 9, @react-three/drei |
| 2D game | Canvas 2D, no framework in the loop |
| Peer-to-peer | Trystero over Nostr relays, WebRTC data channels |
| State | zustand |
| Styling | Tailwind CSS v4, Fraunces and Inter Tight from Fontsource |
| Motion | GSAP |
| Images | sharp (build-time resizing only) |
| Lint | oxlint |
| Local orchestration | .NET Aspire AppHost (optional) |

## Performance

- Quality tiers resolve once at startup — `high`, `low` for phones and weak GPUs, and `still`, which honours `prefers-reduced-motion`, composes the hero instantly and never animates. The tier drives piece count, device pixel ratio and shadows.
- Every 3D canvas pauses when it leaves the viewport: measured at 141 renders per second while visible and 0 while scrolled away.
- The WebGL stack sits behind dynamic imports, so pages without a canvas never download it. The catalogue's JavaScript dropped from 324 kB to 90 kB when that changed.
- The hero frame costs about 0.4 ms for 96 draw calls and roughly 935 k triangles on a desktop GPU. Headless Chromium reports 1 FPS for any page with a WebGL canvas regardless of content, so frame rate has to be checked in a real browser.

## Getting started

Requirements: Node.js 20.19 or newer (Vite 8 refuses anything older; the repo pins the version). For the Aspire path you also need the .NET 10 SDK and the Aspire CLI.

Frontend only:

```bash
cd frontend
npm install
npm run dev
```

Everything together, through Aspire:

```bash
aspire start
```

## Scripts

Run these from `frontend/`.

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build to `frontend/dist` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | oxlint |
| `npm run photos` | Cut product photographs to the widths the layout uses and write the manifest; `-- --prune` removes stale variants |

## Project structure

```
woodtrick/
├── frontend/
│   ├── public/
│   │   ├── products/         # product photographs and their resized variants
│   │   └── _redirects        # hands every path to index.html for the router
│   ├── scripts/photos.mjs    # the image ladder generator
│   └── src/
│       ├── app/              # App shell, scroll restoration
│       ├── art/              # canvas painting used by the custom-puzzle board
│       ├── components/       # sections, cards, rails, drawers, header, footer
│       ├── data/             # catalogue, social accounts, photo manifest
│       ├── game/             # the jigsaw: cut, bake, render, state, session, net, save, sound
│       ├── lib/
│       ├── routes/           # Home, Catalog, ProductPage, CustomPuzzle, Play, PlayBoard
│       ├── store/            # zustand stores (cart, theme, …)
│       ├── styles/
│       └── three/            # piece outlines, wordmark sampler, puzzle scene
├── WebStarter.AppHost/       # .NET Aspire AppHost for local runs
├── WebStarter.Server/        # ASP.NET Core server; not used by the site
└── docs/                     # design specs and MCP notes
```

## Deployment

The site is a static build on Cloudflare Pages. `public/_redirects` rewrites every path to `index.html`, so a hard refresh on `/shop` or `/puzzle/…` lands in the app instead of the host's 404.

```bash
cd frontend
npm run build      # → frontend/dist
```

Cloudflare Pages settings:

- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`

## License

[MIT](LICENSE)
