import { drawPlywood, PLY_TONES } from './artwork'

function surface(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d') }
}

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

export function photoCanvas(image: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, h)
  if (!ctx) return canvas
  drawPlywood(ctx, w, h, PLY_TONES[0])
  drawCover(ctx, image, w, h)
  return canvas
}

export function photoBackCanvas(image: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const { canvas, ctx } = surface(w, h)
  if (!ctx) return canvas

  drawPlywood(ctx, w, h, PLY_TONES[2])
  ctx.globalCompositeOperation = 'luminosity'
  ctx.globalAlpha = 0.88
  drawCover(ctx, image, w, h)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  return canvas
}

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

export function thumbnailUrl(image: HTMLImageElement, size = 200): string {
  const { canvas, ctx } = surface(size, size)
  if (ctx) drawCover(ctx, image, size, size)
  return canvas.toDataURL('image/jpeg', 0.8)
}

export interface LoadedPhoto {
  image: HTMLImageElement
  name: string
  preview: string
  soft: boolean
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 25 * 1024 * 1024
const SOFT_BELOW = 900

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
    URL.revokeObjectURL(url)
  }
}
