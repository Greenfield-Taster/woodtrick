import * as THREE from 'three'
import { mulberry32 } from '../../art/artwork'

export type WoodTone = 'birch' | 'oak' | 'walnut'

const TONES: Record<WoodTone, { base: string; grain: string; knot: string }> = {
  birch: { base: '#dcbe93', grain: '#c19a66', knot: '#a97f4e' },
  oak: { base: '#c39a63', grain: '#a2794a', knot: '#8a6236' },
  walnut: { base: '#8b5c33', grain: '#6a4222', knot: '#4f3018' },
}

function paintWood(ctx: CanvasRenderingContext2D, size: number, tone: WoodTone, seed: number) {
  const rand = mulberry32(seed)
  const { base, grain, knot } = TONES[tone]

  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  const lines = Math.round(size / 2.2)
  for (let i = 0; i < lines; i++) {
    const y = (i / lines) * size
    const amp = size * 0.02 * rand()
    const freq = 1 + rand() * 3
    const phase = rand() * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= size; x += size / 48) {
      ctx.lineTo(x, y + Math.sin((x / size) * freq * Math.PI * 2 + phase) * amp)
    }
    ctx.strokeStyle = grain
    ctx.globalAlpha = 0.05 + rand() * 0.22
    ctx.lineWidth = 0.6 + rand() * 1.8
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  const knots = 2 + Math.floor(rand() * 2)
  for (let k = 0; k < knots; k++) {
    const cx = rand() * size
    const cy = rand() * size
    const rings = 5 + Math.floor(rand() * 5)
    for (let r = rings; r > 0; r--) {
      ctx.beginPath()
      ctx.ellipse(cx, cy, r * size * 0.012, r * size * 0.03, rand() * 0.3, 0, Math.PI * 2)
      ctx.strokeStyle = knot
      ctx.globalAlpha = 0.06 + (1 - r / rings) * 0.16
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

const textureCache = new Map<string, THREE.CanvasTexture>()

export function woodTexture(tone: WoodTone, seed = 3, size = 512): THREE.CanvasTexture {
  const key = `${tone}-${seed}-${size}`
  const hit = textureCache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) paintWood(ctx, size, tone, seed)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 4
  textureCache.set(key, texture)
  return texture
}

export function canvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export interface PieceMaterials {
  materials: THREE.Material[]
  dispose(): void
}

export function woodPieceMaterials(tone: WoodTone = 'oak'): PieceMaterials {
  const map = woodTexture(tone)
  const front = new THREE.MeshStandardMaterial({ map, roughness: 0.62, metalness: 0 })
  const back = new THREE.MeshStandardMaterial({
    map,
    roughness: 0.78,
    metalness: 0,
    color: new THREE.Color('#b78f5e'),
  })
  const edge = new THREE.MeshStandardMaterial({
    color: new THREE.Color(TONES[tone].knot),
    roughness: 0.9,
    metalness: 0,
  })
  return {
    materials: [front, back, edge],
    dispose() {
      front.dispose()
      back.dispose()
      edge.dispose()
    },
  }
}

export function artworkPieceMaterials(
  faceCanvas: HTMLCanvasElement,
  backCanvas: HTMLCanvasElement,
  tone: WoodTone = 'oak',
): PieceMaterials {
  const faceMap = canvasTexture(faceCanvas)
  const backMap = canvasTexture(backCanvas)
  backMap.wrapS = THREE.RepeatWrapping
  backMap.repeat.x = -1
  backMap.offset.x = 1

  const front = new THREE.MeshStandardMaterial({ map: faceMap, roughness: 0.55, metalness: 0 })
  const back = new THREE.MeshStandardMaterial({ map: backMap, roughness: 0.7, metalness: 0 })
  const edge = new THREE.MeshStandardMaterial({
    color: new THREE.Color(TONES[tone].knot),
    roughness: 0.92,
    metalness: 0,
  })

  return {
    materials: [front, back, edge],
    dispose() {
      faceMap.dispose()
      backMap.dispose()
      front.dispose()
      back.dispose()
      edge.dispose()
    },
  }
}

export function disposeWoodTextures() {
  for (const texture of textureCache.values()) texture.dispose()
  textureCache.clear()
}
