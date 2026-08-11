import { Link } from 'react-router-dom'
import { COLLECTIONS } from '../../data/catalog'
import { SOCIAL } from '../../data/social'
import { SocialIcon } from '../ui/SocialIcon'

const SUPPORT = ['Shipping & returns', 'Payment methods', 'Corporate gifts', 'Wholesale', 'Contact']

export function Footer() {
  return (
    <footer className="border-t border-ink-line bg-ink pt-20 pb-10">
      <div className="container-page-wide">
        <div className="grid gap-12 md:grid-cols-12 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto] xl:gap-x-16 2xl:gap-x-24">
          <div className="md:col-span-5 xl:col-auto">
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

          <nav className="md:col-span-3 md:col-start-7 xl:col-auto">
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

          <div className="md:col-span-3 md:col-start-10 xl:contents">
            <nav>
              <h2 className="eyebrow">Support</h2>
              <ul className="mt-5 space-y-2.5">
                {SUPPORT.map((item) => (
                  <li key={item}>
                    <span className="text-sm text-paper/65">{item}</span>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-10 xl:mt-0">
              <h2 className="eyebrow">Follow</h2>
              <ul className="mt-5 space-y-3">
                {SOCIAL.map((account) => (
                  <li key={account.id} className="flex items-start gap-3 xl:items-center">
                    <SocialIcon
                      id={account.id}
                      className="mt-1 h-4 w-4 shrink-0 text-paper/40 xl:mt-0"
                    />
                    <div className="xl:flex xl:items-baseline xl:gap-3">
                      <a
                        href={account.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm text-paper/65 underline-offset-4 transition-colors hover:text-paper hover:underline"
                      >
                        {account.name}
                      </a>
                      <p className="text-xs text-paper/35 xl:whitespace-nowrap">
                        {account.handle} · {account.followers} followers
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
