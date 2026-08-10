import type { MarquetryFigure } from '../data/catalog'

export interface Mapper {
  x(n: number): number
  y(n: number): number
  s(n: number): number
}

type Pt = [number, number]

type Palette = string[]

function poly(ctx: CanvasRenderingContext2D, m: Mapper, pts: Pt[], fill: string) {
  ctx.beginPath()
  pts.forEach(([px, py], i) => {
    const cx = m.x(px)
    const cy = m.y(py)
    if (i === 0) ctx.moveTo(cx, cy)
    else ctx.lineTo(cx, cy)
  })
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  m: Mapper,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  rotation = 0,
) {
  ctx.beginPath()
  ctx.ellipse(m.x(cx), m.y(cy), m.s(rx), m.s(ry), rotation, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
}

function taperedPath(
  ctx: CanvasRenderingContext2D,
  m: Mapper,
  pts: Pt[],
  fromWidth: number,
  toWidth: number,
  color: string,
) {
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let i = 0; i < pts.length - 1; i++) {
    const t = i / Math.max(1, pts.length - 2)
    ctx.beginPath()
    ctx.lineWidth = m.s(fromWidth + (toWidth - fromWidth) * t)
    ctx.moveTo(m.x(pts[i][0]), m.y(pts[i][1]))
    ctx.lineTo(m.x(pts[i + 1][0]), m.y(pts[i + 1][1]))
    ctx.stroke()
  }
}

function mirrorX(pts: Pt[]): Pt[] {
  return pts.map(([x, y]) => [1 - x, y] as Pt)
}

function owl(ctx: CanvasRenderingContext2D, m: Mapper, p: Palette) {
  const [main, second, shadow] = p

  poly(
    ctx,
    m,
    [
      [0.5, 0.2],
      [0.78, 0.42],
      [0.8, 0.66],
      [0.68, 0.85],
      [0.5, 0.9],
      [0.32, 0.85],
      [0.2, 0.66],
      [0.22, 0.42],
    ],
    main,
  )

  poly(ctx, m, [[0.24, 0.44], [0.4, 0.55], [0.36, 0.82], [0.24, 0.7]], shadow)
  poly(ctx, m, mirrorX([[0.24, 0.44], [0.4, 0.55], [0.36, 0.82], [0.24, 0.7]]), shadow)

  poly(ctx, m, [[0.3, 0.24], [0.38, 0.1], [0.44, 0.26]], main)
  poly(ctx, m, mirrorX([[0.3, 0.24], [0.38, 0.1], [0.44, 0.26]]), main)

  poly(
    ctx,
    m,
    [
      [0.5, 0.18],
      [0.72, 0.3],
      [0.72, 0.46],
      [0.5, 0.58],
      [0.28, 0.46],
      [0.28, 0.3],
    ],
    second,
  )

  ellipse(ctx, m, 0.4, 0.36, 0.085, 0.085, p[3])
  ellipse(ctx, m, 0.6, 0.36, 0.085, 0.085, p[3])
  ellipse(ctx, m, 0.4, 0.36, 0.038, 0.038, second)
  ellipse(ctx, m, 0.6, 0.36, 0.038, 0.038, second)

  poly(ctx, m, [[0.5, 0.4], [0.545, 0.5], [0.455, 0.5]], main)

  ctx.strokeStyle = second
  ctx.lineWidth = m.s(0.012)
  for (let i = 0; i < 4; i++) {
    const y = 0.62 + i * 0.065
    ctx.beginPath()
    ctx.moveTo(m.x(0.4), m.y(y))
    ctx.lineTo(m.x(0.5), m.y(y + 0.035))
    ctx.lineTo(m.x(0.6), m.y(y))
    ctx.stroke()
  }

  poly(ctx, m, [[0.44, 0.88], [0.48, 0.95], [0.4, 0.95]], shadow)
  poly(ctx, m, mirrorX([[0.44, 0.88], [0.48, 0.95], [0.4, 0.95]]), shadow)
}

function deer(ctx: CanvasRenderingContext2D, m: Mapper, p: Palette) {
  const [main, second, shadow] = p

  const antler: Pt[] = [
    [0.44, 0.46],
    [0.4, 0.36],
    [0.34, 0.28],
    [0.28, 0.19],
    [0.24, 0.1],
  ]
  taperedPath(ctx, m, antler, 0.03, 0.012, second)
  taperedPath(ctx, m, mirrorX(antler), 0.03, 0.012, second)

  const branches: Pt[][] = [
    [[0.4, 0.36], [0.3, 0.33], [0.24, 0.29]],
    [[0.34, 0.28], [0.24, 0.22], [0.17, 0.2]],
    [[0.28, 0.19], [0.2, 0.13], [0.14, 0.12]],
  ]
  for (const b of branches) {
    taperedPath(ctx, m, b, 0.019, 0.008, second)
    taperedPath(ctx, m, mirrorX(b), 0.019, 0.008, second)
  }

  ellipse(ctx, m, 0.335, 0.5, 0.075, 0.038, shadow, -0.5)
  ellipse(ctx, m, 0.665, 0.5, 0.075, 0.038, shadow, 0.5)

  poly(
    ctx,
    m,
    [
      [0.5, 0.42],
      [0.63, 0.5],
      [0.62, 0.68],
      [0.56, 0.86],
      [0.5, 0.92],
      [0.44, 0.86],
      [0.38, 0.68],
      [0.37, 0.5],
    ],
    main,
  )

  poly(ctx, m, [[0.5, 0.66], [0.58, 0.74], [0.53, 0.9], [0.47, 0.9], [0.42, 0.74]], second)

  ellipse(ctx, m, 0.425, 0.585, 0.028, 0.032, p[3])
  ellipse(ctx, m, 0.575, 0.585, 0.028, 0.032, p[3])
  poly(ctx, m, [[0.5, 0.83], [0.535, 0.88], [0.465, 0.88]], p[3])
}

function whale(ctx: CanvasRenderingContext2D, m: Mapper, p: Palette) {
  const [main, second, shadow] = p

  ctx.beginPath()
  ctx.moveTo(m.x(0.12), m.y(0.52))
  ctx.bezierCurveTo(m.x(0.22), m.y(0.28), m.x(0.6), m.y(0.24), m.x(0.74), m.y(0.42))
  ctx.bezierCurveTo(m.x(0.82), m.y(0.53), m.x(0.8), m.y(0.62), m.x(0.72), m.y(0.68))
  ctx.bezierCurveTo(m.x(0.5), m.y(0.82), m.x(0.22), m.y(0.74), m.x(0.12), m.y(0.52))
  ctx.closePath()
  ctx.fillStyle = main
  ctx.fill()

  poly(ctx, m, [[0.74, 0.44], [0.94, 0.24], [0.9, 0.5], [0.95, 0.74], [0.74, 0.62]], main)

  ctx.beginPath()
  ctx.moveTo(m.x(0.16), m.y(0.56))
  ctx.bezierCurveTo(m.x(0.34), m.y(0.78), m.x(0.58), m.y(0.76), m.x(0.7), m.y(0.64))
  ctx.bezierCurveTo(m.x(0.5), m.y(0.72), m.x(0.3), m.y(0.68), m.x(0.16), m.y(0.56))
  ctx.closePath()
  ctx.fillStyle = second
  ctx.fill()

  ctx.strokeStyle = shadow
  ctx.lineWidth = m.s(0.009)
  for (let i = 0; i < 6; i++) {
    const t = 0.2 + i * 0.075
    ctx.beginPath()
    ctx.moveTo(m.x(t), m.y(0.62 - i * 0.005))
    ctx.lineTo(m.x(t + 0.03), m.y(0.73 - i * 0.012))
    ctx.stroke()
  }

  poly(ctx, m, [[0.4, 0.62], [0.52, 0.7], [0.38, 0.76]], shadow)
  ellipse(ctx, m, 0.22, 0.5, 0.018, 0.018, p[3])
}

function butterfly(ctx: CanvasRenderingContext2D, m: Mapper, p: Palette) {
  const [main, second, shadow] = p

  const wing = (flip: boolean) => {
    const sx = (n: number) => (flip ? 1 - n : n)
    ctx.beginPath()
    ctx.moveTo(m.x(sx(0.5)), m.y(0.5))
    ctx.bezierCurveTo(m.x(sx(0.34)), m.y(0.12), m.x(sx(0.06)), m.y(0.16), m.x(sx(0.1)), m.y(0.44))
    ctx.bezierCurveTo(m.x(sx(0.13)), m.y(0.56), m.x(sx(0.34)), m.y(0.54), m.x(sx(0.5)), m.y(0.5))
    ctx.closePath()
    ctx.fillStyle = main
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(m.x(sx(0.5)), m.y(0.52))
    ctx.bezierCurveTo(m.x(sx(0.32)), m.y(0.58), m.x(sx(0.16)), m.y(0.72), m.x(sx(0.26)), m.y(0.9))
    ctx.bezierCurveTo(m.x(sx(0.36)), m.y(0.99), m.x(sx(0.47)), m.y(0.76), m.x(sx(0.5)), m.y(0.62))
    ctx.closePath()
    ctx.fillStyle = shadow
    ctx.fill()

    ellipse(ctx, m, sx(0.24), 0.32, 0.07, 0.055, second)
    ellipse(ctx, m, sx(0.24), 0.32, 0.03, 0.024, p[3])
    ellipse(ctx, m, sx(0.3), 0.79, 0.038, 0.03, second)
  }

  wing(false)
  wing(true)

  ellipse(ctx, m, 0.5, 0.56, 0.022, 0.19, second)
  ellipse(ctx, m, 0.5, 0.36, 0.032, 0.045, second)
  taperedPath(ctx, m, [[0.5, 0.34], [0.42, 0.22], [0.36, 0.14]], 0.012, 0.005, second)
  taperedPath(ctx, m, [[0.5, 0.34], [0.58, 0.22], [0.64, 0.14]], 0.012, 0.005, second)
}

function fox(ctx: CanvasRenderingContext2D, m: Mapper, p: Palette) {
  const [main, second, shadow] = p

  poly(ctx, m, [[0.26, 0.44], [0.3, 0.1], [0.5, 0.34]], main)
  poly(ctx, m, mirrorX([[0.26, 0.44], [0.3, 0.1], [0.5, 0.34]]), main)
  poly(ctx, m, [[0.32, 0.38], [0.34, 0.19], [0.45, 0.35]], shadow)
  poly(ctx, m, mirrorX([[0.32, 0.38], [0.34, 0.19], [0.45, 0.35]]), shadow)

  poly(
    ctx,
    m,
    [
      [0.5, 0.28],
      [0.76, 0.4],
      [0.72, 0.62],
      [0.5, 0.94],
      [0.28, 0.62],
      [0.24, 0.4],
    ],
    main,
  )

  poly(ctx, m, [[0.28, 0.5], [0.44, 0.6], [0.32, 0.68]], second)
  poly(ctx, m, mirrorX([[0.28, 0.5], [0.44, 0.6], [0.32, 0.68]]), second)

  poly(ctx, m, [[0.5, 0.6], [0.6, 0.72], [0.5, 0.94], [0.4, 0.72]], second)

  poly(ctx, m, [[0.36, 0.48], [0.46, 0.52], [0.37, 0.56]], p[3])
  poly(ctx, m, mirrorX([[0.36, 0.48], [0.46, 0.52], [0.37, 0.56]]), p[3])
  poly(ctx, m, [[0.5, 0.78], [0.545, 0.85], [0.455, 0.85]], p[3])
}

function ram(ctx: CanvasRenderingContext2D, m: Mapper, p: Palette) {
  const [main, second, shadow] = p

  const horn = (flip: boolean): Pt[] => {
    const out: Pt[] = []
    const dir = flip ? -1 : 1
    for (let i = 0; i <= 40; i++) {
      const t = i / 40
      const angle = -0.6 + t * Math.PI * 1.85
      const radius = 0.26 * (1 - t * 0.68)
      out.push([0.5 + dir * (0.13 + Math.cos(angle) * radius), 0.44 + Math.sin(angle) * radius])
    }
    return out
  }
  taperedPath(ctx, m, horn(false), 0.075, 0.016, second)
  taperedPath(ctx, m, horn(true), 0.075, 0.016, second)

  ctx.strokeStyle = shadow
  ctx.lineWidth = m.s(0.006)
  for (const pts of [horn(false), horn(true)]) {
    for (let i = 4; i < pts.length - 2; i += 4) {
      const [ax, ay] = pts[i]
      const [bx, by] = pts[i + 1]
      const nx = -(by - ay)
      const ny = bx - ax
      const len = Math.hypot(nx, ny) || 1
      const w = 0.03 * (1 - i / pts.length)
      ctx.beginPath()
      ctx.moveTo(m.x(ax - (nx / len) * w), m.y(ay - (ny / len) * w))
      ctx.lineTo(m.x(ax + (nx / len) * w), m.y(ay + (ny / len) * w))
      ctx.stroke()
    }
  }

  poly(
    ctx,
    m,
    [
      [0.5, 0.34],
      [0.62, 0.46],
      [0.6, 0.7],
      [0.5, 0.92],
      [0.4, 0.7],
      [0.38, 0.46],
    ],
    main,
  )
  poly(ctx, m, [[0.5, 0.62], [0.565, 0.72], [0.5, 0.92], [0.435, 0.72]], second)
  ellipse(ctx, m, 0.442, 0.55, 0.026, 0.02, p[3])
  ellipse(ctx, m, 0.558, 0.55, 0.026, 0.02, p[3])
}

function dragon(ctx: CanvasRenderingContext2D, m: Mapper, p: Palette) {
  const [main, second, shadow] = p

  const cx = 0.5
  const cy = 0.52
  const pts: Pt[] = []
  const turns = 1.5
  const steps = 200
  const headAngle = -0.5
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const angle = headAngle + t * Math.PI * 2 * turns
    const radius = 0.05 + 0.38 * (1 - t) ** 1.7
    pts.push([cx + Math.cos(angle) * radius * 1.04, cy + Math.sin(angle) * radius])
  }

  for (let i = 4; i < steps - 30; i += 7) {
    const [ax, ay] = pts[i]
    const dx = ax - cx
    const dy = ay - cy
    const len = Math.hypot(dx, dy) || 1
    const along = 0.024 * (1 - i / steps)
    const [bx, by] = pts[i + 3] ?? pts[i]
    const h = 0.075 * (1 - i / steps) ** 1.2 + 0.008
    poly(
      ctx,
      m,
      [
        [ax, ay],
        [ax + (dx / len) * h - (by - ay) * 0.1, ay + (dy / len) * h + (bx - ax) * 0.1],
        [bx, by],
        [ax + along, ay + along],
      ],
      shadow,
    )
  }

  taperedPath(ctx, m, pts, 0.115, 0.014, main)

  const [hx, hy] = pts[0]
  const ox = (hx - cx) / Math.hypot(hx - cx, hy - cy)
  const oy = (hy - cy) / Math.hypot(hx - cx, hy - cy)
  const nx = -oy
  const ny = ox
  const at = (along: number, side: number): Pt => [
    hx + ox * along + nx * side,
    hy + oy * along + ny * side,
  ]

  poly(ctx, m, [at(-0.02, -0.075), at(0.13, -0.05), at(0.19, 0), at(0.12, 0.055), at(-0.02, 0.075)], main)
  poly(ctx, m, [at(0.06, -0.045), at(0.2, -0.008), at(0.19, 0.03), at(0.06, 0.045)], second)
  poly(ctx, m, [at(0.0, -0.06), at(-0.11, -0.15), at(-0.02, -0.02)], second)
  poly(ctx, m, [at(-0.01, 0.05), at(-0.13, 0.12), at(-0.03, 0.015)], shadow)
  ellipse(ctx, m, ...(at(0.05, -0.022) as [number, number]), 0.019, 0.013, p[3])
}

const FIGURES: Record<
  MarquetryFigure,
  (ctx: CanvasRenderingContext2D, m: Mapper, p: Palette) => void
> = { owl, deer, whale, butterfly, fox, dragon, ram }

export function drawFigure(
  ctx: CanvasRenderingContext2D,
  m: Mapper,
  figure: MarquetryFigure,
  palette: Palette,
) {
  FIGURES[figure](ctx, m, palette)
}
