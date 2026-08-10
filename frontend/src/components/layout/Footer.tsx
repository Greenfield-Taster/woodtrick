import { Link } from 'react-router-dom'
import { COLLECTIONS } from '../../data/catalog'

const SUPPORT = ['Shipping & returns', 'Payment methods', 'Corporate gifts', 'Wholesale', 'Contact']

export function Footer() {
  return (
    <footer className="border-t border-ink-line bg-ink pt-20 pb-10">
      <div className="container-page">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-display text-4xl leading-[0.95] md:text-5xl">
              Cut in small runs.
              <br />
              Shipped from two
              <br />
              warehouses.
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-paper/50">
              Orders in the United States ship from Pennsylvania, orders in the European Union from
              Poland. Free delivery over $49 and €45 respectively.
            </p>
          </div>

          <nav className="md:col-span-3 md:col-start-7">
            <h2 className="eyebrow">Collections</h2>
            <ul className="mt-5 space-y-2.5">
              {COLLECTIONS.map((collection) => (
                <li key={collection.id}>
                  <Link
                    to={`/shop?collection=${collection.id}`}
                    className="text-sm text-paper/65 transition-colors hover:text-paper"
                  >
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-3">
            <h2 className="eyebrow">Support</h2>
            <ul className="mt-5 space-y-2.5">
              {SUPPORT.map((item) => (
                <li key={item}>
                  <span className="text-sm text-paper/65">{item}</span>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="rule-line mt-16" />

        <div className="mt-6 flex flex-col gap-3 text-xs text-paper/35 sm:flex-row sm:items-center sm:justify-between">
          <p>Design concept — not a live store. No orders are taken.</p>
          <p>Unidragon · United States &amp; European Union</p>
        </div>
      </div>
    </footer>
  )
}
