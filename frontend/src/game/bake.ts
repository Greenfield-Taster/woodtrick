/*
 * Turning outlines and a picture into one small bitmap per piece.
 *
 * This is the decision the whole game's performance rests on. Clipping 300
 * outlines out of a large image every frame is hopeless; doing it once and then
 * drawing 300 ready-made bitmaps is nothing. The cost is memory, so the baking
 * resolution is capped rather than taken from the source image.
 */

import type { CutPiece } from './cut'

/* Padding around a piece's own extent, in cell units, to hold its shadow. */
const PAD = 0.08

/* Bounds on how many pixels one cell is baked at. */
const MIN_CELL = 44
const MAX_CELL = 168

export interface BakedPiece {
  bitmap: HTMLCanvasElement
  /* Where the bitmap's top-left sits relative to the piece's cell corner. */
  ox: number
  oy: number
  /* Bitmap size in cell units. */
  w: number
  h: number
  /* The outline at 100 units per cell, for hit-testing. */
  hit: Path2D
}

export interface Baked {
  pieces: BakedPiece[]
  dispose(): void
}

/*
 * The extent of what is actually drawn. The catalogue art is cut out against
 * transparency with a good deal of empty margin, and cutting the margin into
 * the puzzle would hand the player a row of blank cream tiles down each side.
 * The subject's own bounding box is the puzzle.
 */
function opaqueBounds(image: HTMLImageElement) {
  const w = image.naturalWidth
  const h = image.naturalHeight
  const full = { x: 0, y: 0, w, h }

  const probe = document.createElement('canvas')
  probe.width = w
  probe.height = h
  const ctx = probe.getContext('2d', { willReadFrequently: true })
  if (!ctx) return full

  ctx.drawImage(image, 0, 0)

  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, w, h).data
  } catch {
    return full // a tainted canvas; cut the whole frame rather than nothing
  }

  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 12) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  probe.width = 0
  probe.height = 0

  if (maxX < minX || maxY < minY) return full

  // a little air, so a tab cut at the very edge still has picture under it
  const padX = Math.round(w * 0.012)
  const padY = Math.round(h * 0.012)
  const x = Math.max(0, minX - padX)
  const y = Math.max(0, minY - padY)

  return {
    x,
    y,
    w: Math.min(w, maxX + padX) - x + 1,
    h: Math.min(h, maxY + padY) - y + 1,
  }
}

/*
 * The picture the puzzle is cut from: the subject, trimmed to itself and laid on
 * board tone so that what was transparent is something rather than nothing.
 */
export function boardImage(
  image: HTMLImageElement,
  maxWidth: number,
  tone = '#e8d5b5',
): HTMLCanvasElement {
  const crop = opaqueBounds(image)
  const scale = Math.min(1, maxWidth / crop.w)
  const width = Math.max(1, Math.round(crop.w * scale))
  const height = Math.max(1, Math.round(crop.h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, tone)
  grad.addColorStop(1, '#d8c09b')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  ctx.drawImage(image, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height)
  return canvas
}

function tracePath(path: Path2D | CanvasRenderingContext2D, piece: CutPiece, s: number, ox: number, oy: number) {
  const pts = piece.points
  path.moveTo((pts[0].x - ox) * s, (pts[0].y - oy) * s)
  for (let i = 1; i < pts.length; i++) path.lineTo((pts[i].x - ox) * s, (pts[i].y - oy) * s)
  path.closePath()
}

export function bakePieces(
  pieces: CutPiece[],
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  rows: number,
  cols: number,
): Baked {
  const cellPx = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.round(imageWidth / cols)))
  const sxPerCell = imageWidth / cols
  const syPerCell = imageHeight / rows

  const baked: BakedPiece[] = pieces.map((piece) => {
    const ox = piece.minX - PAD
    const oy = piece.minY - PAD
    const w = piece.maxX - piece.minX + PAD * 2
    const h = piece.maxY - piece.minY + PAD * 2

    const bitmap = document.createElement('canvas')
    bitmap.width = Math.ceil(w * cellPx)
    bitmap.height = Math.ceil(h * cellPx)

    const hit = new Path2D()
    tracePath(hit, piece, 100, 0, 0)

    const ctx = bitmap.getContext('2d')
    if (!ctx) return { bitmap, ox, oy, w, h, hit }

    const outline = new Path2D()
    tracePath(outline, piece, cellPx, ox, oy)

    // a soft drop shadow, baked in so a resting piece costs one drawImage
    ctx.save()
    ctx.filter = `blur(${Math.max(1, cellPx * 0.03)}px)`
    ctx.translate(cellPx * 0.018, cellPx * 0.03)
    ctx.fillStyle = 'rgba(0,0,0,0.42)'
    ctx.fill(outline)
    ctx.restore()

    ctx.save()
    ctx.clip(outline)

    // the slice of the picture this piece covers, tabs and all
    ctx.drawImage(
      image,
      (piece.col + ox) * sxPerCell,
      (piece.row + oy) * syPerCell,
      w * sxPerCell,
      h * syPerCell,
      0,
      0,
      bitmap.width,
      bitmap.height,
    )

    // bevel: the cut is a real edge, so it catches light on one side of the
    // piece and loses it on the other. Stroking the outline twice from inside
    // the clip is cheaper than any lighting model and reads the same.
    const bevel = Math.max(1.2, cellPx * 0.085)
    ctx.lineWidth = bevel * 2
    ctx.strokeStyle = 'rgba(255,244,225,0.5)'
    ctx.save()
    ctx.translate(-bevel * 0.5, -bevel * 0.5)
    ctx.stroke(outline)
    ctx.restore()

    ctx.strokeStyle = 'rgba(60,34,14,0.42)'
    ctx.save()
    ctx.translate(bevel * 0.5, bevel * 0.5)
    ctx.stroke(outline)
    ctx.restore()

    ctx.restore()

    // and a hairline all the way round, so a piece stays legible against a
    // piece of the same colour
    ctx.lineWidth = Math.max(1, cellPx * 0.022)
    ctx.strokeStyle = 'rgba(38,22,10,0.55)'
    ctx.stroke(outline)

    return { bitmap, ox, oy, w, h, hit }
  })

  return {
    pieces: baked,
    dispose() {
      for (const piece of baked) {
        piece.bitmap.width = 0
        piece.bitmap.height = 0
      }
      baked.length = 0
    },
  }
}
