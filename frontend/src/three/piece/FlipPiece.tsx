import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Artwork } from '../../data/catalog'
import { artworkCanvas } from '../../art/artwork'
import { useInViewport } from '../../lib/useInViewport'
import { useOrbitDrag } from '../../lib/useOrbitDrag'
import { buildPuzzle } from './geometry'
import { artworkPieceMaterials } from './woodMaterial'

interface FlipPieceProps {
  front: Artwork
  back: Artwork
  /** 0 shows the front, 1 shows the back. Driven by scroll. */
  progress: React.RefObject<number>
}

interface PieceProps extends FlipPieceProps {
  /** Whatever the visitor has turned the piece by, on top of the scroll. */
  orbit: React.RefObject<{ yaw: number; pitch: number }>
}

function Piece({ front, back, progress, orbit }: PieceProps) {
  const mesh = useRef<THREE.Mesh>(null)

  // One piece lifted out of the middle of a small puzzle, so its outline has
  // tabs and blanks on all four sides.
  const { geometry, materials, dispose } = useMemo(() => {
    const { pieces } = buildPuzzle({ rows: 3, cols: 3, seed: 77, thickness: 0.09 })
    const middle = pieces[4]
    for (const piece of pieces) if (piece !== middle) piece.geometry.dispose()

    const kit = artworkPieceMaterials(artworkCanvas(front, 1024), artworkCanvas(back, 1024))

    // The piece's UVs address its own ninth of the picture; stretch them so the
    // whole artwork lands on this single piece instead.
    const uv = middle.geometry.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) - 1 / 3) * 3, (uv.getY(i) - 1 / 3) * 3)
    }
    uv.needsUpdate = true

    return {
      geometry: middle.geometry,
      materials: kit.materials,
      dispose: () => {
        middle.geometry.dispose()
        kit.dispose()
      },
    }
  }, [front, back])

  useEffect(() => dispose, [dispose])

  useFrame(({ clock }, delta) => {
    if (!mesh.current) return
    // Scroll and hand add up rather than compete: turning the piece yourself
    // shifts the zero point, and scrolling on keeps flipping it from there.
    const target = (progress.current ?? 0) * Math.PI + (orbit.current?.yaw ?? 0)
    mesh.current.rotation.y = THREE.MathUtils.damp(mesh.current.rotation.y, target, 6, delta)
    mesh.current.rotation.x = THREE.MathUtils.damp(
      mesh.current.rotation.x,
      (orbit.current?.pitch ?? 0) + Math.sin(clock.elapsedTime * 0.45) * 0.09,
      6,
      delta,
    )
    mesh.current.rotation.z = Math.cos(clock.elapsedTime * 0.32) * 0.05
  })

  return (
    <mesh ref={mesh} geometry={geometry} material={materials} scale={2.6}>
      {null}
    </mesh>
  )
}

export function FlipPiece({ front, back, progress }: FlipPieceProps) {
  const { ref, visible } = useInViewport<HTMLDivElement>()
  const orbit = useOrbitDrag<HTMLDivElement>()

  return (
    <div
      ref={ref}
      onPointerDown={orbit.onPointerDown}
      className={['h-full w-full', orbit.dragging ? 'cursor-grabbing' : 'cursor-grab'].join(' ')}
      // pan-y, not none: a finger dragging sideways turns the piece, but one
      // dragging up the page must still scroll past this section.
      style={{ touchAction: 'pan-y' }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 34, position: [0, 0, 7] }}
        gl={{ antialias: true }}
        frameloop={visible ? 'always' : 'never'}
      >
        <ambientLight intensity={0.5} color="#f3e2cb" />
        <directionalLight position={[4, 5, 6]} intensity={2.4} color="#ffe9cb" />
        <directionalLight position={[-5, -1, -4]} intensity={1.1} color="#7f96c4" />
        <Piece front={front} back={back} progress={progress} orbit={orbit.offset} />
      </Canvas>
    </div>
  )
}
