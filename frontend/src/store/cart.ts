import { create } from 'zustand'
import {
  CURRENCIES,
  CUSTOM_ID_PREFIX,
  CUSTOM_PUZZLE,
  PRODUCTS,
  type CurrencyCode,
  type Product,
  type SizeKey,
} from '../data/catalog'

export interface CartLine {
  productId: string
  size: SizeKey
  qty: number
  /**
   * A custom order's own picture. Catalogue lines paint their design from its
   * recipe; a photograph has no recipe, so the line carries a small copy of it.
   */
  thumbnail?: string
}

interface CartState {
  lines: CartLine[]
  open: boolean
  currency: CurrencyCode
  add(productId: string, size: SizeKey, qty?: number, thumbnail?: string): void
  remove(productId: string, size: SizeKey): void
  setQty(productId: string, size: SizeKey, qty: number): void
  setOpen(open: boolean): void
  setCurrency(currency: CurrencyCode): void
}

export const useCart = create<CartState>((set) => ({
  lines: [],
  open: false,
  currency: 'USD',

  add: (productId, size, qty = 1, thumbnail) =>
    set((state) => {
      const existing = state.lines.find((l) => l.productId === productId && l.size === size)
      const lines = existing
        ? state.lines.map((l) => (l === existing ? { ...l, qty: l.qty + qty } : l))
        : [...state.lines, { productId, size, qty, thumbnail }]
      return { lines, open: true }
    }),

  remove: (productId, size) =>
    set((state) => ({
      lines: state.lines.filter((l) => !(l.productId === productId && l.size === size)),
    })),

  setQty: (productId, size, qty) =>
    set((state) => ({
      lines: state.lines
        .map((l) => (l.productId === productId && l.size === size ? { ...l, qty } : l))
        .filter((l) => l.qty > 0),
    })),

  setOpen: (open) => set({ open }),
  setCurrency: (currency) => set({ currency }),
}))

export interface ResolvedLine extends CartLine {
  product: Product
  unitUsd: number
  label: string
}

export function resolveLines(lines: CartLine[]): ResolvedLine[] {
  return lines.flatMap((line) => {
    const product = line.productId.startsWith(CUSTOM_ID_PREFIX)
      ? CUSTOM_PUZZLE
      : PRODUCTS.find((p) => p.id === line.productId)
    const size = product?.sizes.find((s) => s.key === line.size)
    if (!product || !size) return []
    return [{ ...line, product, unitUsd: size.priceUsd, label: size.label }]
  })
}

export function subtotalUsd(lines: CartLine[]): number {
  return resolveLines(lines).reduce((sum, l) => sum + l.unitUsd * l.qty, 0)
}

export function formatPrice(usd: number, currency: CurrencyCode): string {
  const { rate, locale, code } = CURRENCIES[currency]
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 2,
  }).format(usd * rate)
}

export function countItems(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0)
}
