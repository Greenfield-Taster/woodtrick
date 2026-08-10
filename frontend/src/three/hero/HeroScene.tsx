import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useQuality } from '../shared/quality'
import { useWordmarkPoints } from './useWordmarkPoints'
import { PieceField } from './PieceField'

/**
 * On a phone the name is set over two lines. One line on a 390px viewport
 * forces the camera so far back that the letters lose their pieces.
 */
const WIDE_LINES = ['UNIDRAGON']
const NARROW_LINES = ['UNI', 'DRAGON']
const WORD_WIDTH = 12

/** Pulls the camera back just far enough to hold the wordmark with margin. */
function FitCamera({ width, height }: { width: number; height: number }) {
  const { camera, size } = useThree()

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const vFov = THREE.MathUtils.degToRad(perspective.fov)
    const half = 2 * Math.tan(vFov / 2)

    // Fit whichever axis runs out first, with room for the copy underneath.
    const byWidth = (width * 1.12) / (half * aspect)
    const byHeight = (height * 1.9) / half
    const aim = -0.15

    perspective.position.set(0, aim, THREE.MathUtils.clamp(Math.max(byWidth, byHeight), 8, 70))
    perspective.lookAt(0, aim, 0)
    perspective.updateProjectionMatrix()
  }, [camera, size, width, height])

  return null
}

/**
 * A hard light that travels across the word once the pieces land, so the grain
 * lights up left to right. Cheaper and more physical than a shader sweep.
 */
function SweepLight({ active }: { active: boolean }) {
  const light = useRef<THREE.PointLight>(null)
  const started = useRef<number | null>(null)

  useFrame(({ clock }) => {
    if (!light.current) return
    if (started.current === null) started.current = clock.elapsedTime
    const t = clock.elapsedTime - started.current

    if (!active) {
      light.current.position.set(2, 3, 6)
      light.current.intensity = 34
      return
    }

    const u = THREE.MathUtils.clamp((t - 1.85) / 0.85, 0, 1)
    if (u >= 1) {
      // Parks in front of the word so the wood keeps its warmth afterwards.
      light.current.position.set(2, 3, 6)
      light.current.intensity = 34
      return
    }
    light.current.position.set(-11 + u * 22, 2.4, 4.2)
    light.current.intensity = 12 + 30 * Math.sin(u * Math.PI)
  })

  return <pointLight ref={light} color="#ffd9a8" distance={38} decay={1.6} />
}

function Stage({ pointer }: { pointer: React.RefObject<THREE.Vector2> }) {
  const quality = useQuality()
  const { size } = useThree()
  const narrow = size.width / size.height < 0.85
  const sample = useWordmarkPoints(
    narrow ? NARROW_LINES : WIDE_LINES,
    quality.heroPieces,
    WORD_WIDTH,
  )

  return (
    <>
      <FitCamera width={sample?.width ?? WORD_WIDTH} height={sample?.height ?? 2} />

      <color attach="background" args={['#14100c']} />

      <ambientLight intensity={0.35} color="#f0d9bd" />
      <directionalLight
        position={[5, 7, 8]}
        intensity={2.1}
        color="#ffe6c4"
        castShadow={quality.shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
      />
      {/* Cold rim from behind keeps the wood from going flat against the dark. */}
      <directionalLight position={[-6, -2, -6]} intensity={0.9} color="#6d86b8" />
      <SweepLight active={quality.animate} />

      {sample && sample.points.length > 0 && (
        <PieceField
          sample={sample}
          count={quality.heroPieces}
          animate={quality.animate}
          pointer={pointer}
        />
      )}
    </>
  )
}

export function HeroScene() {
  const quality = useQuality()
  const pointer = useRef(new THREE.Vector2(0, 0))
  const host = useRef<HTMLDivElement>(null)

  const onPointerMove = useMemo(
    () => (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = host.current?.getBoundingClientRect()
      if (!rect) return
      pointer.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      )
    },
    [],
  )

  return (
    <div ref={host} className="absolute inset-0" onPointerMove={onPointerMove}>
      <Canvas
        dpr={quality.dpr}
        shadows={quality.shadows}
        camera={{ fov: 38, near: 0.1, far: 100, position: [0, 0, 14] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={(state) => {
          // Handle for the three.js devtools bridge while developing.
          if (import.meta.env.DEV) {
            ;(window as unknown as Record<string, unknown>).__hero = state
          }
        }}
      >
        <Stage pointer={pointer} />
      </Canvas>
    </div>
  )
}
