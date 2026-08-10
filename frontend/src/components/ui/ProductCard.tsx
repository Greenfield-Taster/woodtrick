import { Link } from 'react-router-dom'
import type { Product } from '../../data/catalog'
import { priceFrom } from '../../data/catalog'
import { formatPrice, useCart } from '../../store/cart'
import { ArtworkImage } from './ArtworkImage'

interface ProductCardProps {
  product: Product
  /** Cards deliberately vary in height to break the grid rhythm. */
  tall?: boolean
}

export function ProductCard({ product, tall = false }: ProductCardProps) {
  const currency = useCart((s) => s.currency)

  return (
    <Link
      to={`/puzzle/${product.slug}`}
      className="group block focus-visible:outline-none"
      aria-label={`${product.name} — ${product.tagline}`}
    >
      <div
        className={[
          'relative overflow-hidden rounded-sm bg-ink-soft',
          tall ? 'aspect-[3/4]' : 'aspect-[4/5]',
        ].join(' ')}
      >
        {/* The zoom lives on a wrapper, never on the canvas itself: scaling a
            canvas element forces the compositor to re-rasterise its bitmap on
            every frame of the transition. */}
        <div className="h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:scale-[1.06]">
          <ArtworkImage
            artwork={product.artwork}
            ratio={tall ? 3 / 4 : 4 / 5}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-40" />

        {product.isNew && (
          <span className="absolute left-4 top-4 rounded-full bg-paper/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-ink">
            New
          </span>
        )}

        <span className="pointer-events-none absolute bottom-4 right-4 translate-y-3 rounded-full bg-paper px-4 py-2 text-xs font-medium text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          View piece
        </span>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="font-display text-xl leading-none">{product.name}</h3>
        <span className="shrink-0 text-sm text-ember">
          from {formatPrice(priceFrom(product), currency)}
        </span>
      </div>
      <p className="mt-1.5 max-w-[36ch] text-sm leading-snug text-paper/50">{product.tagline}</p>
    </Link>
  )
}
