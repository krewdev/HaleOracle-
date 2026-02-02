import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Landing from './components/Landing'
import RoleSelection from './components/RoleSelection'
import VerificationForm from './components/VerificationForm'
import Deployment from './components/Deployment'
import Monitoring from './components/Monitoring'
import Documentation from './components/Documentation'
import Integration from './components/Integration'
import DeliverySubmission from './components/DeliverySubmission'
import TelegramConnect from './components/TelegramConnect'
import FutureBackground from './components/FutureBackground'
import { Menu, X, Zap, Shield, Activity, Book, Code, Home, ChevronRight } from 'lucide-react'
import './App.css'

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/verify', label: 'Verify', icon: Shield },
    { path: '/deploy', label: 'Deploy', icon: Zap },
    { path: '/monitor', label: 'Monitor', icon: Activity },
    { path: '/docs', label: 'Docs', icon: Book },
    { path: '/integrate', label: 'Integrate', icon: Code },
  ]

  // We want the navbar to be visible but discreet on the landing page
  const isLanding = location.pathname === '/';

  return (
    <nav className={`navbar ${isLanding ? 'navbar-landing' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="logo">
          <div className="logo-glow">
            <Shield className="logo-icon" />
          </div>
          <span className="text-gradient">HALE Oracle</span>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          {navItems.map(({ path, label, icon: Icon }) => (
            <li key={path}>
              <Link
                to={path}
                className={location.pathname === path ? 'active' : ''}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{label}</span>
                {location.pathname === path && <div className="active-dot" />}
              </Link>
            </li>
          ))}
        </ul>

        {!isLanding && (
          <div className="nav-actions">
            <button className="btn-launch-small" onClick={() => window.location.href = '/verify'}>
              LAUNCH <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RoleSelection />} />
            <Route path="/verify" element={<VerificationForm />} />
            <Route path="/deploy" element={<Deployment />} />
            <Route path="/monitor" element={<Monitoring />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/integrate" element={<Integration />} />
            <Route path="/submit" element={<DeliverySubmission />} />
            <Route path="/connect-telegram" element={<TelegramConnect />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
