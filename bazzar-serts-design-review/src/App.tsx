import { useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home as HomeIcon, ShoppingBag, Smartphone, User } from 'lucide-react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { SupportChat } from './components/SupportChat'
import { ScrollToTop } from './components/ScrollToTop'
import { SplashScreen } from './components/SplashScreen'
import { CookieBanner } from './components/CookieBanner'
import { Home } from './pages/Home'
import { Catalog } from './pages/Catalog'
import { Product } from './pages/Product'
import { Cabinet } from './pages/Cabinet'
import { OrderCheck } from './pages/OrderCheck'
import { HowItWorks } from './pages/HowItWorks'
import { InstallGuide } from './pages/InstallGuide'
import { Guarantees } from './pages/Guarantees'
import { Privacy } from './pages/Privacy'
import { CertDashboard } from './pages/CertDashboard'
import { NotFound } from './pages/NotFound'
import { useI18n } from './hooks/useI18n'

/* ═══════════════════════════════════════════════════════════
   App — Routing, Layout, Bottom Navigation
   ═══════════════════════════════════════════════════════════ */

export function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const [splashDone, setSplashDone] = useState(false)
  const { t } = useI18n()

  const NAV_ITEMS = [
    { path: '/', label: t('nav.home'), icon: HomeIcon },
    { path: '/catalog', label: t('nav.catalog'), icon: ShoppingBag },
    { path: '/catalog?category=apps', label: t('nav.apps'), icon: Smartphone },
    { path: '/cabinet', label: t('nav.cabinet'), icon: User },
  ]

  return (
    <>
      {/* ── Splash Screen ─────────────────────────────────── */}
      <AnimatePresence>
        {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
      </AnimatePresence>

      <ScrollToTop />
      <Header />

      {/* Анимированные переходы между страницами */}
      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:id" element={<Product />} />

              <Route path="/cabinet" element={<Cabinet />} />
              <Route path="/order-check" element={<OrderCheck />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/install-guide" element={<InstallGuide />} />
              <Route path="/guarantees" element={<Guarantees />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/dashboard" element={<CertDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <SupportChat />
      <CookieBanner />

      {/* ── Bottom Navigation (Mobile) ─────────────────────── */}
      <nav className="bottom-nav desktop-hide" role="navigation" aria-label={t('nav.mainAria')}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.path === '/'
            ? pathname === '/'
            : pathname.startsWith(item.path)

          return (
            <button
              key={item.path}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Градиентная пилюля для активного таба */}
              {isActive && (
                <motion.div
                  className="nav-pill"
                  layoutId="nav-active-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
