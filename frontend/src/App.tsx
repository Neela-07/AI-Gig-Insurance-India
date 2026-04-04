import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeProvider } from './hooks/useTheme'
import Sidebar from './components/layout/Sidebar'
import Navbar from './components/layout/Navbar'
import BottomNav from './components/layout/BottomNav'
import FAB from './components/layout/FAB'

import WorkerDashboard from './pages/WorkerDashboard'
import PremiumCalculator from './pages/PremiumCalculator'
import RiskMonitor from './pages/RiskMonitor'
import Claims from './pages/Claims'
import AdminDashboard from './pages/AdminDashboard'
import FraudAnalysis from './pages/FraudAnalysis'
import PayoutSimulator from './pages/PayoutSimulator'
import MyInsurance from './pages/MyInsurance'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import { authService, type User } from './services/auth'
const pageComponents: Record<string, React.ComponentType> = {
  dashboard: WorkerDashboard,
  insurance: MyInsurance,
  claims: Claims,
  risk: RiskMonitor,
  calculator: PremiumCalculator,
  alerts: RiskMonitor,       // re-uses risk monitor for alerts
  reports: AdminDashboard,
  settings: Settings,
  admin: AdminDashboard,
  fraud: FraudAnalysis,
  payout: PayoutSimulator,
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [user, setUser] = useState<User | null>(authService.getCurrentUser())
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated())
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    if (!isAuthenticated) {
      setUser(null)
    }
  }, [isAuthenticated])

  const handleLoginSuccess = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    setActivePage(userData.role === 'admin' ? 'admin' : 'dashboard')
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    setUser(null)
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <AnimatePresence mode="wait">
          {authMode === 'login' ? (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Login 
                onLoginSuccess={handleLoginSuccess} 
                onNavigateToRegister={() => setAuthMode('register')} 
              />
            </motion.div>
          ) : (
            <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Register 
                onRegisterSuccess={handleLoginSuccess}
                onNavigateToLogin={() => setAuthMode('login')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </ThemeProvider>
    )
  }

  const isAdmin = user?.role === 'admin'
  const PageComponent = pageComponents[activePage] || WorkerDashboard

  const handleFABClick = () => setActivePage('payout')

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* Sidebar — desktop */}
        <Sidebar activePage={activePage} onNavigate={setActivePage} isAdmin={isAdmin} />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar
            activePage={activePage}
            isAdmin={isAdmin}
            onLogout={handleLogout}
            userName={user?.name}
          />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="h-full"
              >
                <PageComponent />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <BottomNav activePage={activePage} onNavigate={setActivePage} />

        {/* FAB */}
        <FAB onClick={handleFABClick} />
      </div>
    </ThemeProvider>
  )
}

export default App
