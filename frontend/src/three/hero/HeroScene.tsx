import { useCallback, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useQuality } from '../shared/quality'
import { useTheme } from '../../store/theme'
import { useInViewport } from '../../lib/useInViewport'
import { useWordmarkPoints } from './useWordmarkPoints'
import { PieceField } from './PieceField'

const WIDE_LINES = ['UNIDRAGON']
const NARROW_LINES = ['UNI', 'DRAGON']
const WORD_WIDTH = 12

const STAGE = {
  dark: {
    background: '#14100c',
    tone: 'oak',
    ambient: { intensity: 0.35, color: '#f0d9bd' },
    key: { intensity: 2.1, color: '#ffe6c4' },
    rim: { intensity: 0.9, color: '#6d86b8' },
    sweep: { base: 12, peak: 30, rest: 34 },
  },
  light: {
    background: '#f3ece1',
    tone: 'walnut',
    ambient: { intensity: 0.72, color: '#fff4e4' },
    key: { intensity: 2.6, color: '#fff1da' },
    rim: { intensity: 0.35, color: '#c9a887' },
    sweep: { base: 4, peak: 12, rest: 10 },
  },
} as const

export interface HeroReserve {
  top: number
  bottom: number
}

interface FitCameraProps {
  width: number
  height: number
  reserve: HeroReserve
}

function FitCamera({ width, height, reserve }: FitCameraProps) {
  const { camera, size } = useThree()

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const vFov = THREE.MathUtils.degToRad(perspective.fov)
    const half = 2 * Math.tan(vFov / 2)

    const margin = size.width < 640 ? 1.36 : 1.14

    const band = Math.max(0.08, 1 - reserve.top - reserve.bottom)

    const byWidth = (width * margin) / (half * aspect)
    const byHeight = (height * 1.3) / (half * band)
    const z = THREE.MathUtils.clamp(Math.max(byWidth, byHeight), 8, 70)

    const aim = (reserve.top + band / 2 - 0.5) * half * z

    perspective.position.set(0, aim, z)
    perspective.lookAt(0, aim, 0)
    perspective.updateProjectionMatrix()
  }, [camera, size, width, height, reserve])

  return null
}

function SweepLight({
  active,
  sweep,
}: {
  active: boolean
  sweep: { base: number; peak: number; rest: number }
}) {
  const light = useRef<THREE.PointLight>(null)
  const started = useRef<number | null>(null)

  useFrame(({ clock }) => {
    if (!light.current) return
    if (started.current === null) started.current = clock.elapsedTime
    const t = clock.elapsedTime - started.current

    if (!active) {
      light.current.position.set(2, 3, 6)
      light.current.intensity = sweep.rest
      return
    }

    const u = THREE.MathUtils.clamp((t - 1.85) / 0.85, 0, 1)
    if (u >= 1) {
      light.current.position.set(2, 3, 6)
      light.current.intensity = sweep.rest
      return
    }
    light.current.position.set(-11 + u * 22, 2.4, 4.2)
    light.current.intensity = sweep.base + sweep.peak * Math.sin(u * Math.PI)
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
  const theme = useTheme((s) => s.theme)
  const stage = STAGE[theme]
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

      <color attach="background" args={[stage.background]} />

      <ambientLight intensity={stage.ambient.intensity} color={stage.ambient.color} />
      <directionalLight
        position={[5, 7, 8]}
        intensity={stage.key.intensity}
        color={stage.key.color}
        castShadow={quality.shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
      />
      <directionalLight position={[-6, -2, -6]} intensity={stage.rim.intensity} color={stage.rim.color} />
      <SweepLight active={quality.animate} sweep={stage.sweep} />

      {sample && sample.points.length > 0 && (
        <PieceField
          tone={stage.tone}
          sample={sample}
          count={sample.points.length}
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

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = host.current?.getBoundingClientRect()
      if (!rect) return
      pointer.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      )
    },
    [host],
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
