import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { countItems, useCart } from '../../store/cart'
import { SOCIAL } from '../../data/social'
import { SocialIcon } from '../ui/SocialIcon'
import { MobileMenu } from './MobileMenu'
import { ThemeToggle } from './ThemeToggle'

const NAV = [
  { to: '/shop', label: 'Shop' },
  { to: '/custom', label: 'Custom puzzle' },
]

export function Header() {
  const [lifted, setLifted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname, search } = useLocation()
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

  useEffect(() => setMenuOpen(false), [pathname, search])

  const count = countItems(lines)

  return (
    <>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={NAV} />

      <header
        className={[
          'fixed inset-x-0 top-0 z-50 transition-colors duration-500',
          lifted
            ? 'bg-ink/85 backdrop-blur-xl border-b border-ink-line'
            : 'border-b border-transparent',
        ].join(' ')}
      >
        <div className="container-page-wide flex h-16 items-center justify-between gap-4 md:h-20 md:gap-6">
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

          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle className="hidden sm:flex" />

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
              className="group relative flex items-center gap-2 rounded-full border border-ink-line px-3.5 py-2 text-sm text-paper transition-colors hover:border-ember md:px-4"
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

            <div className="ml-4 hidden items-center gap-0.5 lg:flex">
              {SOCIAL.map((account) => (
                <a
                  key={account.id}
                  href={account.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={`Unidragon on ${account.name}`}
                  className="grid h-9 w-9 place-items-center rounded-full text-paper/55 transition-colors hover:bg-ink-soft hover:text-ember"
                >
                  <SocialIcon id={account.id} className="h-[17px] w-[17px]" />
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink-line text-paper transition-colors hover:border-ember md:hidden"
            >
              <span className="relative block h-3 w-4" aria-hidden>
                <span
                  className={[
                    'absolute inset-x-0 block h-px bg-current transition-all duration-300',
                    menuOpen ? 'top-1.5 rotate-45' : 'top-0',
                  ].join(' ')}
                />
                <span
                  className={[
                    'absolute inset-x-0 block h-px bg-current transition-all duration-300',
                    menuOpen ? 'top-1.5 -rotate-45' : 'top-3',
                  ].join(' ')}
                />
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
