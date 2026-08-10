import { useEffect, useState } from 'react'

export interface WordmarkSample {
  /** Target centres in world units, y up, centred on the origin. */
  points: Array<[number, number]>
  /** Distance between neighbouring samples, in world units. */
  spacing: number
  width: number
  height: number
}

/**
 * Turns a word into a point cloud by rasterising it and sampling the result.
 *
 * Sampling the real glyphs rather than hand-placing pieces means the lettering
 * stays exact at any viewport width and any piece count, and it lets the word
 * be changed by editing a string.
 */
export function sampleWordmark(
  lines: string[],
  count: number,
  worldWidth: number,
  fontFamily: string,
): WordmarkSample {
  const W = 1400
  const H = lines.length === 1 ? 380 : 820
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { points: [], spacing: 1, width: worldWidth, height: 0 }

  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Deliberately not the display serif. Rebuilding a word out of chunky pieces
  // is a quantisation problem: high stroke contrast loses its thin strokes and
  // blobs its thick ones. A heavy, even-weight grotesque survives it, and the
  // wood does the character work the serif would have done.
  const setFont = (px: number) => {
    ctx.font = `900 ${px}px ${fontFamily}`
    ctx.letterSpacing = `${px * 0.02}px`
  }

  const probe = 300
  setFont(probe)
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width))
  const byWidth = (probe * (W * 0.97)) / widest
  const byHeight = (H * 0.92) / lines.length
  const fontSize = Math.min(probe * 1.6, byWidth, byHeight)
  setFont(fontSize)

  const lineHeight = fontSize * 0.98
  const firstY = H / 2 - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, index) => ctx.fillText(line, W / 2, firstY + index * lineHeight))

  const data = ctx.getImageData(0, 0, W, H).data
  const inked = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false
    return data[((Math.floor(y) * W + Math.floor(x)) << 2) + 3] > 128
  }

  // Choose a grid step that yields roughly `count` filled cells.
  let filled = 0
  for (let i = 3; i < data.length; i += 4 * 4) if (data[i] > 128) filled++
  const inkArea = filled * 4
  const step = Math.max(2, Math.sqrt(inkArea / count))

  // A cell is kept only if it is mostly inside the glyph. Testing the centre
  // alone leaves ragged pieces hanging off every stem.
  const q = step * 0.3
  const cells: Array<[number, number]> = []
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      const coverage =
        (inked(x, y) ? 2 : 0) +
        (inked(x - q, y) ? 1 : 0) +
        (inked(x + q, y) ? 1 : 0) +
        (inked(x, y - q) ? 1 : 0) +
        (inked(x, y + q) ? 1 : 0)
      if (coverage >= 5) cells.push([x, y])
    }
  }

  const scale = worldWidth / W
  const points = cells.map(
    ([x, y]) => [(x - W / 2) * scale, -(y - H / 2) * scale] as [number, number],
  )

  // The camera frames what was actually inked, not the raster it was drawn on.
  // Guessing the extent is what pushes long words off the side of a phone.
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])

  return {
    points,
    spacing: step * scale,
    width: points.length ? Math.max(...xs) - Math.min(...xs) + step * scale : worldWidth,
    height: points.length ? Math.max(...ys) - Math.min(...ys) + step * scale : 0,
  }
}

/** Waits for the face to load, then samples. */
export function useWordmarkPoints(
  lines: string[],
  count: number,
  worldWidth: number,
): WordmarkSample | null {
  const [sample, setSample] = useState<WordmarkSample | null>(null)
  const key = lines.join('|')

  useEffect(() => {
    let cancelled = false
    const word = key.split('|')
    const family = '"Inter Tight Variable", system-ui, sans-serif'

    const run = async () => {
      try {
        await document.fonts.load(`900 240px ${family}`)
        await document.fonts.ready
      } catch {
        // A missing webfont only changes the letterforms, not the mechanism.
      }
      if (cancelled) return
      setSample(sampleWordmark(word, count, worldWidth, family))
    }

    run()
    return () => {
      cancelled = true
    }
  }, [key, count, worldWidth])

  return sample
}
