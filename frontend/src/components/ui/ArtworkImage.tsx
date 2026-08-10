import { useEffect, useRef } from 'react'
import type { Artwork } from '../../data/catalog'
import { artworkCanvas } from '../../art/artwork'

interface ArtworkImageProps {
  artwork: Artwork
  className?: string
  resolution?: number
  ratio?: number
}

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
