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
const BASE_FOV = 38
const MIN_Z = 8
const BAND_PADDING = 1.08

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

interface FitCameraProps {
  width: number
  height: number
  centre: number
  /* Share of the hero the header sits over, kept clear of the wordmark. */
  headroom: number
}

function FitCamera({ width, height, centre, headroom }: FitCameraProps) {
  const { camera, size } = useThree()

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const baseHalf = 2 * Math.tan(THREE.MathUtils.degToRad(BASE_FOV) / 2)

    const margin = size.width < 640 ? 1.18 : 1.12

    const band = Math.max(0.08, 1 - headroom)

    const byWidth = (width * margin) / (baseHalf * aspect)
    const byHeight = (height * BAND_PADDING) / (baseHalf * band)
    const fit = Math.min(70, Math.max(byWidth, byHeight))

    // the intro pieces fly in from z ≈ 6–17, so the camera stops at MIN_Z and
    // narrows the lens instead of moving closer for a short hero
    const z = Math.max(MIN_Z, fit)
    const half = (baseHalf * fit) / z
    perspective.fov = THREE.MathUtils.radToDeg(2 * Math.atan(half / 2))

    // centre of the band — equal air above and below the wordmark
    const aim = centre + (headroom + band / 2 - 0.5) * half * z

    perspective.position.set(0, aim, z)
    perspective.lookAt(0, aim, 0)
    perspective.updateProjectionMatrix()
  }, [camera, size, width, height, centre, headroom])

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
  headroom,
}: {
  pointer: React.RefObject<THREE.Vector2>
  headroom: number
}) {
  const quality = useQuality()
  const theme = useTheme((s) => s.theme)
  const stage = STAGE[theme]
  const { size } = useThree()
  // phones break the wordmark over two lines — keyed off width, not the canvas
  // aspect, so a shorter hero cannot flip it back to one cramped line
  const narrow = size.width < 640
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
        centre={sample?.centre ?? 0}
        headroom={headroom}
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

export function HeroScene({ headroom }: { headroom: number }) {
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
        <Stage pointer={pointer} headroom={headroom} />
      </Canvas>
    </div>
  )
}
