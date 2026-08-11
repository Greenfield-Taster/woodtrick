import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { COLLECTIONS, PRODUCTS, inchesToCm, productBySlug, type VariantKey } from '../data/catalog'
import { ProductSpin } from '../three/product/ProductSpin'
import { ProductCard } from '../components/ui/ProductCard'
import { ProductPhoto } from '../components/ui/ProductPhoto'
import { formatPrice, useCart } from '../store/cart'

export function ProductPage() {
  const { slug } = useParams()
  const product = slug ? productBySlug(slug) : undefined

  const [variantKey, setVariantKey] = useState<VariantKey | null>(null)
  const currency = useCart((s) => s.currency)
  const add = useCart((s) => s.add)

  // a new design has its own ladder, so the chosen variant cannot carry over
  useEffect(() => setVariantKey(null), [product?.id])

  if (!product) {
    return (
      <div className="container-page pt-40 pb-32">
        <h1 className="text-4xl">That design is not in the catalogue.</h1>
        <Link
          to="/shop"
          className="mt-6 inline-block text-ember underline-offset-8 hover:underline"
        >
          Back to all puzzles
        </Link>
      </div>
    )
  }

  // a size ladder opens on the second rung; a set of parts opens on the part that starts it
  const inParts = product.variants.some((v) => v.boards !== undefined)
  const fallback = !inParts && product.variants.length > 2 ? 1 : 0
  const variant = product.variants.find((v) => v.key === variantKey) ?? product.variants[fallback]
  const collection = COLLECTIONS.find((c) => c.id === product.collection)
  const related = PRODUCTS.filter(
    (p) => p.collection === product.collection && p.id !== product.id,
  ).slice(0, 3)

  const onSale = variant.wasUsd !== undefined && variant.wasUsd > variant.priceUsd

  return (
    <>
      <div className="container-page pt-28 pb-20 md:pt-36">
        <nav className="mb-8 flex items-center gap-2 text-sm text-paper/40">
          <Link to="/shop" className="transition-colors hover:text-paper">
            Shop
          </Link>
          <span aria-hidden>/</span>
          <Link
            to={`/shop?collection=${product.collection}`}
            className="transition-colors hover:text-paper"
          >
            {collection?.name}
          </Link>
        </nav>

        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          <div className="min-w-0 md:col-span-7">
            <div className="relative aspect-square overflow-hidden rounded-sm bg-gradient-to-b from-ink-soft to-ink">
              <ProductSpin src={product.photo} alt={product.name} />
            </div>
            <p className="mt-4 text-center text-xs text-paper/35">
              Drag to turn it — the reverse is bare board
            </p>
          </div>

          <div className="md:col-span-4 md:col-start-9">
            <p className="eyebrow">{collection?.name}</p>
            <h1 className="mt-4 text-5xl md:text-6xl">{product.name}</h1>
            <p className="mt-4 text-lg leading-snug text-paper/70">{product.tagline}</p>
            <p className="mt-5 text-[15px] leading-relaxed text-paper/50">{product.story}</p>

            <div className="mt-10">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="eyebrow">{product.variants.length > 1 ? 'Choose' : 'Sold as'}</h2>
                {variant.inches && (
                  <span className="text-xs text-paper/40">
                    {variant.inches[0]}×{variant.inches[1]} in · {inchesToCm(variant.inches[0])}×
                    {inchesToCm(variant.inches[1])} cm
                    {variant.boards && variant.boards > 1 ? ' per board' : ''}
                  </span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {product.variants.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setVariantKey(option.key)}
                    aria-pressed={option.key === variant.key}
                    disabled={option.soldOut}
                    className={[
                      'rounded-sm border px-4 py-3 text-left transition-colors',
                      option.soldOut
                        ? 'cursor-not-allowed border-ink-line opacity-35'
                        : option.key === variant.key
                          ? 'border-ember bg-ember/10'
                          : 'border-ink-line hover:border-paper/30',
                    ].join(' ')}
                  >
                    {option.photo && (
                      <ProductPhoto
                        src={option.photo}
                        alt={`${option.label} — what comes in the box`}
                        sizes="160px"
                        className="mb-2 h-20 w-full object-contain"
                      />
                    )}
                    <span className="block text-sm">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-paper/45">
                      {option.soldOut
                        ? 'Sold out'
                        : [
                            option.pieces ? `${option.pieces} pieces` : null,
                            option.boards
                              ? option.boards === 1
                                ? '1 board'
                                : `${option.boards} boards`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'Part of the set'}
                    </span>
                    <span className="mt-1.5 block text-sm text-ember">
                      {formatPrice(option.priceUsd, currency)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => add(product.id, variant.key)}
              disabled={variant.soldOut}
              className="mt-8 w-full rounded-full bg-ember py-4 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-30"
            >
              {variant.soldOut
                ? 'Sold out'
                : `Add to cart — ${formatPrice(variant.priceUsd, currency)}`}
            </button>
            {onSale && !variant.soldOut && (
              <p className="mt-3 text-center text-xs text-paper/35">
                Usually {formatPrice(variant.wasUsd!, currency)}
              </p>
            )}

            <dl className="mt-8 divide-y divide-ink-line border-t border-ink-line text-sm">
              {[
                ['Material', 'Laser-cut HDF'],
                ['Printed', 'One side — the reverse is bare board'],
                ['Packaging', 'Designer box, ready to gift'],
                ['Delivery', 'Free above $49 / €45'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 py-3.5">
                  <dt className="text-paper/45">{label}</dt>
                  <dd className="text-right text-paper/80">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-ink-line py-20">
          <div className="container-page">
            <h2 className="text-3xl md:text-4xl">More from {collection?.name}</h2>
            <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-3">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
