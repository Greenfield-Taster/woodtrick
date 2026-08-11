import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BOARD_GREY, silhouetteCanvas } from '../../art/photo'
import { photoAtWidth } from '../../lib/photoSources'
import { useInViewport } from '../../lib/useInViewport'
import { useOrbitDrag } from '../../lib/useOrbitDrag'

/* How far the two faces sit apart — just enough to read as a cut panel edge-on. */
const THICKNESS = 0.012
const FRAME = 3.4

/*
 * It rests square to the camera and only moves under the hand. The turn is
 * capped at a 200° sweep — a hundred each way — so a drag cannot carry it far
 * enough round to put the viewer behind the picture.
 */
const YAW_LIMIT = THREE.MathUtils.degToRad(100)
const PITCH_LIMIT = THREE.MathUtils.degToRad(28)

function useTexture(src: string | undefined) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    if (!src) {
      setTexture(null)
      return
    }

    let live = true
    let loaded: THREE.Texture | null = null

    /*
     * A texture is fetched by hand, so none of the picking an `img` does for
     * itself happens here. The frame is at most about 730 css px wide, which
     * is a 1400-wide master on a retina screen and half that anywhere else —
     * and the master is the heaviest file on the page.
     */
    const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2)

    new THREE.TextureLoader().load(photoAtWidth(src, 730 * dpr), (next) => {
      if (!live) {
        next.dispose()
        return
      }
      next.colorSpace = THREE.SRGBColorSpace
      next.anisotropy = 8
      loaded = next
      setTexture(next)
    })

    return () => {
      live = false
      loaded?.dispose()
      setTexture(null)
    }
  }, [src])

  return texture
}

function Panel({
  texture,
  orbit,
}: {
  texture: THREE.Texture
  orbit: React.RefObject<{ yaw: number; pitch: number }>
}) {
  const group = useRef<THREE.Group>(null)

  const { geometry, materials, silhouette } = useMemo(() => {
    const image = texture.image as HTMLImageElement
    const aspect = image.naturalWidth / image.naturalHeight
    const width = aspect >= 1 ? FRAME : FRAME * aspect
    const height = aspect >= 1 ? FRAME / aspect : FRAME

    const silhouette = new THREE.CanvasTexture(silhouetteCanvas(image, BOARD_GREY))
    silhouette.colorSpace = THREE.SRGBColorSpace

    return {
      geometry: new THREE.PlaneGeometry(width, height),
      silhouette,
      materials: {
        // basic, not lit — the photograph carries its own light and shade, and
        // a lambert term would only mute the colours the picture already has
        front: new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.5,
          side: THREE.FrontSide,
          toneMapped: false,
        }),
        // printed on one side, so the far side is the bare board cut to the
        // same outline — visible only in the last few degrees of the sweep
        back: new THREE.MeshBasicMaterial({
          map: silhouette,
          transparent: true,
          alphaTest: 0.5,
          side: THREE.BackSide,
          toneMapped: false,
        }),
      },
    }
  }, [texture])

  useEffect(
    () => () => {
      geometry.dispose()
      silhouette.dispose()
      materials.front.dispose()
      materials.back.dispose()
    },
    [geometry, materials, silhouette],
  )

  useFrame((_, delta) => {
    if (!group.current) return
    // damped so releasing the pointer settles rather than stops dead; with no
    // drag the target is zero, which is where it started and where it stays
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      orbit.current?.yaw ?? 0,
      9,
      delta,
    )
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      orbit.current?.pitch ?? 0,
      9,
      delta,
    )
  })

  return (
    <group ref={group}>
      <mesh geometry={geometry} material={materials.front} position={[0, 0, THICKNESS]} />
      <mesh geometry={geometry} material={materials.back} position={[0, 0, -THICKNESS]} />
    </group>
  )
}

export function ProductSpin({ src, alt }: { src?: string; alt?: string }) {
  const { ref, visible } = useInViewport<HTMLDivElement>()
  const orbit = useOrbitDrag<HTMLDivElement>({
    yawLimit: YAW_LIMIT,
    pitchLimit: PITCH_LIMIT,
  })
  const texture = useTexture(src)

  return (
    <div
      ref={ref}
      onPointerDown={orbit.onPointerDown}
      role="img"
      aria-label={alt}
      className={['h-full w-full', orbit.dragging ? 'cursor-grabbing' : 'cursor-grab'].join(' ')}
      style={{ touchAction: 'pan-y' }}
    >
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 2]}
        camera={{ fov: 32, position: [0, 0, 8] }}
        gl={{ antialias: true }}
      >
        {texture && <Panel texture={texture} orbit={orbit.offset} />}
      </Canvas>
    </div>
  )
}
