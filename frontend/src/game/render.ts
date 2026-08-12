/*
 * The painter. It owns the canvas, the camera and the small amount of motion
 * that is purely visual — a group easing into a snap, a held piece lifting — and
 * it owns no rules at all. Give it a state and it draws that state.
 */

import type { BakedPiece } from './bake'
import type { GameState, Snap } from './state'

export interface Camera {
  /* Board position at the centre of the canvas, and pixels per cell. */
  x: number
  y: number
  scale: number
}

interface Ease {
  dx: number
  dy: number
  t: number
}

const EASE_MS = 260

function outCubic(t: number) {
  const u = 1 - t
  return 1 - u * u * u
}

function outBack(t: number) {
  const u = t - 1
  return 1 + 2.2 * u * u * u + 1.2 * u * u
}

export interface Scene {
  camera: Camera
  /* Group currently held, drawn lifted. */
  lift: number | null
  /* Original picture shown faintly under the pieces. */
  ghost: boolean
  /* Pieces that are not on an outer edge are dimmed. */
  edgesOnly: boolean
  /* 0..1 while the opening animation plays, null once the game is live. */
  intro: number | null
  /* Groups held by other players, dimmed and unclickable. */
  claimed: Set<number>

  resize(): void
  draw(now: number): void
  fit(): void
  toBoard(clientX: number, clientY: number): { x: number; y: number }
  pieceAt(clientX: number, clientY: number): number | null
  zoomAt(clientX: number, clientY: number, factor: number): void
  panBy(dxPx: number, dyPx: number): void
  animateSnaps(snaps: Snap[]): void
  dispose(): void
}

export function createScene(
  canvas: HTMLCanvasElement,
  state: GameState,
  baked: BakedPiece[],
  picture: HTMLCanvasElement,
): Scene {
  const ctx = canvas.getContext('2d')!
  const eases = new Map<number, Ease>()
  let width = 0
  let height = 0
  let last = 0

  /* Per-piece delay for the opening burst, so it blooms out of the middle. */
  const stagger = state.pieces.map((piece) => {
    const dx = (piece.col + 0.5) / state.cols - 0.5
    const dy = (piece.row + 0.5) / state.rows - 0.5
    return Math.min(1, Math.hypot(dx, dy) * 2)
  })

  const camera: Camera = { x: state.cols / 2, y: state.rows / 2, scale: 40 }

  const scene: Scene = {
    camera,
    lift: null,
    ghost: false,
    edgesOnly: false,
    intro: null,
    claimed: new Set(),
    resize,
    draw,
    fit,
    toBoard,
    pieceAt,
    zoomAt,
    panBy,
    animateSnaps,
    dispose,
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const rect = canvas.getBoundingClientRect()
    width = rect.width
    height = rect.height
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  /*
   * Frame everything that is actually on the table, not just the picture. A
   * player who has to hunt off-screen for their first piece has been let down
   * before they started, so this measures where the pieces really are rather
   * than assuming how far the scatter threw them.
   */
  function fit() {
    let minX = 0
    let minY = 0
    let maxX = state.cols
    let maxY = state.rows

    for (const piece of state.pieces) {
      const box = baked[piece.id]
      if (piece.x + box.ox < minX) minX = piece.x + box.ox
      if (piece.y + box.oy < minY) minY = piece.y + box.oy
      if (piece.x + box.ox + box.w > maxX) maxX = piece.x + box.ox + box.w
      if (piece.y + box.oy + box.h > maxY) maxY = piece.y + box.oy + box.h
    }

    const margin = 0.5
    camera.x = (minX + maxX) / 2
    camera.y = (minY + maxY) / 2
    camera.scale = Math.max(
      6,
      Math.min(width / (maxX - minX + margin * 2), height / (maxY - minY + margin * 2)),
    )
  }

  function toBoard(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: camera.x + (clientX - rect.left - width / 2) / camera.scale,
      y: camera.y + (clientY - rect.top - height / 2) / camera.scale,
    }
  }

  function pieceAt(clientX: number, clientY: number): number | null {
    const point = toBoard(clientX, clientY)

    for (let i = state.order.length - 1; i >= 0; i--) {
      const group = state.order[i]
      if (scene.claimed.has(group)) continue

      const ids = state.groups.get(group)
      if (!ids) continue

      for (const id of ids) {
        const piece = state.pieces[id]
        const localX = (point.x - piece.x) * 100
        const localY = (point.y - piece.y) * 100
        // a cheap rectangle test first; isPointInPath on every piece would walk
        // a few hundred segments each time
        const box = baked[id]
        if (
          localX < box.ox * 100 ||
          localY < box.oy * 100 ||
          localX > (box.ox + box.w) * 100 ||
          localY > (box.oy + box.h) * 100
        ) {
          continue
        }
        if (ctx.isPointInPath(box.hit, localX, localY)) return id
      }
    }

    return null
  }

  function zoomAt(clientX: number, clientY: number, factor: number) {
    const before = toBoard(clientX, clientY)
    camera.scale = Math.max(5, Math.min(320, camera.scale * factor))
    const after = toBoard(clientX, clientY)
    camera.x += before.x - after.x
    camera.y += before.y - after.y
  }

  function panBy(dxPx: number, dyPx: number) {
    camera.x -= dxPx / camera.scale
    camera.y -= dyPx / camera.scale
  }

  /*
   * A snap has already happened in the state by the time this is called, so the
   * group is drawn starting from where it came from and eased back to zero.
   */
  function animateSnaps(snaps: Snap[]) {
    for (const snap of snaps) {
      const existing = eases.get(snap.into)
      eases.set(snap.into, {
        dx: -snap.dx + (existing?.dx ?? 0),
        dy: -snap.dy + (existing?.dy ?? 0),
        t: 0,
      })
    }
  }

  function paintTable() {
    ctx.fillStyle = '#14100d'
    ctx.fillRect(0, 0, width, height)

    const glow = ctx.createRadialGradient(
      width / 2,
      height * 0.42,
      0,
      width / 2,
      height * 0.42,
      Math.max(width, height) * 0.72,
    )
    glow.addColorStop(0, 'rgba(84,64,44,0.55)')
    glow.addColorStop(1, 'rgba(12,9,7,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, width, height)
  }

  function boardRect() {
    return {
      x: width / 2 + (0 - camera.x) * camera.scale,
      y: height / 2 + (0 - camera.y) * camera.scale,
      w: state.cols * camera.scale,
      h: state.rows * camera.scale,
    }
  }

  function paintGhost(alpha: number) {
    const rect = boardRect()
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.drawImage(picture, rect.x, rect.y, rect.w, rect.h)
    ctx.restore()

    ctx.save()
    ctx.strokeStyle = 'rgba(216,96,44,0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h)
    ctx.restore()
  }

  function paintSweep(p: number) {
    const band = (p - 0.04) / 0.3
    if (band < 0 || band > 1) return

    const rect = boardRect()
    const reach = rect.w + rect.h
    const at = -rect.h + band * reach

    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.w, rect.h)
    ctx.clip()
    ctx.globalCompositeOperation = 'screen'

    const grad = ctx.createLinearGradient(
      rect.x + at - reach * 0.16,
      rect.y,
      rect.x + at + reach * 0.16,
      rect.y + rect.h,
    )
    grad.addColorStop(0, 'rgba(255,232,200,0)')
    grad.addColorStop(0.5, 'rgba(255,232,200,0.42)')
    grad.addColorStop(1, 'rgba(255,232,200,0)')
    ctx.fillStyle = grad
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
    ctx.restore()
  }

  function drawPiece(id: number, px: number, py: number, alpha: number, lifted: boolean) {
    const box = baked[id]
    const s = camera.scale
    const x = width / 2 + (px + box.ox - camera.x) * s
    const y = height / 2 + (py + box.oy - camera.y) * s
    const w = box.w * s
    const h = box.h * s

    if (x + w < -40 || y + h < -40 || x > width + 40 || y > height + 40) return

    ctx.save()
    ctx.globalAlpha = alpha

    if (lifted) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)'
      ctx.shadowBlur = s * 0.4
      ctx.shadowOffsetY = s * 0.14
      const cx = x + w / 2
      const cy = y + h / 2
      ctx.translate(cx, cy)
      ctx.scale(1.045, 1.045)
      ctx.translate(-cx, -cy)
    }

    ctx.drawImage(box.bitmap, x, y, w, h)
    ctx.restore()
  }

  function draw(now: number) {
    const delta = last ? Math.min(64, now - last) : 16
    last = now

    for (const [group, ease] of eases) {
      ease.t += delta / EASE_MS
      if (ease.t >= 1) eases.delete(group)
    }

    paintTable()

    const intro = scene.intro
    if (scene.ghost && intro === null) paintGhost(0.16)

    for (const group of state.order) {
      const ids = state.groups.get(group)
      if (!ids) continue

      const ease = eases.get(group)
      const slide = ease ? 1 - outBack(Math.min(1, ease.t)) : 0
      const ox = ease ? ease.dx * slide : 0
      const oy = ease ? ease.dy * slide : 0

      const lifted = scene.lift === group
      const held = scene.claimed.has(group)

      for (const id of ids) {
        const piece = state.pieces[id]
        let px = piece.x + ox
        let py = piece.y + oy
        let alpha = held ? 0.68 : 1

        if (intro !== null) {
          const local = Math.max(
            0,
            Math.min(1, (intro - 0.3 - stagger[id] * 0.16) / 0.44),
          )
          const k = outCubic(local)
          px = piece.col + (piece.x - piece.col) * k
          py = piece.row + (piece.y - piece.row) * k
          alpha = Math.min(1, intro / 0.12)
        } else if (scene.edgesOnly) {
          const edge =
            piece.row === 0 ||
            piece.col === 0 ||
            piece.row === state.rows - 1 ||
            piece.col === state.cols - 1
          if (!edge) alpha *= 0.22
        }

        drawPiece(id, px, py, alpha, lifted)
      }
    }

    if (intro !== null) {
      // the uncut picture lying over the pieces, lifting to reveal the cut
      const cover = 1 - Math.max(0, Math.min(1, (intro - 0.1) / 0.2))
      if (cover > 0) paintGhost(cover)
      paintSweep(intro)
    }
  }

  function dispose() {
    eases.clear()
  }

  return scene
}
