import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, Users, Shield, AlertTriangle, DollarSign, Activity } from 'lucide-react'

const monthlyData = [
  { month: 'Oct', claims: 42, payouts: 38000, fraudBlocked: 8 },
  { month: 'Nov', claims: 58, payouts: 51000, fraudBlocked: 12 },
  { month: 'Dec', claims: 71, payouts: 64000, fraudBlocked: 15 },
  { month: 'Jan', claims: 49, payouts: 44000, fraudBlocked: 9 },
  { month: 'Feb', claims: 63, payouts: 57000, fraudBlocked: 14 },
  { month: 'Mar', claims: 82, payouts: 74000, fraudBlocked: 19 },
]

const claimsByType = [
  { name: 'Rain', value: 35, color: '#60a5fa' },
  { name: 'Heat', value: 25, color: '#f87171' },
  { name: 'AQI', value: 20, color: '#a78bfa' },
  { name: 'Traffic', value: 15, color: '#fbbf24' },
  { name: 'Outage', value: 5, color: '#fb923c' },
]

const fraudDecisions = [
  { name: 'Approved', value: 67, color: '#34d399' },
  { name: 'Review', value: 21, color: '#fbbf24' },
  { name: 'Rejected', value: 12, color: '#f87171' },
]

const topMetrics = [
  { label: 'Total Claims', value: '365', change: '+18%', icon: Shield, color: '#818cf8' },
  { label: 'Total Payout', value: '₹3.28L', change: '+22%', icon: DollarSign, color: '#34d399' },
  { label: 'Active Workers', value: '1,240', change: '+8%', icon: Users, color: '#60a5fa' },
  { label: 'Fraud Blocked', value: '77', change: '-3%', icon: AlertTriangle, color: '#f87171' },
  { label: 'Loss Ratio', value: '62%', change: '-5%', icon: TrendingUp, color: '#fbbf24' },
  { label: 'Avg. Payout', value: '₹898', change: '+2%', icon: Activity, color: '#fb923c' },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color?: string }[]; label?: string }) => {
  if (active && payload) {
    return (
      <div className="card p-3 text-xs" style={{ border: '1px solid var(--border)' }}>
        <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color || '#818cf8' }}>
            {p.name}: {typeof p.value === 'number' && p.value > 1000 ? `₹${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fraud' | 'trends'>('overview')

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      {/* Admin badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl w-fit"
        style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
      >
        <Shield size={14} className="text-violet-400" />
        <span className="text-xs font-bold text-violet-400">Admin View — Full Platform Analytics</span>
      </motion.div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {topMetrics.map((m, i) => {
          const Icon = m.icon
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card p-4"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${m.color}20` }}>
                <Icon size={14} style={{ color: m.color }} />
              </div>
              <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{m.value}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{m.label}</p>
              <p className={`text-[10px] font-semibold mt-0.5 ${m.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                {m.change}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['overview', 'fraud', 'trends'] as const).map((tab) => (
          <button
            key={tab}
            id={`admin-tab-${tab}`}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'hover:bg-indigo-500/10'
            }`}
            style={activeTab !== tab ? { color: 'var(--text-secondary)', border: '1px solid var(--border)' } : {}}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Monthly claims bar chart */}
            <div className="card p-5">
              <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Monthly Claims</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="claims" radius={6} fill="url(#claimsGrad)" />
                    <Bar dataKey="fraudBlocked" radius={6} fill="#f87171" opacity={0.7} />
                    <Legend formatter={(v) => v === 'claims' ? 'Claims' : 'Fraud'} wrapperStyle={{ fontSize: 11 }} />
                    <defs>
                      <linearGradient id="claimsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Claims distribution pie */}
            <div className="card p-5">
              <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Claims by Event Type</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={claimsByType} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3}>
                      {claimsByType.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    <Legend formatter={(v) => v} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'fraud' && (
          <motion.div
            key="fraud"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Fraud decisions donut */}
            <div className="card p-5">
              <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Fraud Decisions</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fraudDecisions} dataKey="value" cx="50%" cy="50%" outerRadius={85} innerRadius={55} paddingAngle={4}>
                      {fraudDecisions.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fraud stats */}
            <div className="card p-5 space-y-4">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Fraud Model Stats</p>
              {[
                { label: 'Model Accuracy', value: '94.2%', color: '#34d399' },
                { label: 'False Positive Rate', value: '3.1%', color: '#fbbf24' },
                { label: 'Claims Auto-Approved', value: '67%', color: '#818cf8' },
                { label: 'Claims in Review', value: '21%', color: '#60a5fa' },
                { label: 'Claims Rejected', value: '12%', color: '#f87171' },
                { label: 'Avg. Score Processing', value: '142ms', color: '#fb923c' },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
                  <span className="text-sm font-bold" style={{ color: stat.color }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'trends' && (
          <motion.div
            key="trends"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card p-5"
          >
            <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Payout Trend (₹)</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="payouts" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminDashboard
