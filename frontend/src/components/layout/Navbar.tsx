import React from 'react'
import { motion } from 'framer-motion'
import { Bell, Sun, Moon, Search } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Welcome back, Rahul 👋' },
  insurance: { title: 'My Insurance', subtitle: 'Manage your active policies' },
  claims: { title: 'Claims History', subtitle: 'Track all your claims' },
  risk: { title: 'Risk Monitor', subtitle: 'Live environmental tracking' },
  calculator: { title: 'AI Insurance Recommendation', subtitle: 'Personalized plans based on your live risk score' },
  alerts: { title: 'Alerts', subtitle: 'Real-time notifications' },
  reports: { title: 'Reports', subtitle: 'Analytics & insights' },
  settings: { title: 'Settings', subtitle: 'Customize your experience' },
  admin: { title: 'Admin Dashboard', subtitle: 'Platform-wide analytics' },
  fraud: { title: 'Fraud Analysis', subtitle: 'ML-powered fraud detection' },
  payout: { title: 'Payout Simulator', subtitle: 'Simulate instant payouts' },
}

interface NavbarProps {
  activePage: string
  isAdmin: boolean
  onLogout: () => void
  userName?: string
  notifCount?: number
}

const Navbar: React.FC<NavbarProps> = ({ activePage, onLogout, userName, notifCount = 3 }) => {
  const { theme, toggleTheme } = useTheme()
  const page = pageTitles[activePage] || pageTitles.dashboard

  return (
    <header
      className="h-16 flex items-center justify-between px-4 md:px-6 border-b sticky top-0 z-30"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Page Title */}
      <motion.div
        key={activePage}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-base md:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {page.title}
        </h1>
        <p className="text-xs hidden md:block" style={{ color: 'var(--text-secondary)' }}>
          {page.subtitle}
        </p>
      </motion.div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search — desktop only */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--text-secondary)' }}
        >
          <Search size={14} />
          <span className="text-xs">Search...</span>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
        >
          Logout
        </button>

        {/* Notifications */}
        <button
          id="notifications-btn"
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-indigo-500/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Bell size={18} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
              {notifCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <motion.button
          id="theme-toggle-btn"
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-indigo-500/10"
          style={{ color: 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </motion.button>

        {/* Avatar */}
        <div className="flex items-center gap-2 ml-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center cursor-pointer shadow-md shadow-indigo-500/20">
            <span className="text-white text-xs font-bold">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <span className="text-sm font-medium hidden md:block" style={{ color: 'var(--text-primary)' }}>
            {userName}
          </span>
        </div>
      </div>
    </header>
  )
}

export default Navbar
