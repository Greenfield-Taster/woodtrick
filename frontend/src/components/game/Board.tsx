import { useEffect, useRef, useState } from 'react'
import { createSession, type Session } from '../../game/session'
import { clearGame, loadGame, saveKey, storeGame } from '../../game/save'
import type { NetRoom, PeerCursor } from '../../game/net'
import { PeerCursors } from './PeerCursors'

interface BoardProps {
  slug: string
  imageSrc: string
  pieces: number
  seed: number
  /* Set to play the same board as whoever else opens this room. */
  room: string | null
  onSession(session: Session | null): void
  onProgress(made: number, needed: number): void
  onSolved(elapsed: number): void
  onIntroDone(): void
  onPeerCount(count: number): void
}

const AUTOSAVE_MS = 4000

/*
 * A canvas and the session that drives it. Everything below this component is
 * imperative on purpose — React is told when the score changes and nothing else,
 * because a component that re-rendered per frame would be the one thing capable
 * of making a 300-piece board stutter.
 */
export function Board({
  slug,
  imageSrc,
  pieces,
  seed,
  room,
  onSession,
  onProgress,
  onSolved,
  onIntroDone,
  onPeerCount,
}: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'cutting' | 'ready' | 'failed'>('cutting')
  const [session, setSession] = useState<Session | null>(null)
  const netRef = useRef<NetRoom | null>(null)

  // the callbacks change identity on every parent render; the session is built
  // once and reads them through here so it never has to be rebuilt
  const handlers = useRef({ onSession, onProgress, onSolved, onIntroDone, onPeerCount })
  handlers.current = { onSession, onProgress, onSolved, onIntroDone, onPeerCount }

  const readCursors = useRef(() => netRef.current?.cursors() ?? ([] as PeerCursor[])).current

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let live: Session | null = null
    let net: NetRoom | null = null
    let saveTimer = 0
    let cancelled = false
    setStatus('cutting')

    const key = saveKey(slug, pieces, seed)
    const saved = loadGame(key)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    createSession({
      canvas,
      imageSrc,
      pieces,
      seed,
      resume: saved?.snapshot ?? null,
      resumeElapsed: saved?.elapsed ?? 0,
      reducedMotion,
      onProgress: (made, needed) => handlers.current.onProgress(made, needed),
      onIntroDone: () => handlers.current.onIntroDone(),
      onSolved: () => {
        if (live) {
          clearGame(key)
          handlers.current.onSolved(live.elapsed())
        }
      },
      onAction: (outgoing) => net?.send(outgoing),
      onPointer: (x, y) => net?.sendCursor(x, y),
    })
      .then(async (created) => {
        if (cancelled) {
          created.destroy()
          return
        }
        live = created
        setStatus('ready')
        setSession(created)
        handlers.current.onSession(created)

        // a handle for driving the board from a test or the console; the
        // pointer path is the only way in for a real player
        if (import.meta.env.DEV) {
          ;(window as unknown as { __jigsaw?: Session }).__jigsaw = created
        }

        saveTimer = window.setInterval(() => {
          if (live) storeGame({ key, elapsed: live.elapsed(), snapshot: live.snapshot() })
        }, AUTOSAVE_MS)

        if (!room) return

        // the relays are only reached for when somebody actually asked to play
        // together, so a solo game never opens a socket
        const { joinPuzzleRoom } = await import('../../game/net')
        if (cancelled) return

        net = joinPuzzleRoom({
          roomId: `${slug}-${pieces}-${seed}-${room}`,
          onAction: (incoming) => live?.applyRemote(incoming),
          onClaims: (held) => live?.setClaimed(held),
          onPeerCount: (count) => handlers.current.onPeerCount(count),
          snapshot: () => created.snapshot(),
        })
        netRef.current = net
      })
      .catch(() => {
        if (!cancelled) setStatus('failed')
      })

    return () => {
      cancelled = true
      window.clearInterval(saveTimer)
      net?.leave()
      net = null
      netRef.current = null
      if (live) {
        storeGame({ key, elapsed: live.elapsed(), snapshot: live.snapshot() })
        live.destroy()
      }
      setSession(null)
      handlers.current.onSession(null)
      handlers.current.onPeerCount(0)
    }
  }, [slug, imageSrc, pieces, seed, room])

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none select-none"
        style={{ cursor: status === 'ready' ? 'grab' : 'progress' }}
      />

      {room && <PeerCursors session={session} cursors={readCursors} />}

      {status !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-ink/70">
          <p className="text-sm text-paper/55">
            {status === 'cutting' ? 'Cutting the board…' : 'That picture would not load.'}
          </p>
        </div>
      )}
    </div>
  )
}
