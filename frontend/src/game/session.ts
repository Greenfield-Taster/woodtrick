/*
 * Everything the board needs to be a game, assembled in one place and holding no
 * React. It loads the picture, cuts it, bakes it, wires the pointer to the rules
 * and runs the frame loop. The component above it mounts this and gets out of
 * the way, which is what keeps 300 pieces at sixty frames — nothing here causes
 * a render.
 */

import { bakePieces, boardImage, type Baked } from './bake'
import { cutPuzzle, gridFor } from './cut'
import { createScene, type Scene } from './render'
import { playFinish, playPick, playSnap, primeAudio } from './sound'
import {
  createGame,
  dragBy,
  isSolved,
  joined,
  joinsNeeded,
  raise,
  release,
  restore,
  scatter,
  shuffleOrder,
  snapshot,
  type GameSnapshot,
  type GameState,
} from './state'
import { mulberry32 } from '../art/artwork'

const INTRO_MS = 1250

/*
 * What one player tells the others. Everything is addressed by piece id rather
 * than by group id: groups are created by merging and their ids depend on the
 * order merges happened in, which two browsers need not agree on, while a piece
 * id is fixed by the cut.
 */
export type Action =
  | { t: 'claim'; piece: number }
  | { t: 'move'; piece: number; x: number; y: number }
  | { t: 'drop'; piece: number }
  | { t: 'sync'; snap: GameSnapshot }

export interface SessionEvents {
  /* Joins made, and the number a finished picture needs. */
  onProgress(made: number, needed: number): void
  onSolved(): void
  onIntroDone(): void
  onAction?(action: Action): void
  /* Where this player's pointer is on the board, for showing it to the others. */
  onPointer?(x: number, y: number): void
}

export interface Session {
  state: GameState
  scene: Scene
  rows: number
  cols: number
  elapsed(): number
  snapshot(): GameSnapshot
  setGhost(on: boolean): void
  setEdgesOnly(on: boolean): void
  shuffleTray(): void
  fit(): void
  skipIntro(): void
  applyRemote(action: Action): void
  setClaimed(pieces: number[]): void
  destroy(): void
}

export interface SessionOptions extends SessionEvents {
  canvas: HTMLCanvasElement
  imageSrc: string
  pieces: number
  seed: number
  resume?: GameSnapshot | null
  resumeElapsed?: number
  reducedMotion?: boolean
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`could not load ${src}`))
    image.src = src
  })
}

export async function createSession(options: SessionOptions): Promise<Session> {
  const { canvas, imageSrc, pieces: pieceCount, seed } = options

  const image = await loadImage(imageSrc)

  // trimmed to the subject and laid on board tone, so the aspect the grid is
  // built from is the picture's own rather than the file's padded frame
  const picture = boardImage(image, 1500)
  const aspect = picture.width / Math.max(1, picture.height)

  const { rows, cols } = options.resume
    ? { rows: options.resume.rows, cols: options.resume.cols }
    : gridFor(pieceCount, aspect)

  const cut = cutPuzzle(rows, cols, seed)
  const baked: Baked = bakePieces(cut, picture, picture.width, picture.height, rows, cols)

  const state = (options.resume && restore(options.resume)) || createGame(rows, cols, seed)
  if (!options.resume) scatter(state, mulberry32(seed ^ 0x5f3a))

  const scene = createScene(canvas, state, baked.pieces, picture)
  scene.resize()
  scene.fit()
  let fitScale = scene.camera.scale

  /*
   * Whether the player has taken the camera into their own hands. Until they
   * have, the view re-fits itself whenever the canvas changes size — which
   * covers the first layout as much as it covers a window being dragged, and
   * saves guessing when the element has settled at its real height.
   */
  let framedByPlayer = false

  let running = true
  let frame = 0
  let introStart = 0
  let started = 0
  const resumeElapsed = options.resumeElapsed ?? 0
  let finished = 0

  const skipIntro = Boolean(options.reducedMotion) || Boolean(options.resume)
  scene.intro = skipIntro ? null : 0

  /* Which pieces other players are holding, mapped to their groups each frame. */
  let claimedPieces: number[] = []

  function refreshClaims() {
    scene.claimed.clear()
    for (const piece of claimedPieces) {
      const owner = state.pieces[piece]
      if (owner) scene.claimed.add(owner.group)
    }
  }

  function report() {
    options.onProgress(joined(state), joinsNeeded(state))
  }

  function finish() {
    if (finished) return
    finished = performance.now()
    playFinish()
    options.onSolved()
  }

  // ---------------------------------------------------------------- pointers

  interface Held {
    pointerId: number
    /* Board position of the pointer at the last move. */
    x: number
    y: number
    /* The same point on the page. Pinching has to be measured here: board
     * distances shrink as the camera zooms in, so a pinch judged in board units
     * fights its own result. */
    cx: number
    cy: number
    /* The piece grabbed, or null while panning the table. */
    piece: number | null
  }

  const active = new Map<number, Held>()
  let pinch: { distance: number; scale: number; midX: number; midY: number } | null = null

  function boardPoint(event: PointerEvent) {
    return scene.toBoard(event.clientX, event.clientY)
  }

  function spanOfTouches() {
    const [a, b] = [...active.values()]
    return {
      distance: Math.hypot(a.cx - b.cx, a.cy - b.cy),
      midX: (a.cx + b.cx) / 2,
      midY: (a.cy + b.cy) / 2,
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (scene.intro !== null) {
      endIntro()
      return
    }

    primeAudio()
    try {
      canvas.setPointerCapture(event.pointerId)
    } catch {
      /* a pointer that has already been released; the drag still works without it */
    }

    const point = boardPoint(event)
    const hit = event.button === 0 ? scene.pieceAt(event.clientX, event.clientY) : null

    if (hit !== null) {
      const group = state.pieces[hit].group
      raise(state, group)
      scene.lift = group
      playPick()
      options.onAction?.({ t: 'claim', piece: hit })
    }

    active.set(event.pointerId, {
      pointerId: event.pointerId,
      x: point.x,
      y: point.y,
      cx: event.clientX,
      cy: event.clientY,
      piece: hit,
    })

    // two fingers move the table, but only when neither of them is already
    // holding a piece — otherwise a two-handed drag would zoom as a side effect
    if (active.size === 2 && [...active.values()].every((held) => held.piece === null)) {
      pinch = { ...spanOfTouches(), scale: scene.camera.scale }
    }
  }

  function onPointerMove(event: PointerEvent) {
    const point = boardPoint(event)
    options.onPointer?.(point.x, point.y)

    const held = active.get(event.pointerId)
    if (!held) return

    held.cx = event.clientX
    held.cy = event.clientY

    if (pinch && active.size === 2) {
      framedByPlayer = true
      const span = spanOfTouches()

      // the midpoint carries the table along with it, and the spread sets the
      // zoom about that same midpoint, so both fingers keep the board they
      // started on
      scene.panBy(span.midX - pinch.midX, span.midY - pinch.midY)
      pinch.midX = span.midX
      pinch.midY = span.midY

      if (span.distance > 8 && pinch.distance > 8) {
        const before = scene.toBoard(span.midX, span.midY)
        scene.camera.scale = Math.max(
          5,
          Math.min(320, pinch.scale * (span.distance / pinch.distance)),
        )
        const after = scene.toBoard(span.midX, span.midY)
        scene.camera.x += before.x - after.x
        scene.camera.y += before.y - after.y
      }

      held.x = point.x
      held.y = point.y
      return
    }

    const dx = point.x - held.x
    const dy = point.y - held.y

    if (held.piece !== null) {
      const group = state.pieces[held.piece].group
      dragBy(state, group, dx, dy)
      const anchor = state.pieces[held.piece]
      options.onAction?.({ t: 'move', piece: held.piece, x: anchor.x, y: anchor.y })
    } else if (active.size === 1) {
      framedByPlayer = true
      scene.panBy(dx * scene.camera.scale, dy * scene.camera.scale)
      return // the camera moved, so the pointer's board position is unchanged
    }

    held.x = point.x
    held.y = point.y
  }

  function onPointerUp(event: PointerEvent) {
    const held = active.get(event.pointerId)
    active.delete(event.pointerId)
    if (active.size < 2) pinch = null
    if (!held) return

    try {
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
    } catch {
      /* as above — capture is a convenience, not a requirement */
    }

    if (held.piece === null) return

    const group = state.pieces[held.piece].group
    scene.lift = null

    const snaps = release(state, group)
    if (snaps.length > 0) {
      scene.animateSnaps(snaps)
      playSnap(state.groups.get(state.pieces[held.piece].group)?.length ?? 1)
    }

    options.onAction?.({ t: 'drop', piece: held.piece })
    report()
    if (isSolved(state)) finish()
  }

  function onWheel(event: WheelEvent) {
    if (scene.intro !== null) return
    event.preventDefault()
    framedByPlayer = true
    scene.zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.12 : 1 / 1.12)
  }

  // ----------------------------------------------------------------- remote

  function applyRemote(action: Action) {
    if (action.t === 'claim') {
      if (!claimedPieces.includes(action.piece)) claimedPieces = [...claimedPieces, action.piece]
      refreshClaims()
      return
    }

    if (action.t === 'move') {
      const piece = state.pieces[action.piece]
      if (!piece) return
      dragBy(state, piece.group, action.x - piece.x, action.y - piece.y)
      raise(state, piece.group)
      refreshClaims()
      return
    }

    if (action.t === 'drop') {
      const piece = state.pieces[action.piece]
      if (!piece) return
      const snaps = release(state, piece.group)
      if (snaps.length > 0) {
        scene.animateSnaps(snaps)
        playSnap(state.groups.get(state.pieces[action.piece].group)?.length ?? 1)
      }
      claimedPieces = claimedPieces.filter((id) => id !== action.piece)
      refreshClaims()
      report()
      if (isSolved(state)) finish()
      return
    }

    // a full state, sent to somebody who has just joined
    const fresh = restore(action.snap)
    if (!fresh) return
    for (const piece of fresh.pieces) {
      const mine = state.pieces[piece.id]
      mine.x = piece.x
      mine.y = piece.y
      mine.group = piece.group
    }
    state.groups = fresh.groups
    state.order = fresh.order
    state.moves = fresh.moves
    refreshClaims()
    report()
    if (isSolved(state)) finish()
  }

  // ------------------------------------------------------------------- loop

  function endIntro() {
    if (scene.intro === null) return
    scene.intro = null
    scene.camera.scale = fitScale
    started = performance.now()
    options.onIntroDone()
  }

  function tick(now: number) {
    if (!running) return
    frame = requestAnimationFrame(tick)

    if (scene.intro !== null) {
      if (!introStart) introStart = now
      const p = Math.min(1, (now - introStart) / INTRO_MS)
      scene.intro = p
      // the picture starts held close and settles back to the fitted view
      scene.camera.scale = fitScale * (1 + 1.15 * (1 - p) ** 3)
      if (p >= 1) endIntro()
    }

    scene.draw(now)
  }

  const onResize = () => {
    const before = scene.camera.scale
    scene.resize()
    scene.fit()
    fitScale = scene.camera.scale
    if (framedByPlayer) scene.camera.scale = before
  }

  const observer = new ResizeObserver(onResize)
  observer.observe(canvas)

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })

  if (skipIntro) {
    started = performance.now()
    options.onIntroDone()
  }

  frame = requestAnimationFrame(tick)
  report()

  return {
    state,
    scene,
    rows,
    cols,
    elapsed: () =>
      resumeElapsed + (started ? (finished || performance.now()) - started : 0),
    snapshot: () => snapshot(state),
    setGhost: (on) => {
      scene.ghost = on
    },
    setEdgesOnly: (on) => {
      scene.edgesOnly = on
    },
    shuffleTray: () => {
      const rand = mulberry32((Math.random() * 1e9) | 0)
      for (const [group, ids] of state.groups) {
        if (ids.length > 1) continue
        const piece = state.pieces[ids[0]]
        if (piece.group !== group) continue
        // only loose pieces are re-dealt; a built corner stays where it was put
        const side = Math.floor(rand() * 4)
        if (side === 0) piece.x = -0.7 - rand() * cols * 0.4
        else if (side === 1) piece.x = cols + 0.7 + rand() * cols * 0.4
        else piece.x = rand() * cols
        if (side === 2) piece.y = -0.7 - rand() * rows * 0.4
        else if (side === 3) piece.y = rows + 0.7 + rand() * rows * 0.4
        else piece.y = rand() * rows
      }
      shuffleOrder(state, rand)
    },
    fit: () => {
      framedByPlayer = false
      scene.fit()
      fitScale = scene.camera.scale
    },
    skipIntro: endIntro,
    applyRemote,
    setClaimed: (list) => {
      claimedPieces = list
      refreshClaims()
    },
    destroy() {
      running = false
      cancelAnimationFrame(frame)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      observer.disconnect()
      scene.dispose()
      baked.dispose()
      picture.width = 0
      picture.height = 0
    },
  }
}
