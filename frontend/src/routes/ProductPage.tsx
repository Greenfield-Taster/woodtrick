import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { COLLECTIONS, PRODUCTS, productBySlug, type SizeKey } from '../data/catalog'
import { artworkCanvas, reverseArtwork } from '../art/artwork'
import { PuzzleView } from '../three/product/PuzzleView'
import { ProductCard } from '../components/ui/ProductCard'
import { formatPrice, useCart } from '../store/cart'

export function ProductPage() {
  const { slug } = useParams()
  const product = slug ? productBySlug(slug) : undefined
  const [sizeKey, setSizeKey] = useState<SizeKey>('l')
  const [flipped, setFlipped] = useState(false)

  const currency = useCart((s) => s.currency)
  const add = useCart((s) => s.add)

  const back = useMemo(() => (product ? reverseArtwork(product.artwork) : null), [product])

  if (!product || !back) {
    return (
      <div className="container-page pt-40 pb-32">
        <h1 className="text-4xl">That design is not in the catalogue.</h1>
        <Link to="/shop" className="mt-6 inline-block text-ember underline-offset-8 hover:underline">
          Back to all puzzles
        </Link>
      </div>
    )
  }

  const size = product.sizes.find((s) => s.key === sizeKey) ?? product.sizes[2]
  const collection = COLLECTIONS.find((c) => c.id === product.collection)
  const related = PRODUCTS.filter(
    (p) => p.collection === product.collection && p.id !== product.id,
  ).slice(0, 3)

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
          <div className="md:col-span-7">
            <div className="relative aspect-square overflow-hidden rounded-sm bg-gradient-to-b from-ink-soft to-ink">
              <PuzzleView
                front={artworkCanvas(product.artwork, 1400)}
                back={artworkCanvas(back, 1400)}
                pieces={size.pieces}
                flipped={flipped}
              />

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-5">
                <span className="text-xs text-paper/35">Drag to turn</span>
                <button
                  type="button"
                  onClick={() => setFlipped((v) => !v)}
                  className="pointer-events-auto rounded-full border border-ink-line bg-ink/70 px-4 py-2 text-xs text-paper backdrop-blur transition-colors hover:border-ember"
                >
                  {flipped ? 'Show the front' : 'Show the hidden side'}
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 md:col-start-9">
            <p className="eyebrow">{collection?.name}</p>
            <h1 className="mt-4 text-5xl md:text-6xl">{product.name}</h1>
            <p className="mt-4 text-lg leading-snug text-paper/70">{product.tagline}</p>
            <p className="mt-5 text-[15px] leading-relaxed text-paper/50">{product.story}</p>

            <div className="mt-10">
              <div className="flex items-baseline justify-between">
                <h2 className="eyebrow">Size</h2>
                <span className="text-xs text-paper/40">
                  {size.cm[0]}×{size.cm[1]} cm · {size.hours[0]}–{size.hours[1]} h
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {product.sizes.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSizeKey(option.key)}
                    aria-pressed={option.key === sizeKey}
                    className={[
                      'rounded-sm border px-4 py-3 text-left transition-colors',
                      option.key === sizeKey
                        ? 'border-ember bg-ember/10'
                        : 'border-ink-line hover:border-paper/30',
                    ].join(' ')}
                  >
                    <span className="block text-sm">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-paper/45">
                      {option.pieces} pieces
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
              onClick={() => add(product.id, size.key)}
              className="mt-8 w-full rounded-full bg-ember py-4 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5"
            >
              Add to cart — {formatPrice(size.priceUsd, currency)}
            </button>

            <dl className="mt-8 divide-y divide-ink-line border-t border-ink-line text-sm">
              {[
                ['Material', '3 mm birch ply, laser-cut'],
                ['Both sides finished', 'Yes — second artwork on the reverse'],
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
