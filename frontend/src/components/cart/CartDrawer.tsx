import { useEffect } from 'react'
import { CURRENCIES } from '../../data/catalog'
import { discountUsd, formatPrice, resolveLines, subtotalUsd, useCart } from '../../store/cart'
import { ProductPhoto } from '../ui/ProductPhoto'

export function CartDrawer() {
  const open = useCart((s) => s.open)
  const setOpen = useCart((s) => s.setOpen)
  const lines = useCart((s) => s.lines)
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const currency = useCart((s) => s.currency)
  const coupon = useCart((s) => s.coupon)
  const applyCoupon = useCart((s) => s.applyCoupon)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, setOpen])

  const resolved = resolveLines(lines)
  const subtotal = subtotalUsd(lines)
  const discount = discountUsd(lines, coupon)
  const threshold = CURRENCIES[currency].freeShippingFrom / CURRENCIES[currency].rate
  const toFree = Math.max(0, threshold - subtotal)
  const progress = Math.min(1, subtotal / threshold)

  return (
    <div
      className={['fixed inset-0 z-[70]', open ? '' : 'pointer-events-none'].join(' ')}
      aria-hidden={!open}
    >
      <div
        className={[
          'absolute inset-0 bg-ink/70 backdrop-blur-sm transition-opacity duration-500',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={() => setOpen(false)}
      />

      <aside
        role="dialog"
        aria-label="Cart"
        className={[
          'absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-ink-line bg-ink-soft transition-transform duration-500',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-center justify-between border-b border-ink-line px-6 py-5">
          <h2 className="font-display text-2xl">Your cart</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-sm text-paper/55 transition-colors hover:text-paper"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {resolved.length === 0 ? (
            <p className="py-16 text-sm text-paper/45">
              Nothing here yet. Every puzzle ships in a box you can hand over as-is.
            </p>
          ) : (
            <ul className="divide-y divide-ink-line">
              {resolved.map((line) => (
                <li key={`${line.productId}-${line.variant}`} className="flex gap-4 py-5">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-ink">
                    {line.thumbnail ? (
                      <img src={line.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ProductPhoto
                        src={line.product.photo}
                        className="h-full w-full object-contain p-1.5"
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between gap-3">
                      <p className="font-display text-lg leading-tight">{line.product.name}</p>
                      <p className="text-sm text-ember">
                        {formatPrice(line.unitUsd * line.qty, currency)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-paper/45">{line.label}</p>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-ink-line">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setQty(line.productId, line.variant, line.qty - 1)}
                          className="px-3 py-1 text-paper/60 transition-colors hover:text-paper"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm">{line.qty}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setQty(line.productId, line.variant, line.qty + 1)}
                          className="px-3 py-1 text-paper/60 transition-colors hover:text-paper"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(line.productId, line.variant)}
                        className="text-xs text-paper/40 underline-offset-4 transition-colors hover:text-paper/70 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-ink-line px-6 py-6">
          <div className="mb-4">
            <div className="h-px w-full bg-ink-line">
              <div
                className="h-px bg-ember transition-[width] duration-700"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-paper/50">
              {toFree > 0
                ? `${formatPrice(toFree, currency)} away from free delivery`
                : 'Free delivery unlocked'}
            </p>
          </div>

          {coupon && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-sm border border-ember/40 bg-ember/10 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs tracking-wide text-ember">{coupon.code}</p>
                <p className="mt-0.5 text-[11px] text-paper/45">
                  {coupon.percent}% off, won at the puzzle table
                </p>
              </div>
              <button
                type="button"
                onClick={() => applyCoupon(null)}
                className="shrink-0 text-[11px] text-paper/40 underline-offset-4 transition-colors hover:text-paper/70 hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          <div className="flex items-baseline justify-between">
            <span className="text-sm text-paper/60">Subtotal</span>
            <span
              className={[
                'font-display text-2xl',
                discount > 0 ? 'text-paper/40 line-through decoration-1' : '',
              ].join(' ')}
            >
              {formatPrice(subtotal, currency)}
            </span>
          </div>

          {discount > 0 && (
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm text-paper/60">With your discount</span>
              <span className="font-display text-2xl text-ember">
                {formatPrice(subtotal - discount, currency)}
              </span>
            </div>
          )}

          <button
            type="button"
            disabled={resolved.length === 0}
            className="mt-5 w-full rounded-full bg-ember py-3.5 text-sm font-medium text-ink transition-opacity disabled:opacity-30"
          >
            Checkout
          </button>
          <p className="mt-3 text-center text-[11px] text-paper/30">
            Design concept — checkout is not connected.
          </p>
        </div>
      </aside>
    </div>
  )
}
