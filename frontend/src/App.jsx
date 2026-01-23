import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import VerificationForm from './components/VerificationForm'
import Deployment from './components/Deployment'
import Monitoring from './components/Monitoring'
import Documentation from './components/Documentation'
import Integration from './components/Integration'
import { Menu, X, Zap, Shield, Activity, Book, Code } from 'lucide-react'
import './App.css'

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Verify', icon: Shield },
    { path: '/deploy', label: 'Deploy', icon: Zap },
    { path: '/monitor', label: 'Monitor', icon: Activity },
    { path: '/docs', label: 'Docs', icon: Book },
    { path: '/integrate', label: 'Integrate', icon: Code },
  ]

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <Shield className="logo-icon" />
          <span>HALE Oracle</span>
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
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<VerificationForm />} />
            <Route path="/deploy" element={<Deployment />} />
            <Route path="/monitor" element={<Monitoring />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/integrate" element={<Integration />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
