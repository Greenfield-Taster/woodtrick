import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { COLLECTIONS } from '../../data/catalog'
import { useCart } from '../../store/cart'

interface MobileMenuProps {
  open: boolean
  onClose(): void
  links: Array<{ to: string; label: string }>
}

/**
 * The nav on a phone.
 *
 * It carries more than the header does — the collections live here too, since
 * the footer is a long scroll away and this is the only place on a phone where
 * looking for "mandalas" is a natural move.
 */
export function MobileMenu({ open, onClose, links }: MobileMenuProps) {
  const currency = useCart((s) => s.currency)
  const setCurrency = useCart((s) => s.setCurrency)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <div
      // Below the header, never over it: the panel slides out from underneath,
      // and the button that opened it stays reachable to close it again.
      className={['fixed inset-0 z-40 md:hidden', open ? '' : 'pointer-events-none'].join(' ')}
      aria-hidden={!open}
    >
      <div
        className={[
          'absolute inset-0 bg-ink/70 backdrop-blur-sm transition-opacity duration-400',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={onClose}
      />

      <nav
        aria-label="Main"
        className="absolute inset-x-0 top-0 border-b border-ink-line bg-ink-soft transition-transform duration-500"
        // Stated outright rather than through a utility pair: this panel slides
        // from behind a header that is itself fixed, and the one thing it must
        // never be is ambiguous about where it sits.
        style={{
          transform: open ? 'translateY(0)' : 'translateY(-100%)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Clears the header, which stays on top of this. */}
        <div className="container-page pt-20 pb-8">
          <ul className="divide-y divide-ink-line border-y border-ink-line">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={onClose}
                  className="block py-4 font-display text-3xl leading-none transition-colors hover:text-ember"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <h2 className="eyebrow mt-8">Collections</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {COLLECTIONS.map((collection) => (
              <li key={collection.id}>
                <Link
                  to={`/shop?collection=${collection.id}`}
                  onClick={onClose}
                  className="block rounded-full border border-ink-line px-3.5 py-1.5 text-sm text-paper/65 transition-colors hover:border-paper/40 hover:text-paper"
                >
                  {collection.name}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex items-center justify-between">
            <span className="text-sm text-paper/45">Prices in</span>
            <div className="flex items-center rounded-full border border-ink-line p-0.5">
              {(['USD', 'EUR'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  aria-pressed={currency === code}
                  className={[
                    'rounded-full px-3 py-1 text-xs font-medium tracking-wide transition-colors',
                    currency === code ? 'bg-paper text-ink' : 'text-paper/55 hover:text-paper',
                  ].join(' ')}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
