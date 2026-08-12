/*
 * Turning a piece count and a seed into a set of outlines the canvas can draw.
 *
 * Two coordinate conventions meet here. `lib/pieceOutline` was written for the
 * 3D view, where y climbs, and it numbers rows from the bottom. A canvas has y
 * falling and numbers rows from the top. The reconciliation is a single mirror
 * of the whole board — row `r` on screen is row `rows - 1 - r` in the generator,
 * and a local y of `ly` becomes `1 - ly`. Because that is one transform of the
 * entire plane rather than a per-piece flip, tabs still meet the blanks they
 * were cut to meet.
 */

import { edgesFor, makeTabGrid, piecePoints, TAB_REACH, type Point } from '../lib/pieceOutline'

export interface CutPiece {
  id: number
  row: number
  col: number
  /* The closed outline in cell units, relative to the piece's own cell corner. */
  points: Point[]
  /* Extent of `points`. Beyond [0,1] wherever a tab sticks out. */
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export const PIECE_COUNTS = [24, 54, 100, 300] as const
export type PieceCount = (typeof PIECE_COUNTS)[number]

export function isPieceCount(n: number): n is PieceCount {
  return (PIECE_COUNTS as readonly number[]).includes(n)
}

/*
 * Rows and columns for a target piece count over an image of a given
 * width-to-height ratio. It searches around the ideal rather than rounding it,
 * because rounding alone drifts badly at small counts — 24 over a 3:4 portrait
 * rounds to 4x6 (24, ratio 0.67) but 5x5 would be squarer pieces at the same
 * count, and only a search notices.
 *
 * Distinct from `previewGrid` in `three/product/grid.ts`, which answers what a
 * product photo's preview should look like on the shop's own fixed ladder.
 */
export function gridFor(pieces: number, aspect: number): { rows: number; cols: number } {
  const ideal = Math.sqrt(pieces / Math.max(0.2, aspect))
  let best = { rows: 1, cols: pieces }
  let bestCost = Infinity

  for (let rows = Math.max(2, Math.floor(ideal) - 3); rows <= Math.ceil(ideal) + 3; rows++) {
    for (const cols of [Math.floor(pieces / rows), Math.ceil(pieces / rows)]) {
      if (cols < 2) continue
      // how far off the piece count is, and how far each piece is from square
      const countCost = Math.abs(rows * cols - pieces) / pieces
      const shapeCost = Math.abs(Math.log(cols / rows / aspect))
      const cost = countCost * 1.6 + shapeCost
      if (cost < bestCost) {
        bestCost = cost
        best = { rows, cols }
      }
    }
  }

  return best
}

export function cutPuzzle(rows: number, cols: number, seed: number): CutPiece[] {
  const grid = makeTabGrid(rows, cols, seed)
  const pieces: CutPiece[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sourceRow = rows - 1 - row
      const raw = piecePoints(
        edgesFor(grid, sourceRow, col),
        0,
        0,
        seed * 7919 + sourceRow * 131 + col,
      )

      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      const points: Point[] = new Array(raw.length)

      for (let i = 0; i < raw.length; i++) {
        const x = raw[i].x
        const y = 1 - raw[i].y
        points[i] = { x, y }
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }

      pieces.push({ id: row * cols + col, row, col, points, minX, minY, maxX, maxY })
    }
  }

  return pieces
}

export { TAB_REACH }
