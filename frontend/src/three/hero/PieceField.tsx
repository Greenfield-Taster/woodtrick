import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildEdgeVariants, disposeGeometries, EDGE_VARIANTS } from '../piece/geometry'
import { edgesAt, variantOf } from '../piece/outline'
import { woodPieceMaterials } from '../piece/woodMaterial'
import type { WordmarkSample } from './useWordmarkPoints'

const INTRO_STAGGER = 0.8
const INTRO_FLIGHT = 1.25

function easeOutBack(x: number) {
  const c1 = 0.9
  const c3 = c1 + 1
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
}

function easeOutCubic(x: number) {
  return 1 - (1 - x) ** 3
}

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

interface PieceState {
  variant: number
  slot: number
  target: THREE.Vector3
  origin: THREE.Vector3
  startQuat: THREE.Quaternion
  endQuat: THREE.Quaternion
  delay: number
  bobPhase: number
}

export interface PieceFieldProps {
  sample: WordmarkSample
  count: number
  animate: boolean
  /** Normalised pointer, -1..1 on both axes. */
  pointer: React.RefObject<THREE.Vector2>
  /** Reports intro progress 0..1 so the DOM copy can follow the pieces in. */
  onProgress?: (progress: number) => void
}

export function PieceField({ sample, count, animate, pointer, onProgress }: PieceFieldProps) {
  const group = useRef<THREE.Group>(null)
  const meshes = useRef<Array<THREE.InstancedMesh | null>>([])
  const startedAt = useRef<number | null>(null)
  const lastProgress = useRef(-1)
  const flip = useRef({ index: -1, at: 0 })

  const geometries = useMemo(() => buildEdgeVariants(4211), [])
  const wood = useMemo(() => woodPieceMaterials('oak'), [])

  useEffect(() => {
    return () => {
      disposeGeometries(geometries)
      wood.dispose()
    }
  }, [geometries, wood])

  const { pieces, buckets, scale } = useMemo(() => {
    const points = sample.points
    const total = Math.min(count, points.length)

    // Even coverage of the wordmark whatever the piece budget is.
    const stride = points.length / total
    const chosen: Array<[number, number]> = []
    const chosenCells: Array<[number, number]> = []
    for (let i = 0; i < total; i++) {
      const at = Math.floor(i * stride)
      chosen.push(points[at])
      chosenCells.push(sample.cells[at])
    }

    const xs = chosen.map((p) => p[0])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const span = Math.max(0.001, maxX - minX)

    const buckets: number[][] = Array.from({ length: EDGE_VARIANTS }, () => [])
    const pieces: PieceState[] = chosen.map(([x, y], i) => {
      // The shape is dictated by where the piece sits, not by which piece it
      // is: its tabs are the blanks of the pieces beside it.
      const [col, row] = chosenCells[i]
      const variant = variantOf(edgesAt(col, row))
      const slot = buckets[variant].length
      buckets[variant].push(i)

      // Pieces arrive from a shell in front of and around the camera.
      const angle = (i * 2.399) % (Math.PI * 2)
      const radius = 9 + (i % 7) * 1.6
      const origin = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.62,
        6 + ((i * 37) % 11),
      )

      const startQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          ((i * 61) % 100) / 100 * Math.PI * 2,
          ((i * 97) % 100) / 100 * Math.PI * 2,
          ((i * 13) % 100) / 100 * Math.PI * 2,
        ),
      )
      // A few degrees of tilt on every axis so the key light picks each piece
      // out individually instead of washing the whole word flat.
      const endQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          (((i * 41) % 100) / 100 - 0.5) * 0.16,
          (((i * 83) % 100) / 100 - 0.5) * 0.16,
          (((i * 29) % 100) / 100 - 0.5) * 0.1,
        ),
      )

      // Left to right, so the word writes itself.
      const delay = ((x - minX) / span) * INTRO_STAGGER + (((i * 53) % 100) / 100) * 0.1

      return {
        variant,
        slot,
        target: new THREE.Vector3(x, y, (((i * 17) % 100) / 100 - 0.5) * 0.06),
        origin,
        startQuat,
        endQuat,
        delay,
        bobPhase: ((i * 71) % 100) / 100 * Math.PI * 2,
      }
    })

    // The body of a piece is the sampling step, so that a tab lands in the
    // blank cut for it. The few percent over closes the hairline the wander
    // along each cut would otherwise leave between two pieces.
    return { pieces, buckets, scale: sample.spacing * 1.04 }
  }, [sample, count])

  const scratch = useMemo(
    () => ({
      matrix: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      spin: new THREE.Quaternion(),
      scaleVec: new THREE.Vector3(),
      yAxis: new THREE.Vector3(0, 1, 0),
      color: new THREE.Color(),
    }),
    [],
  )

  // Veneer is never one colour. A little per-piece tint stops the word reading
  // as a single flat slab.
  const tinted = useRef(false)
  useEffect(() => {
    tinted.current = false
  }, [pieces])

  useFrame(({ clock }, delta) => {
    if (startedAt.current === null) startedAt.current = clock.elapsedTime
    const t = clock.elapsedTime - startedAt.current

    const introDone = animate ? Math.min(1, t / (INTRO_STAGGER + INTRO_FLIGHT)) : 1
    if (onProgress && introDone !== lastProgress.current) {
      lastProgress.current = introDone
      onProgress(introDone)
    }

    // One piece flips every few seconds once the word has landed.
    if (animate && introDone === 1 && t - flip.current.at > 3.2) {
      flip.current = { index: Math.floor(Math.random() * pieces.length), at: t }
    }

    const applyTint = !tinted.current

    for (let index = 0; index < pieces.length; index++) {
      const piece = pieces[index]
      const mesh = meshes.current[piece.variant]
      if (!mesh) continue

      if (applyTint) {
        const shade = 0.86 + (((index * 47) % 100) / 100) * 0.28
        scratch.color.setRGB(shade, shade * 0.985, shade * 0.955)
        mesh.setColorAt(piece.slot, scratch.color)
      }

      let progress = 1
      if (animate) {
        progress = THREE.MathUtils.clamp((t - piece.delay) / INTRO_FLIGHT, 0, 1)
      }

      const eased = easeOutBack(progress)
      scratch.position.lerpVectors(piece.origin, piece.target, eased)
      scratch.quat.slerpQuaternions(piece.startQuat, piece.endQuat, easeOutCubic(progress))

      if (animate && progress === 1) {
        // Idle: a slow breath, plus the occasional flip to the hidden side.
        scratch.position.y += Math.sin(t * 0.7 + piece.bobPhase) * scale * 0.05
        scratch.position.z += Math.cos(t * 0.5 + piece.bobPhase) * scale * 0.12

        if (index === flip.current.index) {
          const u = THREE.MathUtils.clamp((t - flip.current.at) / 1.4, 0, 1)
          scratch.spin.setFromAxisAngle(scratch.yAxis, easeInOutCubic(u) * Math.PI * 2)
          scratch.quat.multiply(scratch.spin)
        }
      }

      scratch.scaleVec.setScalar(scale)
      scratch.matrix.compose(scratch.position, scratch.quat, scratch.scaleVec)
      mesh.setMatrixAt(piece.slot, scratch.matrix)
    }

    for (const mesh of meshes.current) {
      if (!mesh) continue
      mesh.instanceMatrix.needsUpdate = true
      if (applyTint && mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    if (applyTint) tinted.current = true

    if (group.current && animate) {
      const p = pointer.current
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, p.x * 0.09, 3, delta)
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, p.y * 0.06, 3, delta)
    }
  })

  return (
    <group ref={group}>
      {geometries.map((geometry, variant) => (
        <instancedMesh
          key={variant}
          ref={(node) => {
            meshes.current[variant] = node
          }}
          args={[geometry, wood.materials, Math.max(1, buckets[variant].length)]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
      ))}
    </group>
  )
}
