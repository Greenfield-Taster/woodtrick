import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ScrollToTop } from './ScrollToTop'
import { Header } from '../components/layout/Header'
import { Footer } from '../components/layout/Footer'
import { CartDrawer } from '../components/cart/CartDrawer'
import { Home } from '../routes/Home'
import { Catalog } from '../routes/Catalog'
import { ProductPage } from '../routes/ProductPage'

export function App() {
  // The hero animation only reads properly from the top of the page, so the
  // browser must not restore a previous scroll position on reload.
  if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Catalog />} />
          <Route path="/puzzle/:slug" element={<ProductPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </BrowserRouter>
  )
}
