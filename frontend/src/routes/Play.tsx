import { useState } from 'react'
import { Link } from 'react-router-dom'
import { COLLECTIONS, PRODUCTS } from '../data/catalog'
import { ProductPhoto } from '../components/ui/ProductPhoto'
import type { PieceCount } from '../game/cut'
import { bestTime, formatClock } from '../game/reward'
import { newSeed } from '../game/link'

const DIFFICULTY: Array<{ pieces: PieceCount; label: string; note: string }> = [
  { pieces: 24, label: 'A few minutes', note: '24 pieces' },
  { pieces: 54, label: 'A cup of tea', note: '54 pieces' },
  { pieces: 100, label: 'An evening', note: '100 pieces' },
  { pieces: 300, label: 'A proper sitting', note: '300 pieces' },
]

const PLAYABLE = PRODUCTS.filter((product) => product.photo)

export function Play() {
  const [pieces, setPieces] = useState<PieceCount>(54)

  return (
    <div className="container-page pt-28 pb-24 md:pt-36">
      <header className="max-w-3xl">
        <p className="eyebrow">Play</p>
        <h1 className="mt-5 text-5xl leading-[0.95] md:text-7xl">
          Build one on
          <br />
          the screen first.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-paper/55">
          Every design in the shop is cut here too, with the same wandering edges the laser makes.
          Finish one and the discount on the wooden version is yours.
        </p>
      </header>

      <div className="rule-line my-12" />

      <div className="flex flex-wrap items-baseline justify-between gap-6">
        <h2 className="eyebrow">How long have you got</h2>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTY.map((option) => (
            <button
              key={option.pieces}
              type="button"
              onClick={() => setPieces(option.pieces)}
              aria-pressed={pieces === option.pieces}
              className={[
                'rounded-full border px-4 py-2 text-xs transition-colors',
                pieces === option.pieces
                  ? 'border-paper bg-paper text-ink'
                  : 'border-ink-line text-paper/55 hover:text-paper',
              ].join(' ')}
            >
              {option.label}
              <span className={pieces === option.pieces ? 'text-ink/50' : 'text-paper/35'}>
                {' · '}
                {option.note}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {PLAYABLE.map((product) => {
          const best = bestTime(product.slug, pieces)
          const collection = COLLECTIONS.find((c) => c.id === product.collection)

          return (
            <Link
              key={product.id}
              to={`/play/${product.slug}?p=${pieces}&s=${newSeed()}`}
              className="group block"
            >
              <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-sm bg-gradient-to-b from-ink-soft to-ink p-6">
                <ProductPhoto
                  src={product.photo}
                  alt={product.name}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  className="max-h-full w-auto max-w-full object-contain transition-transform duration-700 group-hover:scale-[1.04]"
                />

                <span className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center bg-gradient-to-t from-ink to-transparent pt-10 pb-5 text-xs text-paper opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  Start cutting →
                </span>
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h3 className="font-display text-xl leading-tight">{product.name}</h3>
                <span className="shrink-0 text-xs text-paper/35">{collection?.name}</span>
              </div>
              <p className="mt-1 text-sm text-paper/45">
                {best !== null ? `Your best · ${formatClock(best)}` : product.tagline}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
