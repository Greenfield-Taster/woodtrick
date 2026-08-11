import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { COLLECTIONS, PRODUCTS, maxPieces, priceFrom, type CollectionId } from '../data/catalog'
import { ProductCard } from '../components/ui/ProductCard'
import { formatPrice, useCart } from '../store/cart'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'pieces-desc'

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'featured', label: 'Featured' },
  { key: 'price-asc', label: 'Price ↑' },
  { key: 'price-desc', label: 'Price ↓' },
  { key: 'pieces-desc', label: 'Most pieces' },
]

/*
 * Every design is cut to its own piece counts, so the filter bands the counts
 * rather than naming tiers — a King Size is 300 pieces on one design and 366 on
 * another, and only the number is comparable across the catalogue.
 */
type Band = { key: string; label: string; min: number; max: number }

const BANDS: Band[] = [
  { key: 'small', label: 'Under 150 pieces', min: 0, max: 149 },
  { key: 'medium', label: '150 – 350', min: 150, max: 350 },
  { key: 'large', label: '350 – 700', min: 351, max: 700 },
  { key: 'huge', label: '700 and up', min: 701, max: Infinity },
]

export const PRICE_CEILING = 150

/*
 * Bestsellers is a flag on a product rather than a place a product lives, but
 * it browses like a collection, so the sidebar lists it as one more way in and
 * the URL carries it in the same parameter.
 */
const BESTSELLERS = 'bestsellers'

type View = CollectionId | typeof BESTSELLERS

const VIEWS: Array<{ id: View; name: string; note: string }> = [
  { id: BESTSELLERS, name: 'Bestsellers', note: 'The ones people come back for' },
  ...COLLECTIONS.map(({ id, name, note }) => ({ id: id as View, name, note })),
]

export function Catalog() {
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState<SortKey>('featured')
  const [maxUsd, setMaxUsd] = useState(PRICE_CEILING)
  const [bands, setBands] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const currency = useCart((s) => s.currency)
  const requested = params.get('collection')
  const view = VIEWS.some((v) => v.id === requested) ? (requested as View) : null

  const setView = (id: View | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('collection', id)
    else next.delete('collection')
    setParams(next, { replace: true })
  }

  const toggleBand = (key: string) =>
    setBands((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    )

  const results = useMemo(() => {
    const chosen = BANDS.filter((b) => bands.includes(b.key))

    let list = PRODUCTS.filter((product) => {
      if (view === BESTSELLERS && !product.bestseller) return false
      if (view && view !== BESTSELLERS && product.collection !== view) return false
      if (priceFrom(product) > maxUsd) return false
      if (chosen.length > 0) {
        const fits = product.variants.some(
          (v) =>
            v.pieces !== undefined &&
            v.priceUsd <= maxUsd &&
            chosen.some((b) => v.pieces! >= b.min && v.pieces! <= b.max),
        )
        if (!fits) return false
      }
      return true
    })

    if (sort === 'price-asc') list = [...list].sort((a, b) => priceFrom(a) - priceFrom(b))
    if (sort === 'price-desc') list = [...list].sort((a, b) => priceFrom(b) - priceFrom(a))
    if (sort === 'pieces-desc') list = [...list].sort((a, b) => maxPieces(b) - maxPieces(a))

    return list
  }, [view, maxUsd, bands, sort])

  const active = VIEWS.find((v) => v.id === view)
  const narrowed = (view ? 1 : 0) + bands.length + (maxUsd < PRICE_CEILING ? 1 : 0)

  return (
    <div className="container-page pt-28 pb-24 md:pt-36">
      <header className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <p className="eyebrow">{results.length} designs</p>
          <h1 className="mt-5 text-5xl md:text-7xl">{active ? active.name : 'Every puzzle'}</h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-paper/55">
            {active
              ? active.note
              : 'Animals come in four sizes, mandalas in three, a Quezzle in parts of a set. Each tier is recut rather than cropped, so nothing is a slice of anything else.'}
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
                  onClick={() => setView(null)}
                  className={[
                    'text-sm transition-colors',
                    view === null ? 'text-paper' : 'text-paper/45 hover:text-paper/80',
                  ].join(' ')}
                >
                  All puzzles
                </button>
              </li>
              {VIEWS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setView(item.id)}
                    className={[
                      'text-sm transition-colors',
                      view === item.id ? 'text-paper' : 'text-paper/45 hover:text-paper/80',
                    ].join(' ')}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>

            <h2 className="eyebrow mt-10">How many pieces</h2>
            <ul className="mt-4 space-y-1.5">
              {BANDS.map((item) => (
                <li key={item.key}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-paper/55 transition-colors hover:text-paper">
                    <input
                      type="checkbox"
                      checked={bands.includes(item.key)}
                      onChange={() => toggleBand(item.key)}
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
              max={PRICE_CEILING}
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
            /*
             * A catalogue is read by comparison, so every card is the same
             * card: one frame proportion, one baseline, nothing stepped out of
             * line. The staggering belongs to the rails on the home page, where
             * it is one row and reads as arrangement rather than as drift.
             *
             * Each card spans three rows of this grid and subgrids onto them,
             * so picture, name and tagline are laid on tracks shared with the
             * cards beside it. A name that wraps to three lines then lifts the
             * whole row's taglines rather than dropping its own out of step —
             * which no fixed reserve can promise at every width.
             */
            <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  className="grid row-span-3 grid-rows-subgrid gap-y-0"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
