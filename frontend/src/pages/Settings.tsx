import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Sun, Moon, Bell, Shield, MapPin, User, Briefcase,
  IndianRupee, Clock, Bike, Building2, BadgeCheck, Calendar
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { authService } from '../services/auth'
import { getPolicy } from '../services/api'

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const user = authService.getCurrentUser()
  const [policy, setPolicy] = useState<any>(null)

  useEffect(() => {
    if (!user) return
    getPolicy(user.id)
      .then(res => setPolicy(res.data?.policy))
      .catch(() => {})
  }, [user?.id])

  // Derive org from email domain
  const getOrg = (email?: string) => {
    if (!email) return 'Swiggy'
    if (email.includes('zomato')) return 'Zomato'
    if (email.includes('ola')) return 'Ola'
    if (email.includes('uber')) return 'Uber'
    if (email.includes('dunzo')) return 'Dunzo'
    return 'Swiggy'
  }

  const org = getOrg(user?.email)
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'
  const memberSince = 'January 2026'

  const ToggleSwitch = ({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) => (
    <button
      id={id}
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-all duration-300 relative ${checked ? 'bg-indigo-500' : 'bg-gray-600'}`}
    >
      <motion.div
        animate={{ x: checked ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow"
      />
    </button>
  )

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6 max-w-2xl mx-auto">

      {/* ── Profile Card ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25">
            <span className="text-white text-xl font-black">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'Worker'}
            </p>
            <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
              {user?.email || '—'}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {policy && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold">
                  {policy.plan_name} · Active
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold capitalize">
                {user?.role || 'Worker'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Gig Worker Details ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-5 space-y-1">
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Gig Worker Profile
        </p>

        {[
          { icon: BadgeCheck,   label: 'Worker ID',           value: user?.id || '—' },
          { icon: Building2,    label: 'Organisation',         value: org },
          { icon: Briefcase,    label: 'Gig Platform',         value: 'Food & Parcel Delivery' },
          { icon: IndianRupee,  label: 'Weekly Earnings',      value: '₹8,500 – ₹12,000' },
          { icon: Clock,        label: 'Daily Work Hours',     value: '8 – 10 hrs' },
          { icon: Bike,         label: 'Vehicle Type',         value: '2-Wheeler (Motorbike)' },
          { icon: MapPin,       label: 'Delivery Zone',        value: 'Mumbai Central' },
          { icon: Shield,       label: 'Avg Deliveries / Day', value: '22 orders' },
          { icon: Calendar,     label: 'Member Since',         value: memberSince },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between py-2.5 border-b last:border-b-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <Icon size={13} className="text-indigo-400" />
              </div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <span className="text-sm font-semibold text-right max-w-[55%] truncate" style={{ color: 'var(--text-primary)' }}>
              {value}
            </span>
          </div>
        ))}
      </motion.div>

      {/* ── Appearance ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5 space-y-4">
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Appearance</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-yellow-400" />}
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Toggle app theme</p>
            </div>
          </div>
          <ToggleSwitch id="dark-mode-toggle" checked={theme === 'dark'} onChange={toggleTheme} />
        </div>
      </motion.div>

      {/* ── Notifications ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5 space-y-4">
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</p>
        {[
          { label: 'Push Notifications',  sub: 'Receive real-time alerts' },
          { label: 'Risk Alerts',          sub: 'Weather & AQI warnings' },
          { label: 'Claim Updates',        sub: 'Status changes and payouts' },
          { label: 'Weekly Report',        sub: 'Summary every Monday' },
        ].map((item, i) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-indigo-400" />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.sub}</p>
              </div>
            </div>
            <ToggleSwitch id={`notif-toggle-${i}`} checked={i < 3} onChange={() => {}} />
          </div>
        ))}
      </motion.div>

      {/* ── Sign Out ─────────────────────────────────────────────────── */}
      <button
        id="logout-btn"
        className="w-full py-3 rounded-xl text-sm font-semibold text-red-400 border transition-all hover:bg-red-500/10"
        style={{ borderColor: 'rgba(248,113,113,0.3)' }}
        onClick={() => {
          authService.logout()
          window.location.reload()
        }}
      >
        Sign Out
      </button>
    </div>
  )
}

export default Settings
