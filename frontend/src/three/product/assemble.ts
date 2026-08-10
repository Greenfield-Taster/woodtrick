import * as THREE from 'three'
import { buildPuzzle, SLOT_BACK, SLOT_EDGE, SLOT_FRONT } from '../piece/geometry'

export interface AssembledPuzzle {
  /** One geometry per material slot: front face, back face, cut edge. */
  slots: [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry]
  /** Finished panel size in local units, width 1. */
  size: [number, number]
  dispose(): void
}

/**
 * Cuts a puzzle and welds it back together as three geometries — one per
 * material slot — so an assembled panel of a hundred pieces costs three draw
 * calls instead of three hundred.
 */
export function assemblePuzzle(rows: number, cols: number, seed: number): AssembledPuzzle {
  const { pieces } = buildPuzzle({ rows, cols, seed, thickness: 0.09 })

  const parts: Array<{ position: number[]; normal: number[]; uv: number[] }> = [
    { position: [], normal: [], uv: [] },
    { position: [], normal: [], uv: [] },
    { position: [], normal: [], uv: [] },
  ]

  const scale = 1 / cols
  const matrix = new THREE.Matrix4()
  const vertex = new THREE.Vector3()
  const normal = new THREE.Vector3()

  for (const piece of pieces) {
    // Undo the per-piece centring, then normalise the whole panel to width 1.
    matrix
      .makeScale(scale, scale, scale)
      .multiply(
        new THREE.Matrix4().makeTranslation(
          piece.col + 0.5 - cols / 2,
          piece.row + 0.5 - rows / 2,
          0,
        ),
      )

    const position = piece.geometry.getAttribute('position')
    const normals = piece.geometry.getAttribute('normal')
    const uv = piece.geometry.getAttribute('uv')

    for (const group of piece.geometry.groups) {
      const slot = group.materialIndex ?? SLOT_EDGE
      const target = parts[slot]
      for (let i = group.start; i < group.start + group.count; i++) {
        vertex.fromBufferAttribute(position, i).applyMatrix4(matrix)
        normal.fromBufferAttribute(normals, i)
        target.position.push(vertex.x, vertex.y, vertex.z)
        target.normal.push(normal.x, normal.y, normal.z)
        target.uv.push(uv.getX(i), uv.getY(i))
      }
    }

    piece.geometry.dispose()
  }

  const slots = parts.map((part) => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.position, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(part.normal, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(part.uv, 2))
    geometry.computeBoundingSphere()
    return geometry
  }) as AssembledPuzzle['slots']

  void SLOT_FRONT
  void SLOT_BACK

  return {
    slots,
    size: [1, rows / cols],
    dispose() {
      for (const geometry of slots) geometry.dispose()
    },
  }
}

/**
 * How many pieces to actually cut for the preview. Real tiers run to seven
 * hundred; drawing that many adds nothing a viewer can see and costs a second
 * of build time, so the preview scales with the tier without matching it.
 */
export function previewGrid(pieces: number): { rows: number; cols: number } {
  if (pieces <= 100) return { rows: 4, cols: 5 }
  if (pieces <= 200) return { rows: 5, cols: 7 }
  if (pieces <= 350) return { rows: 6, cols: 9 }
  return { rows: 8, cols: 11 }
}
