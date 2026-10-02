import { Link, NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import LandingPage from './pages/Landing'
import LoginPage from './pages/LoginPage'
import ParcelPage from './pages/ParcelPage'
import VerifyPage from './pages/VerifyPage'
import VerifyCertificatePage from './pages/VerifyCertificatePage'
import LedgerPage from './pages/LedgerPage'
import AlertsPage from './pages/AlertsPage'
import ScannerPage from './pages/ScannerPage'
import NotFoundPage from './pages/NotFoundPage'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/parcel/123-4A', label: 'Land Passport' },
  { to: '/verify', label: 'Verification' },
  { to: '/ledger', label: 'Ledger' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/scanner', label: 'Scanner' },
]

function App() {
  return (
    <div className="smartterra-app">
      <div className="demo-banner">Demo data only</div>

      <header className="topbar glass-panel">
        <Link to="/" className="brand-wrap" aria-label="SmartTerra home">
          <div className="brand-mark">
            <span className="pin"></span>
            <span className="check"></span>
          </div>
          <div className="wordmark">SmartTerra</div>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-actions">
          <div className="locale-toggle" aria-label="Language toggle">
            <button type="button" className="is-active">EN</button>
            <button type="button">TA</button>
          </div>

          <button className="icon-button" type="button" aria-label="Toggle large text">A+</button>
          <button className="icon-button" type="button" aria-label="Toggle dark mode">☾</button>
          <Link to="/login" className="login-button">Login</Link>
        </div>
      </header>

      <main className="page-shell">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/parcel/:id" element={<ParcelPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/verify/:certificateId" element={<VerifyCertificatePage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>Demo data only for product showcase. Real land records require approval from the official registry.</p>
      </footer>
    </div>
  )
}

export default App
