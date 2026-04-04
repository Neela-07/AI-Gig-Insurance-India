import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Shield, FileText, Activity, Sparkles,
  Bell, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  Zap, User
} from 'lucide-react'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  badge?: number
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'insurance', label: 'My Insurance', icon: Shield },
  { id: 'claims', label: 'Claims', icon: FileText, badge: 2 },
  { id: 'risk', label: 'Risk Monitor', icon: Activity },
  { id: 'calculator', label: 'Recommend', icon: Sparkles },
  { id: 'alerts', label: 'Alerts', icon: Bell, badge: 3 },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  isAdmin: boolean
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isAdmin }) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden md:flex flex-col h-screen sticky top-0 border-r overflow-hidden"
      style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 h-16 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-glow">
          <Zap size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-bold text-sm gradient-text">SmartShield</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>AI Insurance</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activePage === item.id
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(item.id)}
              className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon size={18} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-2 pb-1">
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-semibold tracking-widest uppercase px-4"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Admin
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('admin')}
              className={`sidebar-item w-full ${activePage === 'admin' ? 'active' : ''}`}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <BarChart3 size={18} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Admin Panel
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate('fraud')}
              className={`sidebar-item w-full ${activePage === 'fraud' ? 'active' : ''}`}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <Shield size={18} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Fraud Analysis
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </>
        )}
      </nav>

      {/* User Card */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div
          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-indigo-500/10 transition-all"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>Rahul Sharma</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>Gold Plan • Active</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="hover:opacity-100 transition-opacity"
              >
                <LogOut size={14} style={{ color: 'var(--text-secondary)' }} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full mt-2 flex items-center justify-center p-2 rounded-xl hover:bg-indigo-500/10 transition-all"
          style={{ color: 'var(--text-secondary)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </motion.aside>
  )
}

export default Sidebar
