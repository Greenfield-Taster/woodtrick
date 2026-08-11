import { create } from 'zustand'
import {
  CURRENCIES,
  CUSTOM_ID_PREFIX,
  CUSTOM_PUZZLE,
  PRODUCTS,
  type CurrencyCode,
  type Product,
  type VariantKey,
} from '../data/catalog'

export interface CartLine {
  productId: string
  variant: VariantKey
  qty: number
  thumbnail?: string
}

interface CartState {
  lines: CartLine[]
  open: boolean
  currency: CurrencyCode
  add(productId: string, variant: VariantKey, qty?: number, thumbnail?: string): void
  remove(productId: string, variant: VariantKey): void
  setQty(productId: string, variant: VariantKey, qty: number): void
  setOpen(open: boolean): void
  setCurrency(currency: CurrencyCode): void
}

export const useCart = create<CartState>((set) => ({
  lines: [],
  open: false,
  currency: 'USD',

  add: (productId, variant, qty = 1, thumbnail) =>
    set((state) => {
      const existing = state.lines.find((l) => l.productId === productId && l.variant === variant)
      const lines = existing
        ? state.lines.map((l) => (l === existing ? { ...l, qty: l.qty + qty } : l))
        : [...state.lines, { productId, variant, qty, thumbnail }]
      return { lines, open: true }
    }),

  remove: (productId, variant) =>
    set((state) => ({
      lines: state.lines.filter((l) => !(l.productId === productId && l.variant === variant)),
    })),

  setQty: (productId, variant, qty) =>
    set((state) => ({
      lines: state.lines
        .map((l) => (l.productId === productId && l.variant === variant ? { ...l, qty } : l))
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
    const variant = product?.variants.find((v) => v.key === line.variant)
    if (!product || !variant) return []
    return [{ ...line, product, unitUsd: variant.priceUsd, label: variant.label }]
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
