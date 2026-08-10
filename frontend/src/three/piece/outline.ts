import * as THREE from 'three'
import { mulberry32 } from '../../art/artwork'

/** -1 blank, 0 flat (puzzle border), +1 tab. */
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
  /** vertical[r][c] is the cut between piece (r,c) and (r,c+1). */
  vertical: Tab[][]
  /** horizontal[r][c] is the cut between piece (r,c) and (r+1,c). */
  horizontal: Tab[][]
}

/**
 * Builds a consistent set of cuts for a rows x cols puzzle, so that every
 * tab has a matching blank on the piece next to it and the outer border is
 * flat. Row 0 is the bottom row.
 */
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
  const neg = (t: Tab): Tab => (-t as Tab)
  return {
    left: c === 0 ? 0 : neg(grid.vertical[r][c - 1]),
    right: c === grid.cols - 1 ? 0 : grid.vertical[r][c],
    bottom: r === 0 ? 0 : neg(grid.horizontal[r - 1][c]),
    top: r === grid.rows - 1 ? 0 : grid.horizontal[r][c],
  }
}

/**
 * The cut between a cell and its neighbour, decided from the coordinates of
 * the cut itself so that both cells agree on it without consulting each other.
 * `axis` 0 is the cut to the right of (col, row), 1 the cut below it.
 *
 * This is what lets a field of pieces placed straight onto a grid interlock:
 * every tab has the blank it belongs in, rather than tabs meeting tabs and
 * fraying the edge of whatever the field is spelling out.
 */
export function cutTab(col: number, row: number, axis: 0 | 1): Tab {
  let h = Math.imul(col * 374761393 + row * 668265263 + axis * 1442695041, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 3266489917)
  return ((h ^ (h >>> 16)) & 1) === 0 ? 1 : -1
}

/** The four edges of the cell at (col, row), row counted downwards. */
export function edgesAt(col: number, row: number): PieceEdges {
  const neg = (t: Tab): Tab => -t as Tab
  return {
    right: cutTab(col, row, 0),
    left: neg(cutTab(col - 1, row, 0)),
    bottom: cutTab(col, row, 1),
    top: neg(cutTab(col, row - 1, 1)),
  }
}

/** Index of these edges in the pool built by `buildEdgeVariants`. */
export function variantOf(edges: PieceEdges): number {
  return (
    (edges.bottom > 0 ? 1 : 0) |
    (edges.right > 0 ? 2 : 0) |
    (edges.top > 0 ? 4 : 0) |
    (edges.left > 0 ? 8 : 0)
  )
}

type Pt = { t: number; off: number }

/**
 * Samples one edge in normalised edge space: `t` runs 0..1 along the edge,
 * `off` is the outward offset. The knob is a circle joined to the baseline by
 * two necks, which is what gives a real jigsaw piece its undercut.
 */
function edgeProfile(tab: Tab, rand: () => number, detail: number): Pt[] {
  const pts: Pt[] = []
  const steps = (full: number, floor: number) => Math.max(floor, Math.round(full * detail))

  // A little wander along the cut so no two edges are identical.
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
  const tc = 0.5 + (rand() - 0.5) * 0.09 // knob slides along the edge
  const r = 0.1 * (0.88 + rand() * 0.26)
  const height = 0.145 * (0.9 + rand() * 0.3)
  const neckHalf = 0.085 * (0.85 + rand() * 0.3)

  const A = tc - neckHalf
  const B = tc + neckHalf
  const start = THREE.MathUtils.degToRad(205)
  const end = THREE.MathUtils.degToRad(-25)

  const onCircle = (angle: number): Pt => ({
    t: tc + Math.cos(angle) * r,
    off: d * (height + Math.sin(angle) * r),
  })

  // Sample counts are kept deliberately low: a hero field runs hundreds of
  // these at once, and every contour point becomes six triangles once the
  // outline is extruded and bevelled.
  const lead = steps(4, 2)
  for (let i = 0; i <= lead; i++) {
    const t = (i / lead) * A
    pts.push({ t, off: baseline(t) })
  }

  // Neck in: quadratic from the baseline into the circle.
  const neck = steps(4, 2)
  const e0 = onCircle(start)
  const c0 = { t: A, off: d * height * 0.42 }
  for (let i = 1; i <= neck; i++) {
    const u = i / neck
    const iu = 1 - u
    pts.push({
      t: iu * iu * A + 2 * iu * u * c0.t + u * u * e0.t,
      off: iu * iu * baseline(A) + 2 * iu * u * c0.off + u * u * e0.off,
    })
  }

  // The circle itself, swept over the top so the knob overhangs its neck.
  const arcSteps = steps(14, 7)
  for (let i = 1; i < arcSteps; i++) {
    pts.push(onCircle(start + ((end - start) * i) / arcSteps))
  }

  // Neck out, mirroring the way in.
  const e1 = onCircle(end)
  const c1 = { t: B, off: d * height * 0.42 }
  for (let i = 0; i <= neck; i++) {
    const u = i / neck
    const iu = 1 - u
    pts.push({
      t: iu * iu * e1.t + 2 * iu * u * c1.t + u * u * B,
      off: iu * iu * e1.off + 2 * iu * u * c1.off + u * u * baseline(B),
    })
  }

  // Baseline out to the corner.
  const tail = steps(4, 2)
  for (let i = 1; i <= tail; i++) {
    const t = B + (i / tail) * (1 - B)
    pts.push({ t, off: baseline(t) })
  }

  return pts
}

/**
 * A single piece as a closed 2D outline, positioned at its place in the grid.
 *
 * Keeping the piece at its grid coordinates matters: ExtrudeGeometry derives
 * front-face UVs from the XY position, so the artwork lands on the piece at
 * exactly the spot it occupies in the finished picture.
 */
export function pieceShape(
  edges: PieceEdges,
  originX: number,
  originY: number,
  seed: number,
  /** Share of the full contour sampling to keep, for pieces drawn small. */
  detail = 1,
): THREE.Shape {
  const rand = mulberry32(seed)
  const shape = new THREE.Shape()

  // Walk counter-clockwise so the outward normal is to the right of travel.
  const corners: Array<[number, number, number, number, Tab]> = [
    [0, 0, 1, 0, edges.bottom],
    [1, 0, 1, 1, edges.right],
    [1, 1, 0, 1, edges.top],
    [0, 1, 0, 0, edges.left],
  ]

  let first = true
  for (const [ax, ay, bx, by, tab] of corners) {
    const dx = bx - ax
    const dy = by - ay
    // Right of travel is outward for a CCW contour.
    const nx = dy
    const ny = -dx

    for (const { t, off } of edgeProfile(tab, rand, detail)) {
      const x = originX + ax + dx * t + nx * off
      const y = originY + ay + dy * t + ny * off
      if (first) {
        shape.moveTo(x, y)
        first = false
      } else {
        shape.lineTo(x, y)
      }
    }
  }

  shape.closePath()
  return shape
}
