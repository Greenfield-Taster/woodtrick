/*
 * The rules of the game, with no canvas, no React and no network in sight.
 *
 * Pieces snap to each other rather than to a fixed board, the way the good
 * online jigsaws do — a half-built corner can be dragged anywhere and the
 * picture is finished wherever you happened to assemble it. There is no "right
 * place" on the table, only right neighbours.
 *
 * Transitions mutate the state they are handed and return what happened. The
 * isolation that matters is that nothing here reaches outward: give it a state,
 * apply a transition, assert on the result. Copying 300 pieces on every frame of
 * a drag would buy nothing but garbage.
 */

export interface Piece {
  id: number
  row: number
  col: number
  /* Board-unit position of this piece's cell corner. Home is (col, row). */
  x: number
  y: number
  group: number
}

export interface GameState {
  seed: number
  rows: number
  cols: number
  pieces: Piece[]
  /* group id -> piece ids. A group id is the id of one of its own pieces. */
  groups: Map<number, number[]>
  /* group ids from back to front. */
  order: number[]
  moves: number
}

/*
 * How close two pieces must be, in cell units, before they take hold of each
 * other. A fifth of a piece is forgiving enough to feel generous on a phone and
 * tight enough that a piece dropped between two candidates picks the near one.
 */
export const SNAP_TOLERANCE = 0.2

export interface Snap {
  /* The group that moved, and by how much, so the renderer can ease it in. */
  group: number
  dx: number
  dy: number
  /* The group it merged into, which is the id the merged group now carries. */
  into: number
}

export function createGame(rows: number, cols: number, seed: number): GameState {
  const pieces: Piece[] = []
  const groups = new Map<number, number[]>()
  const order: number[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = row * cols + col
      pieces.push({ id, row, col, x: col, y: row, group: id })
      groups.set(id, [id])
      order.push(id)
    }
  }

  return { seed, rows, cols, pieces, groups, order, moves: 0 }
}

export function groupBounds(state: GameState, group: number) {
  const ids = state.groups.get(group) ?? []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const id of ids) {
    const piece = state.pieces[id]
    if (piece.x < minX) minX = piece.x
    if (piece.y < minY) minY = piece.y
    if (piece.x + 1 > maxX) maxX = piece.x + 1
    if (piece.y + 1 > maxY) maxY = piece.y + 1
  }

  return { minX, minY, maxX, maxY }
}

/*
 * Deal the pieces out around the picture. Everything lands in a ring outside the
 * assembled area, which keeps the middle of the table clear to build in and
 * means the opening shot reads as "here is the puzzle, in pieces" rather than as
 * a heap.
 */
export function scatter(state: GameState, rand: () => number, margin = 0.7) {
  const { rows, cols } = state
  const spread = margin

  for (const piece of state.pieces) {
    const side = Math.floor(rand() * 4)
    const jitter = () => (rand() - 0.5) * 0.35

    if (side === 0) {
      piece.x = -spread - rand() * (cols * 0.42) + jitter()
      piece.y = rand() * rows + jitter()
    } else if (side === 1) {
      piece.x = cols + spread + rand() * (cols * 0.42) + jitter()
      piece.y = rand() * rows + jitter()
    } else if (side === 2) {
      piece.x = rand() * cols + jitter()
      piece.y = -spread - rand() * (rows * 0.42) + jitter()
    } else {
      piece.x = rand() * cols + jitter()
      piece.y = rows + spread + rand() * (rows * 0.42) + jitter()
    }
  }

  shuffleOrder(state, rand)
}

export function shuffleOrder(state: GameState, rand: () => number) {
  const order = state.order
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
}

/* Bring a group to the front so it draws and hit-tests above everything else. */
export function raise(state: GameState, group: number) {
  const at = state.order.indexOf(group)
  if (at >= 0) state.order.splice(at, 1)
  state.order.push(group)
}

/*
 * Lay a group down under everything else. Joined-up sections belong flat on the
 * table with the loose pieces scattered on top — otherwise a piece that happens
 * to land behind a built corner can never be picked up again.
 */
export function sink(state: GameState, group: number) {
  const at = state.order.indexOf(group)
  if (at >= 0) state.order.splice(at, 1)
  state.order.unshift(group)
}

export function dragBy(state: GameState, group: number, dx: number, dy: number) {
  for (const id of state.groups.get(group) ?? []) {
    state.pieces[id].x += dx
    state.pieces[id].y += dy
  }
}

export function moveTo(state: GameState, group: number, x: number, y: number) {
  const ids = state.groups.get(group)
  if (!ids || ids.length === 0) return
  const anchor = state.pieces[ids[0]]
  dragBy(state, group, x - anchor.x, y - anchor.y)
}

function neighbourIds(state: GameState, piece: Piece): number[] {
  const { rows, cols } = state
  const out: number[] = []
  if (piece.col > 0) out.push(piece.id - 1)
  if (piece.col < cols - 1) out.push(piece.id + 1)
  if (piece.row > 0) out.push(piece.id - cols)
  if (piece.row < rows - 1) out.push(piece.id + cols)
  return out
}

/*
 * Fold `from` into `into`, keeping `into`'s id. The pieces already sit at the
 * right offsets from one another by the time this runs, so there is nothing to
 * recompute — group membership is the only thing that changes.
 */
function merge(state: GameState, into: number, from: number) {
  const target = state.groups.get(into)
  const source = state.groups.get(from)
  if (!target || !source || into === from) return

  for (const id of source) {
    state.pieces[id].group = into
    target.push(id)
  }

  state.groups.delete(from)
  const at = state.order.indexOf(from)
  if (at >= 0) state.order.splice(at, 1)
  sink(state, into)
}

/*
 * Let go of a group and see what it grabs. Each member is compared against its
 * four neighbours; a neighbour sitting within tolerance of where it belongs
 * pulls the whole group exactly into line and the two become one.
 *
 * The loop repeats because one correction can bring further neighbours into
 * range — dropping a piece into a slot with pieces on both sides should take
 * both, not one and then a nudge.
 */
export function release(state: GameState, group: number): Snap[] {
  const snaps: Snap[] = []
  let current = group

  for (let pass = 0; pass < 8; pass++) {
    let found: { dx: number; dy: number; into: number } | null = null
    const ids = state.groups.get(current)
    if (!ids) break

    for (const id of ids) {
      const piece = state.pieces[id]

      for (const otherId of neighbourIds(state, piece)) {
        const other = state.pieces[otherId]
        if (other.group === current) continue

        const dx = other.x - (other.col - piece.col) - piece.x
        const dy = other.y - (other.row - piece.row) - piece.y

        if (Math.abs(dx) <= SNAP_TOLERANCE && Math.abs(dy) <= SNAP_TOLERANCE) {
          found = { dx, dy, into: other.group }
          break
        }
      }

      if (found) break
    }

    if (!found) break

    dragBy(state, current, found.dx, found.dy)
    merge(state, found.into, current)
    snaps.push({ group: current, dx: found.dx, dy: found.dy, into: found.into })
    current = found.into
  }

  state.moves++
  return snaps
}

export function isSolved(state: GameState): boolean {
  return state.groups.size === 1
}

/*
 * Joins made, out of the joins a finished picture needs. Progress measured by
 * the largest group instead would sit near nothing for the whole first half of
 * a game, while somebody assembling four separate corners is plainly halfway.
 */
export function joined(state: GameState): number {
  return state.pieces.length - state.groups.size
}

export function joinsNeeded(state: GameState): number {
  return Math.max(1, state.pieces.length - 1)
}

/* Every piece that still has a straight outer edge, for the edges-first filter. */
export function isEdgePiece(state: GameState, piece: Piece): boolean {
  return (
    piece.row === 0 || piece.col === 0 || piece.row === state.rows - 1 || piece.col === state.cols - 1
  )
}

/*
 * The wire and storage form. Positions are rounded to a thousandth of a cell —
 * far finer than the snap tolerance, and it keeps a 300-piece save under a few
 * kilobytes.
 */
export interface GameSnapshot {
  seed: number
  rows: number
  cols: number
  moves: number
  /* [x, y, group] per piece, in id order. */
  p: number[]
  order: number[]
}

export function snapshot(state: GameState): GameSnapshot {
  const p: number[] = []
  for (const piece of state.pieces) {
    p.push(Math.round(piece.x * 1000) / 1000, Math.round(piece.y * 1000) / 1000, piece.group)
  }
  return {
    seed: state.seed,
    rows: state.rows,
    cols: state.cols,
    moves: state.moves,
    p,
    order: [...state.order],
  }
}

export function restore(snap: GameSnapshot): GameState | null {
  const expected = snap.rows * snap.cols
  if (!expected || snap.p.length !== expected * 3) return null

  const state = createGame(snap.rows, snap.cols, snap.seed)
  state.moves = snap.moves
  state.groups.clear()

  for (let id = 0; id < expected; id++) {
    const piece = state.pieces[id]
    piece.x = snap.p[id * 3]
    piece.y = snap.p[id * 3 + 1]
    piece.group = snap.p[id * 3 + 2]

    const bucket = state.groups.get(piece.group)
    if (bucket) bucket.push(id)
    else state.groups.set(piece.group, [id])
  }

  // a saved order can name groups that have since merged away, so rebuild from
  // it rather than trusting it
  const live = new Set(state.groups.keys())
  state.order = snap.order.filter((g) => live.has(g))
  for (const g of live) if (!state.order.includes(g)) state.order.push(g)

  return state
}
