import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { productBySlug } from '../data/catalog'
import { Board } from '../components/game/Board'
import { WinScreen } from '../components/game/WinScreen'
import { newSeed, puzzlePath, readLink, shareUrl } from '../game/link'
import { formatClock, recordTime } from '../game/reward'
import { isMuted, setMuted } from '../game/sound'
import type { Session } from '../game/session'

export function PlayBoard() {
  const { slug = '' } = useParams()
  const { search, hash } = useLocation()
  const navigate = useNavigate()

  const link = useMemo(() => readLink(search, hash), [search, hash])
  const product = productBySlug(slug)

  const sessionRef = useRef<Session | null>(null)
  const [progress, setProgress] = useState({ made: 0, needed: 1 })
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [won, setWon] = useState<{ elapsed: number; previousBest: number | null } | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [ghost, setGhost] = useState(false)
  const [edgesOnly, setEdgesOnly] = useState(false)
  const [muted, setMutedState] = useState(isMuted)
  const [copied, setCopied] = useState(false)

  /* A link without a seed is still a request for a puzzle — pick one and say so. */
  useEffect(() => {
    if (!new URLSearchParams(search).get('s') && product) {
      navigate(puzzlePath(slug, link.pieces, link.seed, link.room), { replace: true })
    }
  }, [search, slug, link, product, navigate])

  useEffect(() => {
    if (!running || won) return
    const timer = window.setInterval(() => {
      setElapsed(sessionRef.current?.elapsed() ?? 0)
    }, 500)
    return () => window.clearInterval(timer)
  }, [running, won])

  const onSession = useCallback((session: Session | null) => {
    sessionRef.current = session
    if (!session) setRunning(false)
  }, [])

  const onProgress = useCallback((made: number, needed: number) => {
    setProgress({ made, needed })
  }, [])

  const onIntroDone = useCallback(() => setRunning(true), [])

  const onSolved = useCallback(
    (ms: number) => {
      setElapsed(ms)
      setWon({ elapsed: ms, previousBest: recordTime(slug, link.pieces, ms) })
    },
    [slug, link.pieces],
  )

  useEffect(() => sessionRef.current?.setGhost(ghost), [ghost])
  useEffect(() => sessionRef.current?.setEdgesOnly(edgesOnly), [edgesOnly])

  if (!product || !product.photo) return <Navigate to="/play" replace />

  const share = async () => {
    const url = shareUrl(slug, link.pieces, link.seed, link.room)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      window.prompt('Copy the link', url)
    }
  }

  const again = () => {
    setWon(null)
    setDismissed(false)
    setElapsed(0)
    navigate(puzzlePath(slug, link.pieces, newSeed(), link.room))
  }

  const percent = Math.round((progress.made / Math.max(1, progress.needed)) * 100)

  const control =
    'pointer-events-auto rounded-full border px-3.5 py-2 text-xs transition-colors backdrop-blur-md'
  const off = 'border-ink-line/80 bg-ink/60 text-paper/60 hover:text-paper'
  const on = 'border-paper bg-paper text-ink'

  return (
    <section className="relative mt-16 h-[calc(100dvh-4rem)] overflow-hidden bg-ink md:mt-20 md:h-[calc(100dvh-5rem)]">
      <Board
        key={`${slug}-${link.pieces}-${link.seed}`}
        slug={slug}
        imageSrc={product.photo}
        pieces={link.pieces}
        seed={link.seed}
        onSession={onSession}
        onProgress={onProgress}
        onSolved={onSolved}
        onIntroDone={onIntroDone}
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="pointer-events-auto rounded-sm border border-ink-line/80 bg-ink/60 px-4 py-3 backdrop-blur-md">
            <div className="flex items-baseline gap-3">
              <h1 className="font-display text-lg leading-none md:text-xl">{product.name}</h1>
              <span className="text-xs text-paper/40">{link.pieces} pieces</span>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="h-px w-28 bg-ink-line md:w-40">
                <div
                  className="h-px bg-ember transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-paper/45">{percent}%</span>
              <span className="text-xs tabular-nums text-paper/45">{formatClock(elapsed)}</span>
            </div>
          </div>

          <Link
            to="/play"
            className="pointer-events-auto rounded-full border border-ink-line/80 bg-ink/60 px-3.5 py-2 text-xs text-paper/60 backdrop-blur-md transition-colors hover:text-paper"
          >
            ← All pictures
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setGhost((v) => !v)}
            aria-pressed={ghost}
            className={[control, ghost ? on : off].join(' ')}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setEdgesOnly((v) => !v)}
            aria-pressed={edgesOnly}
            className={[control, edgesOnly ? on : off].join(' ')}
          >
            Edges first
          </button>
          <button
            type="button"
            onClick={() => sessionRef.current?.shuffleTray()}
            className={[control, off].join(' ')}
          >
            Reshuffle
          </button>
          <button
            type="button"
            onClick={() => sessionRef.current?.fit()}
            className={[control, off].join(' ')}
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !muted
              setMuted(next)
              setMutedState(next)
            }}
            aria-pressed={muted}
            className={[control, off].join(' ')}
          >
            {muted ? 'Sound off' : 'Sound on'}
          </button>
          <button type="button" onClick={share} className={[control, off].join(' ')}>
            {copied ? 'Link copied' : 'Share this cut'}
          </button>
        </div>
      </div>

      {won && !dismissed && (
        <WinScreen
          product={product}
          pieces={link.pieces}
          elapsed={won.elapsed}
          previousBest={won.previousBest}
          onAgain={again}
          onDismiss={() => setDismissed(true)}
        />
      )}
    </section>
  )
}
