import { useEffect, useRef } from 'react'
import type { Artwork } from '../../data/catalog'
import { artworkCanvas } from '../../art/artwork'

interface ArtworkImageProps {
  artwork: Artwork
  className?: string
  /** Logical pixel size of the longest edge. */
  resolution?: number
  ratio?: number
}

/**
 * Paints a product's artwork from the shared cache.
 *
 * Drawing straight into this canvas would re-run the generator on every mount,
 * which costs the best part of a second when a catalogue page brings nineteen
 * cards in at once. Instead the generator runs once per (artwork, size) and
 * every card blits the cached bitmap.
 */
export function ArtworkImage({
  artwork,
  className,
  resolution = 420,
  ratio = 1,
}: ArtworkImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = Math.round(resolution * dpr)
    const h = Math.round((resolution / ratio) * dpr)
    canvas.width = w
    canvas.height = h
    ctx.drawImage(artworkCanvas(artwork, w, h), 0, 0)
  }, [artwork, resolution, ratio])

  return <canvas ref={canvasRef} className={className} aria-hidden />
}
