import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { COLLECTIONS } from '../../data/catalog'
import { SOCIAL } from '../../data/social'
import { SocialIcon } from '../ui/SocialIcon'
import { useCart } from '../../store/cart'
import { ThemeToggle } from './ThemeToggle'

interface MobileMenuProps {
  open: boolean
  onClose(): void
  links: Array<{ to: string; label: string }>
}

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
        style={{
          transform: open ? 'translateY(0)' : 'translateY(-100%)',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
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

          <h2 className="eyebrow mt-8">Follow</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {SOCIAL.map((account) => (
              <li key={account.id}>
                <a
                  href={account.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-2 rounded-full border border-ink-line px-3.5 py-1.5 text-sm text-paper/65 transition-colors hover:border-paper/40 hover:text-paper"
                >
                  <SocialIcon id={account.id} className="h-4 w-4" />
                  {account.name}
                </a>
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

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-paper/45">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </div>
  )
}
