import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Artwork } from '../../data/catalog'
import { artworkCanvas } from '../../art/artwork'
import { artworkPieceMaterials } from '../piece/woodMaterial'
import { useInViewport } from '../../lib/useInViewport'
import { assemblePuzzle, previewGrid } from './assemble'

interface PuzzleViewProps {
  front: Artwork
  back: Artwork
  /** Real piece count of the selected tier; drives how finely we cut. */
  pieces: number
  flipped: boolean
}

function Panel({ front, back, pieces, flipped }: PuzzleViewProps) {
  const group = useRef<THREE.Group>(null)
  const drag = useRef({ active: false, x: 0, y: 0, yaw: 0, pitch: 0 })

  const { rows, cols } = previewGrid(pieces)

  const puzzle = useMemo(() => assemblePuzzle(rows, cols, 1301), [rows, cols])
  const kit = useMemo(
    () => artworkPieceMaterials(artworkCanvas(front, 1400), artworkCanvas(back, 1400)),
    [front, back],
  )

  useEffect(() => () => puzzle.dispose(), [puzzle])
  useEffect(() => () => kit.dispose(), [kit])

  useEffect(() => {
    const up = () => {
      drag.current.active = false
    }
    const move = (event: PointerEvent) => {
      if (!drag.current.active) return
      drag.current.yaw += (event.clientX - drag.current.x) * 0.008
      drag.current.pitch = THREE.MathUtils.clamp(
        drag.current.pitch + (event.clientY - drag.current.y) * 0.006,
        -0.7,
        0.7,
      )
      drag.current.x = event.clientX
      drag.current.y = event.clientY
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointermove', move)
    return () => {
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointermove', move)
    }
  }, [])

  useFrame(({ clock }, delta) => {
    if (!group.current) return
    const idle = Math.sin(clock.elapsedTime * 0.35) * 0.12
    const targetYaw = drag.current.yaw + (flipped ? Math.PI : 0) + idle
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetYaw, 5, delta)
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      drag.current.pitch + Math.sin(clock.elapsedTime * 0.27) * 0.05,
      5,
      delta,
    )
  })

  return (
    <group
      ref={group}
      scale={3.4}
      onPointerDown={(event) => {
        drag.current.active = true
        drag.current.x = event.clientX
        drag.current.y = event.clientY
      }}
    >
      {puzzle.slots.map((geometry, slot) => (
        <mesh key={slot} geometry={geometry} material={kit.materials[slot]} castShadow />
      ))}
    </group>
  )
}

export function PuzzleView(props: PuzzleViewProps) {
  const { ref, visible } = useInViewport<HTMLDivElement>()

  return (
    <div ref={ref} className="h-full w-full">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 2]}
        camera={{ fov: 32, position: [0, 0, 8] }}
        gl={{ antialias: true }}
        style={{ cursor: 'grab', touchAction: 'none' }}
      >
        <ambientLight intensity={0.55} color="#f5e6d2" />
        <directionalLight position={[4, 6, 7]} intensity={2.3} color="#ffe8c8" />
        <directionalLight position={[-6, -2, -5]} intensity={1.2} color="#7c93c6" />
        <Panel {...props} />
      </Canvas>
    </div>
  )
}
