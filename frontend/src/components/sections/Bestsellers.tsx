import { PRODUCTS } from '../../data/catalog'
import { ProductRail } from '../ui/ProductRail'

export function Bestsellers() {
  return (
    <ProductRail
      eyebrow="Reordered most often"
      title="The ones people come back for"
      products={PRODUCTS.filter((p) => p.bestseller)}
      to="/shop?collection=bestsellers"
      linkLabel="See every bestseller"
    />
  )
}
