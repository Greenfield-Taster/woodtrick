import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { COLLECTIONS, PRODUCTS, priceFrom, type CollectionId, type SizeKey } from '../data/catalog'
import { ProductCard } from '../components/ui/ProductCard'
import { formatPrice, useCart } from '../store/cart'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'pieces-desc'

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'featured', label: 'Featured' },
  { key: 'price-asc', label: 'Price ↑' },
  { key: 'price-desc', label: 'Price ↓' },
  { key: 'pieces-desc', label: 'Most pieces' },
]

const SIZE_FILTERS: Array<{ key: SizeKey; label: string }> = [
  { key: 's', label: 'Under an hour or two' },
  { key: 'm', label: 'An evening' },
  { key: 'l', label: 'A weekend' },
  { key: 'king', label: 'A project' },
]

export function Catalog() {
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState<SortKey>('featured')
  const [maxUsd, setMaxUsd] = useState(140)
  const [sizes, setSizes] = useState<SizeKey[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const currency = useCart((s) => s.currency)
  const collection = params.get('collection') as CollectionId | null

  const setCollection = (id: CollectionId | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('collection', id)
    else next.delete('collection')
    setParams(next, { replace: true })
  }

  const toggleSize = (key: SizeKey) =>
    setSizes((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    )

  const results = useMemo(() => {
    let list = PRODUCTS.filter((product) => {
      if (collection && product.collection !== collection) return false
      if (priceFrom(product) > maxUsd) return false
      if (sizes.length > 0) {
        const affordable = product.sizes.some(
          (s) => sizes.includes(s.key) && s.priceUsd <= maxUsd,
        )
        if (!affordable) return false
      }
      return true
    })

    const cheapest = (id: string) => {
      const product = PRODUCTS.find((p) => p.id === id)!
      return priceFrom(product)
    }

    if (sort === 'price-asc') list = [...list].sort((a, b) => cheapest(a.id) - cheapest(b.id))
    if (sort === 'price-desc') list = [...list].sort((a, b) => cheapest(b.id) - cheapest(a.id))
    if (sort === 'pieces-desc')
      list = [...list].sort(
        (a, b) =>
          Math.max(...b.sizes.map((s) => s.pieces)) - Math.max(...a.sizes.map((s) => s.pieces)),
      )

    return list
  }, [collection, maxUsd, sizes, sort])

  const active = COLLECTIONS.find((c) => c.id === collection)
  const narrowed = (collection ? 1 : 0) + sizes.length + (maxUsd < 140 ? 1 : 0)

  return (
    <div className="container-page pt-28 pb-24 md:pt-36">
      <header className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="eyebrow">{results.length} designs</p>
          <h1 className="mt-5 text-5xl md:text-7xl">{active ? active.name : 'Every puzzle'}</h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-paper/55">
            {active
              ? active.note
              : 'Each design is cut in four sizes. The picture is recut for every tier, so nothing is a crop of anything else.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:col-span-4 md:col-start-9 md:justify-end">
          {SORTS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSort(option.key)}
              aria-pressed={sort === option.key}
              className={[
                'rounded-full border px-3.5 py-1.5 text-xs transition-colors',
                sort === option.key
                  ? 'border-paper bg-paper text-ink'
                  : 'border-ink-line text-paper/55 hover:text-paper',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="rule-line my-10" />

      <div className="grid gap-12 md:grid-cols-12">
        <aside className="md:col-span-3">
          {/* On a phone the whole filter column would stand between the
              visitor and the first puzzle, so it folds away until asked for. */}
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            className="flex w-full items-center justify-between border-y border-ink-line py-3.5 text-sm text-paper md:hidden"
          >
            <span>Filter and sort</span>
            <span className="text-paper/40">
              {filtersOpen ? 'Hide' : narrowed > 0 ? `${narrowed} applied` : 'Show'}
            </span>
          </button>

          <div
            className={[
              filtersOpen ? 'block' : 'hidden',
              'pt-8 md:block md:pt-0 md:sticky md:top-28',
            ].join(' ')}
          >
            <h2 className="eyebrow">Collection</h2>
            <ul className="mt-4 space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => setCollection(null)}
                  className={[
                    'text-sm transition-colors',
                    collection === null ? 'text-paper' : 'text-paper/45 hover:text-paper/80',
                  ].join(' ')}
                >
                  All
                </button>
              </li>
              {COLLECTIONS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setCollection(item.id)}
                    className={[
                      'text-sm transition-colors',
                      collection === item.id ? 'text-paper' : 'text-paper/45 hover:text-paper/80',
                    ].join(' ')}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>

            <h2 className="eyebrow mt-10">How long you want it to take</h2>
            <ul className="mt-4 space-y-1.5">
              {SIZE_FILTERS.map((item) => (
                <li key={item.key}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-paper/55 transition-colors hover:text-paper">
                    <input
                      type="checkbox"
                      checked={sizes.includes(item.key)}
                      onChange={() => toggleSize(item.key)}
                      className="h-3.5 w-3.5 accent-[#D8602C]"
                    />
                    {item.label}
                  </label>
                </li>
              ))}
            </ul>

            <h2 className="eyebrow mt-10">Starting price up to</h2>
            <input
              type="range"
              min={24}
              max={140}
              step={1}
              value={maxUsd}
              onChange={(event) => setMaxUsd(Number(event.target.value))}
              className="mt-4 w-full accent-[#D8602C]"
              aria-label="Maximum starting price"
            />
            <p className="mt-2 text-sm text-ember">{formatPrice(maxUsd, currency)}</p>
          </div>
        </aside>

        <div className="md:col-span-9">
          {results.length === 0 ? (
            <p className="py-20 text-paper/45">
              Nothing matches that combination. Widen the price or clear a filter.
            </p>
          ) : (
            <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((product, index) => (
                <div key={product.id} className={index % 5 === 2 ? 'sm:pt-14' : undefined}>
                  <ProductCard product={product} tall={index % 5 === 2} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
