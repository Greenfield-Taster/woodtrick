import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useQuality } from '../shared/quality'
import { useInViewport } from '../../lib/useInViewport'
import { useWordmarkPoints } from './useWordmarkPoints'
import { PieceField } from './PieceField'

/**
 * On a phone the name is set over two lines. One line on a 390px viewport
 * forces the camera so far back that the letters lose their pieces.
 */
const WIDE_LINES = ['UNIDRAGON']
const NARROW_LINES = ['UNI', 'DRAGON']
const WORD_WIDTH = 12

export interface HeroReserve {
  /** Share of the section's height taken by the header above, 0..1. */
  top: number
  /** Share taken by the copy below. */
  bottom: number
}

interface FitCameraProps {
  width: number
  height: number
  reserve: HeroReserve
}

/** Pulls the camera back just far enough to hold the wordmark with margin. */
function FitCamera({ width, height, reserve }: FitCameraProps) {
  const { camera, size } = useThree()

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const vFov = THREE.MathUtils.degToRad(perspective.fov)
    const half = 2 * Math.tan(vFov / 2)

    // A phone needs more air than a desktop. At 90% of the viewport the word
    // touches both edges, which reads as a crop however carefully it fits.
    const margin = size.width < 640 ? 1.36 : 1.14

    // The clear band between the header and the copy. Without this the word
    // centres itself in the whole section and collides with one or the other
    // on any short viewport — a phone held sideways is the worst case, where
    // the two together take two thirds of the height.
    const band = Math.max(0.32, 1 - reserve.top - reserve.bottom)

    const byWidth = (width * margin) / (half * aspect)
    const byHeight = (height * 1.3) / (half * band)
    const z = THREE.MathUtils.clamp(Math.max(byWidth, byHeight), 8, 70)

    // Put the word in the middle of that band rather than the middle of the
    // screen. Aiming off centre is what moves it there.
    const aim = (reserve.top + band / 2 - 0.5) * half * z

    perspective.position.set(0, aim, z)
    perspective.lookAt(0, aim, 0)
    perspective.updateProjectionMatrix()
  }, [camera, size, width, height, reserve])

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

function Stage({
  pointer,
  reserve,
}: {
  pointer: React.RefObject<THREE.Vector2>
  reserve: HeroReserve
}) {
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
      <FitCamera
        width={sample?.width ?? WORD_WIDTH}
        height={sample?.height ?? 2}
        reserve={reserve}
      />

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

export function HeroScene({ reserve }: { reserve: HeroReserve }) {
  const quality = useQuality()
  const pointer = useRef(new THREE.Vector2(0, 0))
  const { ref: host, visible } = useInViewport<HTMLDivElement>()

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
        frameloop={visible ? 'always' : 'never'}
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
        <Stage pointer={pointer} reserve={reserve} />
      </Canvas>
    </div>
  )
}
