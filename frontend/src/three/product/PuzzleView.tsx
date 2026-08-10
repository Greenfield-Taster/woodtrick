import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { artworkPieceMaterials } from '../piece/woodMaterial'
import { useInViewport } from '../../lib/useInViewport'
import { useOrbitDrag } from '../../lib/useOrbitDrag'
import { assemblePuzzle, previewGrid } from './assemble'

interface PuzzleViewProps {
  front: HTMLCanvasElement
  back: HTMLCanvasElement
  pieces: number
  flipped: boolean
}

interface PanelProps extends PuzzleViewProps {
  orbit: React.RefObject<{ yaw: number; pitch: number }>
}

function Panel({ front, back, pieces, flipped, orbit }: PanelProps) {
  const group = useRef<THREE.Group>(null)

  const { rows, cols } = previewGrid(pieces)

  const puzzle = useMemo(() => assemblePuzzle(rows, cols, 1301), [rows, cols])
  const kit = useMemo(() => artworkPieceMaterials(front, back), [front, back])

  useEffect(() => () => puzzle.dispose(), [puzzle])
  useEffect(() => () => kit.dispose(), [kit])

  useFrame(({ clock }, delta) => {
    if (!group.current) return
    const idle = Math.sin(clock.elapsedTime * 0.35) * 0.12
    const targetYaw = (orbit.current?.yaw ?? 0) + (flipped ? Math.PI : 0) + idle
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetYaw, 5, delta)
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      (orbit.current?.pitch ?? 0) + Math.sin(clock.elapsedTime * 0.27) * 0.05,
      5,
      delta,
    )
  })

  return (
    <group ref={group} scale={3.4}>
      {puzzle.slots.map((geometry, slot) => (
        <mesh key={slot} geometry={geometry} material={kit.materials[slot]} castShadow />
      ))}
    </group>
  )
}

export function PuzzleView(props: PuzzleViewProps) {
  const { ref, visible } = useInViewport<HTMLDivElement>()
  const orbit = useOrbitDrag<HTMLDivElement>()

  return (
    <div
      ref={ref}
      onPointerDown={orbit.onPointerDown}
      className={['h-full w-full', orbit.dragging ? 'cursor-grabbing' : 'cursor-grab'].join(' ')}
      style={{ touchAction: 'pan-y' }}
    >
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 2]}
        camera={{ fov: 32, position: [0, 0, 8] }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.55} color="#f5e6d2" />
        <directionalLight position={[4, 6, 7]} intensity={2.3} color="#ffe8c8" />
        <directionalLight position={[-6, -2, -5]} intensity={1.2} color="#7c93c6" />
        <Panel {...props} orbit={orbit.offset} />
      </Canvas>
    </div>
  )
}
