/*
 * What is left of the generated-artwork engine. The catalogue is photographed
 * now, so the mandala, marquetry and strata painters have gone; the board
 * texture and the seeded RNG stay, because the piece geometry and the custom
 * puzzle still draw on them.
 */

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const PLY_TONES = ['#dcbe93', '#d3b184', '#e2c8a1']

export function drawPlywood(ctx: CanvasRenderingContext2D, w: number, h: number, tone: string) {
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

  const g = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.25,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.75,
  )
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, 'rgba(40,22,10,0.3)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}
