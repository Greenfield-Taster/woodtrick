import { Link } from 'react-router-dom'
import type { Product } from '../../data/catalog'
import { priceFrom } from '../../data/catalog'
import { formatPrice, useCart } from '../../store/cart'
import { ProductPhoto } from './ProductPhoto'

interface ProductCardProps {
  product: Product
  tall?: boolean
  /*
   * Laid on the card's root, so a parent can say how the card sits in it —
   * the catalogue makes each one a subgrid to line the rows up across a row
   * of cards. Left off, the card is an ordinary block and lays itself out.
   */
  className?: string
}

export function ProductCard({ product, tall = false, className }: ProductCardProps) {
  const currency = useCart((s) => s.currency)

  const cheapest = product.variants.reduce((low, v) => (v.priceUsd < low.priceUsd ? v : low))
  const onSale = cheapest.wasUsd !== undefined && cheapest.wasUsd > cheapest.priceUsd

  return (
    <Link
      to={`/puzzle/${product.slug}`}
      className={['group focus-visible:outline-none', className ?? 'block'].join(' ')}
      aria-label={`${product.name} — ${product.tagline}`}
    >
      <div
        className={[
          'relative overflow-hidden rounded-sm bg-ink-soft',
          tall ? 'aspect-[3/4]' : 'aspect-[4/5]',
        ].join(' ')}
      >
        {/* contain, not cover — the photographs are cut-outs and cropping lops off a wing or an ear */}
        <div className="h-full w-full p-6 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:scale-[1.06]">
          <ProductPhoto
            src={product.photo}
            className="h-full w-full object-contain"
            sizes="(min-width: 1280px) 24rem, (min-width: 640px) 40vw, 90vw"
          />
        </div>

        {onSale && (
          <span className="absolute left-4 top-4 rounded-full bg-ember px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink">
            Sale
          </span>
        )}

        <span className="pointer-events-none absolute bottom-4 right-4 translate-y-3 rounded-full bg-paper px-4 py-2 text-xs font-medium text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          View piece
        </span>
      </div>

      {/*
        Two lines are held for the name whether or not it needs them, so a
        wrapping title cannot push its own tagline below the ones beside it.
      */}
      <div className="mt-4 flex min-h-10 items-baseline justify-between gap-4">
        <h3 className="font-display text-xl leading-none">{product.name}</h3>
        <span className="shrink-0 text-sm text-ember">
          {onSale && (
            <span className="mr-1.5 text-paper/35 line-through">
              {formatPrice(cheapest.wasUsd!, currency)}
            </span>
          )}
          from {formatPrice(priceFrom(product), currency)}
        </span>
      </div>
      <p className="mt-1.5 max-w-[36ch] text-sm leading-snug text-paper/50">{product.tagline}</p>
    </Link>
  )
}
