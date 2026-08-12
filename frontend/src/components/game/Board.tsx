import { useEffect, useRef, useState } from 'react'
import { createSession, type Session } from '../../game/session'
import { clearGame, loadGame, saveKey, storeGame } from '../../game/save'

interface BoardProps {
  slug: string
  imageSrc: string
  pieces: number
  seed: number
  onSession(session: Session | null): void
  onProgress(made: number, needed: number): void
  onSolved(elapsed: number): void
  onIntroDone(): void
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
  onSession,
  onProgress,
  onSolved,
  onIntroDone,
}: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = useState<'cutting' | 'ready' | 'failed'>('cutting')

  // the callbacks change identity on every parent render; the session is built
  // once and reads them through here so it never has to be rebuilt
  const handlers = useRef({ onSession, onProgress, onSolved, onIntroDone })
  handlers.current = { onSession, onProgress, onSolved, onIntroDone }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let session: Session | null = null
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
        if (session) {
          clearGame(key)
          handlers.current.onSolved(session.elapsed())
        }
      },
    })
      .then((created) => {
        if (cancelled) {
          created.destroy()
          return
        }
        session = created
        setStatus('ready')
        handlers.current.onSession(created)

        // a handle for driving the board from a test or the console; the
        // pointer path is the only way in for a real player
        if (import.meta.env.DEV) {
          ;(window as unknown as { __jigsaw?: Session }).__jigsaw = created
        }

        saveTimer = window.setInterval(() => {
          if (session) storeGame({ key, elapsed: session.elapsed(), snapshot: session.snapshot() })
        }, AUTOSAVE_MS)
      })
      .catch(() => {
        if (!cancelled) setStatus('failed')
      })

    return () => {
      cancelled = true
      window.clearInterval(saveTimer)
      if (session) {
        storeGame({ key, elapsed: session.elapsed(), snapshot: session.snapshot() })
        session.destroy()
      }
      handlers.current.onSession(null)
    }
  }, [slug, imageSrc, pieces, seed])

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none select-none"
        style={{ cursor: status === 'ready' ? 'grab' : 'progress' }}
      />

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
