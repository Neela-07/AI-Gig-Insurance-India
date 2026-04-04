import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Bell, Shield, MapPin, User } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  const ToggleSwitch = ({
    checked, onChange, id
  }: {
    checked: boolean; onChange: () => void; id: string
  }) => (
    <button
      id={id}
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
        checked ? 'bg-indigo-500' : 'bg-gray-600'
      }`}
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
      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 flex items-center gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <User size={28} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Rahul Sharma</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>rahul.sharma@gmail.com</p>
          <p className="text-xs mt-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 w-fit">
            Gold Plan — Active
          </p>
        </div>
        <button className="btn-secondary text-xs px-3 py-2">Edit</button>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-5 space-y-4"
      >
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Appearance</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon size={18} className="text-indigo-400" />
            ) : (
              <Sun size={18} className="text-yellow-400" />
            )}
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Toggle app theme
              </p>
            </div>
          </div>
          <ToggleSwitch
            id="dark-mode-toggle"
            checked={theme === 'dark'}
            onChange={toggleTheme}
          />
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card p-5 space-y-4"
      >
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</p>
        {[
          { label: 'Push Notifications', sub: 'Receive real-time alerts' },
          { label: 'Risk Alerts', sub: 'Weather & AQI warnings' },
          { label: 'Claim Updates', sub: 'Status changes and payouts' },
          { label: 'Weekly Report', sub: 'Summary every Monday' },
        ].map((item, i) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-indigo-400" />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.sub}</p>
              </div>
            </div>
            <ToggleSwitch
              id={`notif-toggle-${i}`}
              checked={i < 3}
              onChange={() => {}}
            />
          </div>
        ))}
      </motion.div>

      {/* Account info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card p-5 space-y-3"
      >
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Account Info</p>
        {[
          { icon: MapPin, label: 'Delivery Zone', value: 'Mumbai Central' },
          { icon: Shield, label: 'Worker ID', value: 'WRK-8821' },
          { icon: User, label: 'Member Since', value: 'January 2026' },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <Icon size={15} className="text-indigo-400" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}
      </motion.div>

      <button
        id="logout-btn"
        className="w-full py-3 rounded-xl text-sm font-semibold text-red-400 border transition-all hover:bg-red-500/10"
        style={{ borderColor: 'rgba(248,113,113,0.3)' }}
      >
        Sign Out
      </button>
    </div>
  )
}

export default Settings
