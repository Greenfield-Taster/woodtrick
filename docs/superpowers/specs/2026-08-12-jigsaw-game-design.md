# Jigsaw game — design

Date: 2026-08-12

A playable jigsaw puzzle on the site, cut from the shop's own artwork. It has to
be beautiful enough to sit beside the rest of the site, fast enough to run 300
pieces on a phone, and shaped so that co-op play and server-issued rewards drop
in later without the engine being rewritten.

The site deploys as a static bundle to Cloudflare Pages. `WebStarter.Server` is
still the untouched template and nothing in this design may depend on it.

## Routes

| Path | Purpose |
| --- | --- |
| `/play` | Hub — pick artwork, pick difficulty |
| `/play/:slug` | The board |

The board reads its setup from the query string, so a link reproduces a game
exactly:

```
/play/mysterious-lion?p=100&s=4821
```

- `p` — piece count, one of 24, 54, 100, 300
- `s` — cut seed; absent means "pick one and rewrite the URL"
- `#room=<id>` — co-op room, when present

`Play` joins `Shop` and `Custom puzzle` in `NAV` in `Header.tsx`, which also
feeds `MobileMenu`.

## Why no third-party engine

`src/three/piece/outline.ts` already generates organic jigsaw tabs — bezier
necks, circular heads, a wobbling baseline — and does it deterministically from
a seed. That determinism is exactly what a shared game needs: two browsers given
the same seed cut the same puzzle without exchanging geometry.

The one obstacle is that `outline.ts` imports `three`, for `THREE.Shape` and
`THREE.MathUtils.degToRad`. The fix is a small extraction rather than a copy:

- `piecePoints(edges, originX, originY, seed, detail): Point[]` — the existing
  body, returning plain `{x, y}`, with `degToRad` inlined as `deg * Math.PI / 180`
- `pieceShape(...)` — kept, now a wrapper that feeds those points into a
  `THREE.Shape`

The 3D product view keeps its API. The game imports `piecePoints` and pulls no
renderer into its bundle.

The alternatives were weighed and rejected: **headbreaker** is the only complete
JS jigsaw framework, but its piece shapes are geometric rather than organic, it
carries a Konva renderer we would have to fight for the look we want, and it has
long been dormant. **react-jigsaw-puzzle** cuts rectangles. Embedding **Jigsaw
Explorer** or **JigsawPlanet** puts another brand and its advertising on our
page.

## Modules

Five units, each of which can be understood without reading the others.

### `src/game/cut.ts`

Pure geometry, no DOM, no React.

```ts
interface CutPiece { id: number; row: number; col: number; points: Point[]; bounds: Rect }
function cutPuzzle(rows: number, cols: number, seed: number): CutPiece[]
function gridFor(pieces: number, aspect: number): { rows: number; cols: number }
```

`points` are in unit-grid space — piece `(r, c)` spans roughly `[c, c+1] × [r, r+1]`,
with tabs pushing past those bounds. `bounds` is the real extent including tabs,
which the renderer needs to size each piece's bitmap.

`gridFor` picks rows and columns whose ratio best matches the artwork's aspect
while landing near the requested piece count. It is separate from the existing
`previewGrid` in `three/product/grid.ts`, which answers a different question
(what a product preview should look like, on a fixed ladder) and must not change.

### `src/game/state.ts`

The game model. Pure data and pure transitions — it knows nothing about canvas,
React or the network.

```ts
interface Piece { id: number; x: number; y: number; group: number }
interface GameState {
  seed: number; rows: number; cols: number
  pieces: Piece[]
  groups: Map<number, number[]>   // group id -> piece ids
  solved: boolean
  moves: number
}
```

`x, y` are the position of the piece's grid cell on the board, in board units.
A piece is home when `x === col && y === row`. Pieces in a group hold their
relative offsets by construction, so a group moves by adding a delta to each
member — there is no separate group transform to keep in step.

Transitions, each returning a new state plus a list of effects for the renderer
to animate:

- `scatter(state, rng)` — opening layout, pieces dealt around the tray
- `grab(state, pieceId)` — raise a piece's group to the top
- `dragBy(state, group, dx, dy)`
- `release(state, group)` — test every member against its four neighbours and
  against its home slot; within `SNAP_TOLERANCE` board units, merge and report a
  `snap` effect carrying the exact correction so the renderer can ease into it
- `isSolved(state)` — every piece in one group, at home

Snapping merges groups rather than freezing pieces, which is what lets a
half-built corner be dragged around as one object.

Every transition is expressible as a small JSON action — `{t:'drag', group, dx, dy}`,
`{t:'release', group}`. That is the whole reason the network layer can be thin.

### `src/game/render.ts`

Canvas painter. Owns the loop, owns no game rules.

The performance decision: **each piece is baked once into its own offscreen
canvas** at load — the artwork clipped to the piece's `Path2D`, plus a bevelled
edge (inner light rim on the top-left, dark on the bottom-right) and a drop
shadow. A frame is then N `drawImage` calls, not N path traversals. At 300
pieces this is the difference between 60fps and a slideshow.

Also owns: board/tray background, the ghost preview, the viewport transform
(zoom and pan), and hit-testing (topmost group whose baked bitmap has a
non-transparent pixel under the pointer).

### `src/game/net.ts`

A Trystero room. Added last, and the game is fully playable without it.

Trystero does WebRTC matchmaking over public BitTorrent trackers and Nostr
relays — no server of ours, which is what makes co-op possible on a static
Cloudflare Pages deploy. Peers exchange the JSON actions from `state.ts`, plus
cursor positions and a claim on the group a peer is currently dragging. A group
claimed by another peer does not respond to the local pointer.

The seed in the URL means no one has to send geometry. Joining sends only the
current piece positions.

If the public signalling proves unreliable in practice, the fallback is
Cloudflare Durable Objects — still Cloudflare, still no separate hosting — and
only `net.ts` changes.

### `src/routes/Play.tsx` and `src/components/game/`

The React shell: artwork picker, difficulty picker, timer, progress, the control
strip, the win screen. It holds the state in a ref and drives the canvas
imperatively; React re-renders only the chrome around the board, never per
frame.

## The artwork

Taken from `PRODUCTS` in `data/catalog.ts` — the shop's own designs, so a
finished game leads straight to buying the wooden version of what was just
built. Every catalogue design carrying a `photo` is offered, grouped by
collection in the hub.

These files have transparent backgrounds. Before cutting, the image is composited
onto the warm board tone the site already uses for puzzle backs, otherwise the
pieces around the subject would be invisible.

## Entering the game

The transition into the board is also the deal. Roughly 1.2 seconds:

1. The finished artwork fades up whole in the centre of the screen, small
2. A light sweeps across it and the cut lines appear under it
3. It breaks along those lines and the pieces fly out to their scattered
   positions on the tray

The last step lands on exactly the layout `scatter()` produced, so the animation
resolves into the real game state rather than being replaced by it. It is
skippable by clicking, and honours `prefers-reduced-motion` by cutting to the
scattered board.

## Feel

- The grabbed piece keeps the point it was grabbed by, lifts with a growing
  shadow and a slight scale
- A snap eases the group into place with a `gsap` spring and a short synthesised
  WebAudio click — a click made from an oscillator, not a downloaded asset
- Held key or button shows the original as a ghost under the board
- Filter to edge pieces only; reshuffle the tray
- Wheel zooms, space-drag pans
- Touch: one finger drags a piece, two fingers pan and zoom

## Reward

On the last snap: elapsed time, move count, and the best previous time for that
artwork and piece count from `localStorage`.

A coupon is derived from the puzzle — artwork, piece count, and the discount
tier — as a readable code such as `LION-100-10`. The generator lives in
`game/reward.ts` as a pure function so that the same function can be verified
server-side once there is a server. Today it is honoured by the cart's existing
discount handling.

The win screen's main action adds the wooden version of that same design to the
cart with the coupon applied.

## What is not in this work

- Accounts, leaderboards, persisted history beyond one best time per puzzle
- Server-side coupon validation
- Rotating pieces (a real difficulty mode, but it changes hit-testing, snapping
  and the network payload — it belongs in its own pass)
- Custom-photo puzzles in the game; the picker offers catalogue artwork only

## Build order

1. `cut.ts` on top of the extracted `piecePoints`
2. `state.ts` with its transitions
3. `render.ts` with baked pieces
4. `Play.tsx`, the hub, the header link
5. Intro animation, win screen, reward
6. `net.ts` co-op
