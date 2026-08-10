import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { countItems, useCart } from '../../store/cart'

const NAV = [
  { to: '/shop', label: 'Shop' },
  { to: '/shop?collection=mandalas', label: 'Mandalas' },
  { to: '/shop?collection=animals', label: 'Animals' },
  { to: '/#sizes', label: 'Sizes' },
]

export function Header() {
  const [lifted, setLifted] = useState(false)
  const lines = useCart((s) => s.lines)
  const currency = useCart((s) => s.currency)
  const setCurrency = useCart((s) => s.setCurrency)
  const setOpen = useCart((s) => s.setOpen)

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const count = countItems(lines)

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-50 transition-colors duration-500',
        lifted ? 'bg-ink/85 backdrop-blur-xl border-b border-ink-line' : 'border-b border-transparent',
      ].join(' ')}
    >
      <div className="container-page flex h-16 items-center justify-between gap-6 md:h-20">
        <Link
          to="/"
          className="font-display text-lg tracking-tight text-paper transition-opacity hover:opacity-70 md:text-xl"
          style={{ fontVariationSettings: "'SOFT' 20, 'WONK' 1" }}
        >
          Unidragon
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className="text-sm text-paper/70 transition-colors hover:text-paper"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center rounded-full border border-ink-line p-0.5 sm:flex">
            {(['USD', 'EUR'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setCurrency(code)}
                aria-pressed={currency === code}
                className={[
                  'rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide transition-colors',
                  currency === code ? 'bg-paper text-ink' : 'text-paper/55 hover:text-paper',
                ].join(' ')}
              >
                {code}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative flex items-center gap-2 rounded-full border border-ink-line px-4 py-2 text-sm text-paper transition-colors hover:border-ember"
          >
            Cart
            <span
              className={[
                'grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-medium transition-colors',
                count > 0 ? 'bg-ember text-ink' : 'bg-ink-line text-paper/60',
              ].join(' ')}
            >
              {count}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
