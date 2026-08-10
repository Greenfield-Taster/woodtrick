import * as THREE from 'three'
import { edgesFor, makeTabGrid, pieceShape, type TabGrid } from './outline'

export interface PieceGeometry {
  geometry: THREE.BufferGeometry
  row: number
  col: number
  /** Centre of the piece in puzzle space, normalised to -0.5..0.5. */
  center: THREE.Vector2
}

/** Material slots produced by `splitCaps`. */
export const SLOT_FRONT = 0
export const SLOT_BACK = 1
export const SLOT_EDGE = 2

/**
 * Re-groups an extruded, non-indexed geometry into front cap, back cap and
 * side wall so each can take its own material. ExtrudeGeometry only gives two
 * groups (caps + walls), which is one short of what the flip reveal needs.
 */
function splitCaps(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  const uv = geometry.getAttribute('uv')
  const triangles = position.count / 3

  const buckets: number[][] = [[], [], []]
  for (let t = 0; t < triangles; t++) {
    const nz = (normal.getZ(t * 3) + normal.getZ(t * 3 + 1) + normal.getZ(t * 3 + 2)) / 3
    buckets[nz > 0.5 ? SLOT_FRONT : nz < -0.5 ? SLOT_BACK : SLOT_EDGE].push(t)
  }

  const out = new THREE.BufferGeometry()
  const pos = new Float32Array(position.count * 3)
  const nor = new Float32Array(position.count * 3)
  const uvs = new Float32Array(position.count * 2)

  let write = 0
  geometry.clearGroups()
  out.clearGroups()
  let start = 0
  for (let slot = 0; slot < 3; slot++) {
    for (const t of buckets[slot]) {
      for (let v = 0; v < 3; v++) {
        const src = t * 3 + v
        pos[write * 3] = position.getX(src)
        pos[write * 3 + 1] = position.getY(src)
        pos[write * 3 + 2] = position.getZ(src)
        nor[write * 3] = normal.getX(src)
        nor[write * 3 + 1] = normal.getY(src)
        nor[write * 3 + 2] = normal.getZ(src)
        uvs[write * 2] = uv.getX(src)
        uvs[write * 2 + 1] = uv.getY(src)
        write++
      }
    }
    const count = buckets[slot].length * 3
    if (count > 0) out.addGroup(start, count, slot)
    start += count
  }

  out.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
  out.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geometry.dispose()
  return out
}

export interface PuzzleOptions {
  rows: number
  cols: number
  seed: number
  /** Piece thickness relative to a piece being 1 unit wide. */
  thickness?: number
}

/**
 * Builds every piece of a puzzle as its own geometry, centred on its own
 * origin and carrying UVs that address its slice of the artwork.
 *
 * Callers own the returned geometries and must dispose them.
 */
export function buildPuzzle(options: PuzzleOptions): { pieces: PieceGeometry[]; grid: TabGrid } {
  const { rows, cols, seed, thickness = 0.16 } = options
  const grid = makeTabGrid(rows, cols, seed)
  const pieces: PieceGeometry[] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shape = pieceShape(edgesFor(grid, r, c), c, r, seed * 7919 + r * 131 + c)

      let geometry: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: thickness * 0.16,
        bevelSize: thickness * 0.1,
        bevelSegments: 1,
        curveSegments: 1,
        steps: 1,
      })

      // ExtrudeGeometry derives cap UVs from XY, which are grid coordinates
      // here. Normalising by the grid size maps each piece onto its slice of
      // the artwork with no per-piece bookkeeping.
      const uv = geometry.getAttribute('uv')
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) / cols, uv.getY(i) / rows)
      }
      uv.needsUpdate = true

      geometry = splitCaps(geometry)
      geometry.translate(-(c + 0.5), -(r + 0.5), -thickness / 2)
      geometry.computeBoundingSphere()

      pieces.push({
        geometry,
        row: r,
        col: c,
        center: new THREE.Vector2((c + 0.5) / cols - 0.5, (r + 0.5) / rows - 0.5),
      })
    }
  }

  return { pieces, grid }
}

/** Every combination of tab and blank on four edges. */
export const EDGE_VARIANTS = 16

/**
 * One geometry per edge combination, indexed by `variantOf`, so a field can
 * place the piece that fits its neighbours instead of an arbitrary one.
 *
 * Sixteen geometries is also sixteen instanced meshes however many pieces the
 * field ends up holding, which is what keeps the draw call count flat.
 */
export function buildEdgeVariants(seed: number, thickness = 0.16): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = []

  for (let v = 0; v < EDGE_VARIANTS; v++) {
    const shape = pieceShape(
      {
        bottom: v & 1 ? 1 : -1,
        right: v & 2 ? 1 : -1,
        top: v & 4 ? 1 : -1,
        left: v & 8 ? 1 : -1,
      },
      0,
      0,
      seed + v * 977,
      // A wordmark piece covers a handful of pixels. Sampling its knobs as
      // finely as a piece filling a product shot spends triangles nobody can
      // see, and there are several hundred of them.
      0.5,
    )

    let geometry: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: thickness * 0.16,
      bevelSize: thickness * 0.1,
      bevelSegments: 1,
      curveSegments: 1,
      steps: 1,
    })

    // Each variant reads its own quarter-by-quarter patch of the grain, so a
    // field built from sixteen shapes still looks cut from one sheet rather
    // than stamped from one piece.
    const uv = geometry.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) + (v % 4)) / 4, (uv.getY(i) + Math.floor(v / 4)) / 4)
    }
    uv.needsUpdate = true

    geometry = splitCaps(geometry)
    geometry.translate(-0.5, -0.5, -thickness / 2)
    geometry.computeBoundingSphere()
    out.push(geometry)
  }

  return out
}

export function disposeGeometries(geometries: THREE.BufferGeometry[]) {
  for (const g of geometries) g.dispose()
}
