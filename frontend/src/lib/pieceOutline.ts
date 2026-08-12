/*
 * Where a jigsaw piece's outline comes from. This used to live entirely in
 * `three/piece/outline.ts`, but the playable puzzle draws the same cut on a 2D
 * canvas and must not pull a renderer in to do it — so everything here is plain
 * arithmetic over `{x, y}`, and the three-shaped wrapper stays behind in that
 * file.
 *
 * The cut is a pure function of a seed, which is what lets two browsers given
 * the same link cut the same puzzle without exchanging any geometry.
 */

import { mulberry32 } from '../art/artwork'

export interface Point {
  x: number
  y: number
}

export type Tab = -1 | 0 | 1

export interface PieceEdges {
  bottom: Tab
  right: Tab
  top: Tab
  left: Tab
}

export interface TabGrid {
  rows: number
  cols: number
  vertical: Tab[][]
  horizontal: Tab[][]
}

export function makeTabGrid(rows: number, cols: number, seed: number): TabGrid {
  const rand = mulberry32(seed)
  const pick = (): Tab => (rand() > 0.5 ? 1 : -1)

  const vertical: Tab[][] = []
  for (let r = 0; r < rows; r++) {
    vertical.push(Array.from({ length: Math.max(0, cols - 1) }, pick))
  }
  const horizontal: Tab[][] = []
  for (let r = 0; r < Math.max(0, rows - 1); r++) {
    horizontal.push(Array.from({ length: cols }, pick))
  }
  return { rows, cols, vertical, horizontal }
}

export function edgesFor(grid: TabGrid, r: number, c: number): PieceEdges {
  const neg = (t: Tab): Tab => -t as Tab
  return {
    left: c === 0 ? 0 : neg(grid.vertical[r][c - 1]),
    right: c === grid.cols - 1 ? 0 : grid.vertical[r][c],
    bottom: r === 0 ? 0 : neg(grid.horizontal[r - 1][c]),
    top: r === grid.rows - 1 ? 0 : grid.horizontal[r][c],
  }
}

export function cutTab(col: number, row: number, axis: 0 | 1): Tab {
  let h = Math.imul(col * 374761393 + row * 668265263 + axis * 1442695041, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 3266489917)
  return ((h ^ (h >>> 16)) & 1) === 0 ? 1 : -1
}

export function edgesAt(col: number, row: number): PieceEdges {
  const neg = (t: Tab): Tab => -t as Tab
  return {
    right: cutTab(col, row, 0),
    left: neg(cutTab(col - 1, row, 0)),
    bottom: cutTab(col, row, 1),
    top: neg(cutTab(col, row - 1, 1)),
  }
}

export function variantOf(edges: PieceEdges): number {
  return (
    (edges.bottom > 0 ? 1 : 0) |
    (edges.right > 0 ? 2 : 0) |
    (edges.top > 0 ? 4 : 0) |
    (edges.left > 0 ? 8 : 0)
  )
}

type Pt = { t: number; off: number }

/* Head angles of the tab's arc, once radians rather than a call into three. */
const ARC_START = (205 * Math.PI) / 180
const ARC_END = (-25 * Math.PI) / 180

/*
 * How far a tab reaches past its own cell, as a fraction of one cell. The
 * profile below builds heads up to `0.145 * 1.2 + 0.1 * 1.14`, so this is the
 * ceiling with a little air above it — the renderer uses it to size each
 * piece's bitmap.
 */
export const TAB_REACH = 0.32

function edgeProfile(tab: Tab, rand: () => number, detail: number): Pt[] {
  const pts: Pt[] = []
  const steps = (full: number, floor: number) => Math.max(floor, Math.round(full * detail))

  const w1 = (rand() - 0.5) * 0.03
  const w2 = (rand() - 0.5) * 0.022
  const phase = rand() * Math.PI * 2
  const baseline = (t: number) =>
    Math.sin(t * Math.PI) * w1 + Math.sin(t * Math.PI * 3 + phase) * w2

  if (tab === 0) {
    const flat = steps(16, 4)
    for (let i = 0; i <= flat; i++) {
      const t = i / flat
      pts.push({ t, off: baseline(t) * 0.4 })
    }
    return pts
  }

  const d = tab
  const tc = 0.5 + (rand() - 0.5) * 0.09
  const r = 0.1 * (0.88 + rand() * 0.26)
  const height = 0.145 * (0.9 + rand() * 0.3)
  const neckHalf = 0.085 * (0.85 + rand() * 0.3)

  const A = tc - neckHalf
  const B = tc + neckHalf

  const onCircle = (angle: number): Pt => ({
    t: tc + Math.cos(angle) * r,
    off: d * (height + Math.sin(angle) * r),
  })

  const lead = steps(4, 2)
  for (let i = 0; i <= lead; i++) {
    const t = (i / lead) * A
    pts.push({ t, off: baseline(t) })
  }

  const neck = steps(4, 2)
  const e0 = onCircle(ARC_START)
  const c0 = { t: A, off: d * height * 0.42 }
  for (let i = 1; i <= neck; i++) {
    const u = i / neck
    const iu = 1 - u
    pts.push({
      t: iu * iu * A + 2 * iu * u * c0.t + u * u * e0.t,
      off: iu * iu * baseline(A) + 2 * iu * u * c0.off + u * u * e0.off,
    })
  }

  const arcSteps = steps(14, 7)
  for (let i = 1; i < arcSteps; i++) {
    pts.push(onCircle(ARC_START + ((ARC_END - ARC_START) * i) / arcSteps))
  }

  const e1 = onCircle(ARC_END)
  const c1 = { t: B, off: d * height * 0.42 }
  for (let i = 0; i <= neck; i++) {
    const u = i / neck
    const iu = 1 - u
    pts.push({
      t: iu * iu * e1.t + 2 * iu * u * c1.t + u * u * B,
      off: iu * iu * e1.off + 2 * iu * u * c1.off + u * u * baseline(B),
    })
  }

  const tail = steps(4, 2)
  for (let i = 1; i <= tail; i++) {
    const t = B + (i / tail) * (1 - B)
    pts.push({ t, off: baseline(t) })
  }

  return pts
}

/*
 * The closed outline of one piece, walked anticlockwise from its bottom-left
 * corner. Coordinates are in cell units offset by `originX`/`originY`, so a
 * piece asked for at its own column and row lands where it belongs on the board.
 */
export function piecePoints(
  edges: PieceEdges,
  originX: number,
  originY: number,
  seed: number,
  detail = 1,
): Point[] {
  const rand = mulberry32(seed)
  const out: Point[] = []

  const corners: Array<[number, number, number, number, Tab]> = [
    [0, 0, 1, 0, edges.bottom],
    [1, 0, 1, 1, edges.right],
    [1, 1, 0, 1, edges.top],
    [0, 1, 0, 0, edges.left],
  ]

  for (const [ax, ay, bx, by, tab] of corners) {
    const dx = bx - ax
    const dy = by - ay
    const nx = dy
    const ny = -dx

    for (const { t, off } of edgeProfile(tab, rand, detail)) {
      out.push({
        x: originX + ax + dx * t + nx * off,
        y: originY + ay + dy * t + ny * off,
      })
    }
  }

  return out
}
