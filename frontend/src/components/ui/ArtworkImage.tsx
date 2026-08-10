import { useEffect, useRef } from 'react'
import type { Artwork } from '../../data/catalog'
import { renderArtwork } from '../../art/artwork'

interface ArtworkImageProps {
  artwork: Artwork
  className?: string
  /** Logical pixel size of the longest edge. */
  resolution?: number
  ratio?: number
}

/**
 * Draws a product's artwork straight into a canvas. There is no image file to
 * request, so cards paint on first frame and stay crisp on any display.
 */
export function ArtworkImage({
  artwork,
  className,
  resolution = 720,
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
    renderArtwork(ctx, w, h, artwork)
  }, [artwork, resolution, ratio])

  return <canvas ref={canvasRef} className={className} aria-hidden />
}
