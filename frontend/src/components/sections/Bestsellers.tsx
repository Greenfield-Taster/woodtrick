import { Link } from 'react-router-dom'
import { PRODUCTS } from '../../data/catalog'
import { ProductCard } from '../ui/ProductCard'
import { useReveal } from '../../lib/useReveal'

export function Bestsellers() {
  const ref = useReveal<HTMLDivElement>()
  const picks = PRODUCTS.filter((p) => p.bestseller).slice(0, 5)

  return (
    <section className="border-t border-ink-line py-24 md:py-32">
      <div className="container-page">
        <div className="flex items-end justify-between gap-8">
          <div>
            <p className="eyebrow">Reordered most often</p>
            <h2 className="mt-5 text-4xl md:text-5xl">The ones people come back for</h2>
          </div>
          <Link
            to="/shop"
            className="hidden shrink-0 text-sm text-paper/60 underline-offset-8 transition-colors hover:text-paper hover:underline sm:block"
          >
            See everything
          </Link>
        </div>
      </div>

      {/* Deliberately runs past the container edge — the rail should feel longer
          than the page is wide. */}
      <div ref={ref} className="reveal mt-14 overflow-x-auto pb-4">
        <div className="container-page flex gap-6 md:gap-8">
          {picks.map((product, index) => (
            <div
              key={product.id}
              className={[
                'w-[70vw] shrink-0 sm:w-[42vw] lg:w-[26vw]',
                index % 2 === 1 ? 'lg:pt-16' : '',
              ].join(' ')}
            >
              <ProductCard product={product} tall={index % 2 === 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
