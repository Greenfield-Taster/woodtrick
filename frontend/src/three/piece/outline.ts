/*
 * The three-shaped view of a piece outline. The cut itself lives in
 * `lib/pieceOutline.ts`, which knows nothing about renderers so that the
 * playable puzzle can draw the same shapes on a 2D canvas.
 */

import * as THREE from 'three'
import { piecePoints, type PieceEdges } from '../../lib/pieceOutline'

export {
  cutTab,
  edgesAt,
  edgesFor,
  makeTabGrid,
  piecePoints,
  variantOf,
  type PieceEdges,
  type Point,
  type Tab,
  type TabGrid,
} from '../../lib/pieceOutline'

export function pieceShape(
  edges: PieceEdges,
  originX: number,
  originY: number,
  seed: number,
  detail = 1,
): THREE.Shape {
  const points = piecePoints(edges, originX, originY, seed, detail)
  const shape = new THREE.Shape()

  shape.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, points[i].y)
  shape.closePath()

  return shape
}
