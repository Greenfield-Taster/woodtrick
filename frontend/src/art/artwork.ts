/**
 * Procedural artwork for every product in the catalogue.
 *
 * One entry point renders a recipe onto any 2D context at any size. The result
 * feeds three consumers: card thumbnails, the product page hero, and the face
 * texture of the 3D puzzle. Because they share this function they can never
 * drift apart.
 */

import type { Artwork } from '../data/catalog'
import { drawFigure, type Mapper } from './figures'

/** Deterministic PRNG so a seed always yields the same picture. */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function fitBox(w: number, h: number): Mapper {
  // Square composition centred in whatever aspect we are given.
  const side = Math.min(w, h)
  const ox = (w - side) / 2
  const oy = (h - side) / 2
  return {
    x: (n) => ox + n * side,
    y: (n) => oy + n * side,
    s: (n) => n * side,
  }
}

/**
 * The bare plywood every design is cut from. It is deliberately a light birch
 * rather than the palette's dark tone: the product is wood, and a dark ground
 * makes each puzzle read as a black rectangle with a shape floating on it.
 */
const PLY_TONES = ['#dcbe93', '#d3b184', '#e2c8a1']

function drawPlywood(ctx: CanvasRenderingContext2D, w: number, h: number, tone: string) {
  ctx.fillStyle = tone
  ctx.fillRect(0, 0, w, h)

  const rand = mulberry32(9001)
  const lines = Math.round(h / 6)
  ctx.save()
  ctx.globalCompositeOperation = 'overlay'
  for (let i = 0; i < lines; i++) {
    const y = (i / lines) * h
    const amp = h * 0.012 * (0.3 + rand())
    const freq = 2 + rand() * 4
    const phase = rand() * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= w; x += Math.max(2, w / 120)) {
      ctx.lineTo(x, y + Math.sin((x / w) * freq * Math.PI * 2 + phase) * amp)
    }
    ctx.strokeStyle = `rgba(255, 236, 205, ${0.02 + rand() * 0.045})`
    ctx.lineWidth = Math.max(0.5, h / 900)
    ctx.stroke()
  }
  ctx.restore()

  // Vignette gives the panel some physical depth.
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(40,22,10,0.3)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function drawMandala(
  ctx: CanvasRenderingContext2D,
  m: Mapper,
  opts: { seed: number; symmetry: number; rings: number; palette: string[] },
) {
  const rand = mulberry32(opts.seed)
  const [main, second, shadow] = opts.palette
  const cx = m.x(0.5)
  const cy = m.y(0.5)
  const maxR = m.s(0.46)

  // Each ring gets its own motif, repeated around the symmetry count.
  for (let ring = opts.rings; ring >= 1; ring--) {
    const rOuter = (ring / opts.rings) * maxR
    const rInner = ((ring - 1) / opts.rings) * maxR
    const mid = (rOuter + rInner) / 2
    const thickness = (rOuter - rInner) * (0.55 + rand() * 0.4)
    const motif = Math.floor(rand() * 4)
    const count = opts.symmetry * (rand() > 0.65 ? 2 : 1)
    const color = [main, second, shadow][ring % 3]
    const spin = rand() * Math.PI * 2

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(spin)

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      ctx.save()
      ctx.rotate(angle)
      ctx.fillStyle = color
      ctx.strokeStyle = color

      if (motif === 0) {
        // Petal.
        ctx.beginPath()
        ctx.moveTo(rInner, 0)
        ctx.quadraticCurveTo(mid, thickness * 0.6, rOuter, 0)
        ctx.quadraticCurveTo(mid, -thickness * 0.6, rInner, 0)
        ctx.fill()
      } else if (motif === 1) {
        // Wedge.
        const half = (Math.PI / count) * 0.62
        ctx.beginPath()
        ctx.moveTo(Math.cos(-half) * rInner, Math.sin(-half) * rInner)
        ctx.lineTo(Math.cos(-half) * rOuter, Math.sin(-half) * rOuter)
        ctx.lineTo(Math.cos(half) * rOuter, Math.sin(half) * rOuter)
        ctx.lineTo(Math.cos(half) * rInner, Math.sin(half) * rInner)
        ctx.closePath()
        ctx.fill()
      } else if (motif === 2) {
        // Bead.
        ctx.beginPath()
        ctx.arc(mid, 0, thickness * 0.42, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Spoke.
        ctx.lineWidth = Math.max(1, thickness * 0.18)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(rInner + thickness * 0.1, 0)
        ctx.lineTo(rOuter - thickness * 0.1, 0)
        ctx.stroke()
      }
      ctx.restore()
    }
    ctx.restore()

    // Hairline separating the rings, like a kerf between inlays.
    ctx.beginPath()
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'
    ctx.lineWidth = Math.max(1, maxR * 0.006)
    ctx.stroke()
  }

  // Centre.
  ctx.beginPath()
  ctx.arc(cx, cy, maxR / opts.rings / 1.6, 0, Math.PI * 2)
  ctx.fillStyle = second
  ctx.fill()
}

function drawStrata(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: { seed: number; bands: number; palette: string[] },
) {
  const rand = mulberry32(opts.seed)
  const [main, second, shadow, ground] = opts.palette

  // Sky is left as bare ply, so the lightest part of the picture is the
  // material itself. Only the land is inlaid.
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6)
  sky.addColorStop(0, 'rgba(255,236,205,0.35)')
  sky.addColorStop(1, 'rgba(255,236,205,0)')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  // A low sun, sitting behind the front ridges.
  ctx.beginPath()
  ctx.arc(w * (0.28 + rand() * 0.44), h * 0.34, Math.min(w, h) * 0.13, 0, Math.PI * 2)
  ctx.fillStyle = second
  ctx.fill()

  // Ridges, back to front, each one darker and taller than the last.
  for (let b = 0; b < opts.bands; b++) {
    const t = b / (opts.bands - 1)
    const baseY = h * (0.38 + t * 0.56)
    const amp = h * (0.16 - t * 0.1) * (0.6 + rand() * 0.8)
    const freq = 1 + rand() * 3
    const phase = rand() * Math.PI * 2

    ctx.beginPath()
    ctx.moveTo(0, h)
    ctx.lineTo(0, baseY)
    for (let x = 0; x <= w; x += Math.max(2, w / 160)) {
      const n =
        Math.sin((x / w) * freq * Math.PI * 2 + phase) * 0.6 +
        Math.sin((x / w) * freq * 2.7 * Math.PI * 2 + phase * 1.7) * 0.4
      ctx.lineTo(x, baseY + n * amp)
    }
    ctx.lineTo(w, h)
    ctx.closePath()

    ctx.fillStyle = t < 0.45 ? main : t < 0.8 ? shadow : ground
    ctx.globalAlpha = 0.92
    ctx.fill()
    ctx.globalAlpha = 1

    // Contour hairline along the crest.
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'
    ctx.lineWidth = Math.max(1, h * 0.0025)
    ctx.stroke()
  }
}

export function renderArtwork(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  artwork: Artwork,
) {
  ctx.clearRect(0, 0, w, h)
  const m = fitBox(w, h)

  // Which sheet this design happens to have been cut from. Deterministic, so
  // the same product always shows the same veneer.
  const seed = artwork.kind === 'marquetry' ? artwork.figure.length * 7 : artwork.seed
  drawPlywood(ctx, w, h, PLY_TONES[seed % PLY_TONES.length])

  if (artwork.kind === 'strata') {
    drawStrata(ctx, w, h, artwork)
    return
  }

  if (artwork.kind === 'mandala') {
    drawMandala(ctx, m, artwork)
  } else {
    drawFigure(ctx, m, artwork.figure, artwork.palette)
  }
}

/**
 * The picture on the back of the same puzzle: the design restated in the
 * inverse of its own palette, which is how the workshop actually cuts it — one
 * sheet, two finishes.
 */
export function reverseArtwork(artwork: Artwork): Artwork {
  const [main, second, shadow, ground] = artwork.palette
  const palette = [second, main, ground, shadow]

  if (artwork.kind === 'mandala') {
    return { ...artwork, palette, seed: artwork.seed + 97, symmetry: artwork.symmetry + 2 }
  }
  if (artwork.kind === 'strata') {
    return { ...artwork, palette, seed: artwork.seed + 53, bands: Math.max(5, artwork.bands - 3) }
  }
  return { ...artwork, palette }
}

/**
 * Renders an artwork to an offscreen canvas, memoised per (artwork, size).
 * Callers must not mutate the returned canvas.
 */
const cache = new Map<string, HTMLCanvasElement>()

export function artworkCanvas(artwork: Artwork, w: number, h = w): HTMLCanvasElement {
  const key = `${JSON.stringify(artwork)}|${w}x${h}`
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (ctx) renderArtwork(ctx, w, h, artwork)

  cache.set(key, canvas)
  return canvas
}

export function artworkDataUrl(artwork: Artwork, w: number, h = w): string {
  return artworkCanvas(artwork, w, h).toDataURL('image/png')
}
