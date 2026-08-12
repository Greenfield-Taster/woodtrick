import { Link } from 'react-router-dom'
import type { Product } from '../../data/catalog'
import { formatClock, rewardFor } from '../../game/reward'
import { formatPrice, useCart } from '../../store/cart'
import { ProductPhoto } from '../ui/ProductPhoto'

interface WinScreenProps {
  product: Product
  pieces: number
  elapsed: number
  /* The time to beat before this game, or null if this was the first. */
  previousBest: number | null
  onAgain(): void
  onDismiss(): void
}

/*
 * The wooden version of what was just built, at whichever tier is nearest the
 * count that was played — somebody who enjoyed 300 pieces on screen is not being
 * sold the 24-piece box.
 */
function nearestVariant(product: Product, pieces: number) {
  const stocked = product.variants.filter((variant) => !variant.soldOut)
  // seeding the search with variants[0] would let a sold-out tier win it
  return stocked.reduce(
    (best, variant) =>
      Math.abs((variant.pieces ?? 0) - pieces) < Math.abs((best.pieces ?? 0) - pieces)
        ? variant
        : best,
    stocked[0] ?? product.variants[0],
  )
}

export function WinScreen({
  product,
  pieces,
  elapsed,
  previousBest,
  onAgain,
  onDismiss,
}: WinScreenProps) {
  const currency = useCart((s) => s.currency)
  const add = useCart((s) => s.add)
  const applyCoupon = useCart((s) => s.applyCoupon)

  const reward = rewardFor(product.slug, pieces)
  const variant = nearestVariant(product, pieces)
  const beat = previousBest !== null && elapsed < previousBest

  const claim = () => {
    applyCoupon(reward)
    add(product.id, variant.key, 1)
  }

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-ink/80 p-5 backdrop-blur-md">
      <div
        className="w-full max-w-lg rounded-sm border border-ink-line bg-ink-soft p-7 md:p-9"
        style={{ animation: 'win-rise 600ms cubic-bezier(0.16, 1, 0.3, 1) both' }}
      >
        <p className="eyebrow">
          {beat ? 'A new best' : previousBest === null ? 'First time' : 'Finished'}
        </p>
        <h2 className="mt-4 font-display text-4xl leading-[0.95] md:text-5xl">
          {product.name},
          <br />
          in {formatClock(elapsed)}.
        </h2>

        <dl className="mt-7 grid grid-cols-3 gap-4 border-y border-ink-line py-5 text-center">
          {[
            ['Pieces', String(pieces)],
            ['Your time', formatClock(elapsed)],
            ['Best', previousBest === null ? '—' : formatClock(Math.min(elapsed, previousBest))],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] tracking-wide text-paper/40 uppercase">{label}</dt>
              <dd className="mt-1.5 font-display text-2xl">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 flex items-center gap-4 rounded-sm border border-ember/40 bg-ember/10 p-4">
          <div className="h-16 w-16 shrink-0">
            <ProductPhoto src={product.photo} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-paper">
              {reward.percent}% off the wooden one — code{' '}
              <span className="text-ember">{reward.code}</span>
            </p>
            <p className="mt-1 text-xs text-paper/45">
              {variant.label} · {variant.pieces} pieces ·{' '}
              {formatPrice((variant.priceUsd * (100 - reward.percent)) / 100, currency)}{' '}
              <span className="line-through decoration-1">
                {formatPrice(variant.priceUsd, currency)}
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={claim}
          className="mt-6 w-full rounded-full bg-ember py-4 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5"
        >
          Add it to the cart with the discount
        </button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onAgain}
            className="text-paper/55 transition-colors hover:text-paper"
          >
            Cut it again
          </button>
          <Link to="/play" className="text-paper/55 transition-colors hover:text-paper">
            Another picture
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="text-paper/40 transition-colors hover:text-paper"
          >
            Just look at it
          </button>
        </div>
      </div>
    </div>
  )
}
