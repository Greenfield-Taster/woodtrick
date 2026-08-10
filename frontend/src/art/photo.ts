/**
 * The other way a puzzle face gets made: from a picture somebody brings.
 *
 * The catalogue paints its faces from recipes in `artwork.ts`. These paint
 * theirs from an uploaded image — same output, an offscreen canvas — so the
 * 3D preview, the cart thumbnail and the finished face all come from one
 * source here, exactly as they do for the catalogue.
 */

import { drawPlywood, PLY_TONES } from './artwork'

function surface(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d') }
}

/** Fills the frame with the picture, cropping the overflow rather than squashing it. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  w: number,
  h: number,
) {
  const scale = Math.max(w / image.width, h / image.height)
  const dw = image.width * scale
  const dh = image.height * scale
  ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh)
}

/** The front face: their picture, printed onto the sheet. */
export function photoCanvas(image: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, h)
  if (!ctx) return canvas
  drawPlywood(ctx, w, h, PLY_TONES[0])
  drawCover(ctx, image, w, h)
  return canvas
}

/**
 * The back face when only one picture was given.
 *
 * The catalogue's reverse restates a design in the inverse of its own palette.
 * A photograph has no palette to invert, so it is instead pulled down to the
 * colour of the sheet it is printed on: the same picture, burned into wood
 * rather than printed over it. Keeps the promise that both sides are finished
 * without pretending to be a second photograph.
 */
export function photoBackCanvas(image: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, h)
  if (!ctx) return canvas

  drawPlywood(ctx, w, h, PLY_TONES[2])
  // 'luminosity' keeps the light and shade of the photograph and takes its
  // colour from the ply underneath.
  ctx.globalCompositeOperation = 'luminosity'
  ctx.globalAlpha = 0.88
  drawCover(ctx, image, w, h)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  return canvas
}

/**
 * The bare sheet, with the cut marked out on it.
 *
 * Stands in for the preview before there is anything to preview: the empty
 * state is the material itself, waiting, rather than a dashed rectangle.
 */
export function blankSheetCanvas(w: number, h: number, rows: number, cols: number) {
  const { canvas, ctx } = surface(w, h)
  if (!ctx) return canvas

  drawPlywood(ctx, w, h, PLY_TONES[1])

  ctx.strokeStyle = 'rgba(60, 38, 20, 0.16)'
  ctx.lineWidth = Math.max(1, w / 900)
  for (let col = 1; col < cols; col++) {
    const x = (col / cols) * w
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let row = 1; row < rows; row++) {
    const y = (row / rows) * h
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  return canvas
}

/** A small square of the picture to carry into the cart. */
export function thumbnailUrl(image: HTMLImageElement, size = 200): string {
  const { canvas, ctx } = surface(size, size)
  if (ctx) drawCover(ctx, image, size, size)
  return canvas.toDataURL('image/jpeg', 0.8)
}

export interface LoadedPhoto {
  image: HTMLImageElement
  name: string
  /**
   * A small square copy, as a data URL.
   *
   * The blob URL the file arrived on is released as soon as the pixels are
   * decoded, so anything that wants to *show* the picture — the upload slot,
   * a cart line — needs its own copy rather than a link back to the file.
   */
  preview: string
  /** True when the file is too small to print well at the larger tiers. */
  soft: boolean
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 25 * 1024 * 1024
/** Below this on the short edge, the larger tiers start to show it. */
const SOFT_BELOW = 900

/**
 * Turns a chosen file into an image, or explains why it cannot.
 *
 * Rejections come back as a message for the visitor to read, not an Error to
 * catch: every one of them is something they can fix by picking another file.
 */
export async function loadPhoto(file: File): Promise<LoadedPhoto | { error: string }> {
  if (!ACCEPTED.includes(file.type)) {
    return { error: 'That file is not a picture we can cut. Use a JPEG, PNG, WebP or GIF.' }
  }
  if (file.size > MAX_BYTES) {
    return { error: 'That file is over 25 MB. A photo straight from a phone or camera is plenty.' }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('decode'))
      element.src = url
    })
    return {
      image,
      name: file.name,
      preview: thumbnailUrl(image),
      soft: Math.min(image.naturalWidth, image.naturalHeight) < SOFT_BELOW,
    }
  } catch {
    return { error: 'That picture would not open. It may be damaged — try another file.' }
  } finally {
    // The pixels are decoded by now; the browser keeps them with the element.
    URL.revokeObjectURL(url)
  }
}
