import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Shield, AlertTriangle, CloudRain,
  Thermometer, Wind, Star, Zap, ArrowUpRight
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import InsuranceCard from '../components/ui/InsuranceCard'
import RiskScoreChart from '../components/ui/RiskScoreChart'
import WorkflowPipeline from '../components/ui/WorkflowPipeline'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import { getClaims, getPolicy } from '../services/api'
import { authService } from '../services/auth'

const earningsData = [
  { day: 'Mon', earnings: 820, protected: 820 },
  { day: 'Tue', earnings: 940, protected: 940 },
  { day: 'Wed', earnings: 350, protected: 900 },
  { day: 'Thu', earnings: 1100, protected: 1100 },
  { day: 'Fri', earnings: 680, protected: 900 },
  { day: 'Sat', earnings: 1240, protected: 1240 },
  { day: 'Sun', earnings: 490, protected: 900 },
]

const alerts = [
  { id: 1, type: 'rain', icon: CloudRain, color: '#60a5fa', label: 'Heavy Rain Alert', value: '47mm', status: 'triggered' },
  { id: 2, type: 'heat', icon: Thermometer, color: '#f87171', label: 'Heatwave Warning', value: '43°C', status: 'triggered' },
  { id: 3, type: 'aqi', icon: Wind, color: '#a78bfa', label: 'Air Quality Alert', value: 'AQI 287', status: 'safe' },
]


const WorkerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalClaims: '₹0',
    thisMonth: '₹0',
    savingsRate: '94%',
    riskEvents: '0'
  })
  const [policy, setPolicy] = useState<any>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const user = authService.getCurrentUser()
        if (!user) return
        
        // 1. Fetch Claims Stats
        const claimsRes = await getClaims(user.id)
        const claims = claimsRes.data.claims || []
        const approved = claims.filter((c: any) => c.status === 'credited' || c.status === 'approved')
        const total = approved.reduce((acc: number, cur: any) => acc + (cur.payout_amount || 0), 0)
        
        // 2. Fetch Policy
        const policyRes = await getPolicy(user.id)
        setPolicy(policyRes.data.policy)
        
        setStats({
          totalClaims: `₹${total.toLocaleString()}`,
          thisMonth: `₹${total.toLocaleString()}`,
          savingsRate: '96%',
          riskEvents: claims.length.toString()
        })
      } catch (e) {
        console.error('Failed to fetch dashboard data', e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])

  const dynamicMetrics = [
    { label: 'Total Claims', value: stats.totalClaims, change: '+18%', up: true, icon: Shield, color: '#6366f1' },
    { label: 'This Month', value: stats.thisMonth, change: '+5%', up: true, icon: TrendingUp, color: '#34d399' },
    { label: 'Savings Rate', value: stats.savingsRate, change: '+2%', up: true, icon: Star, color: '#fbbf24' },
    { label: 'Risk Events', value: stats.riskEvents, change: '-3', up: false, icon: AlertTriangle, color: '#f87171' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : dynamicMetrics.map((m, i) => {
              const Icon = m.icon
              return (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="card p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${m.color}20` }}
                    >
                      <Icon size={16} style={{ color: m.color }} />
                    </div>
                    <span
                      className={`text-xs font-semibold flex items-center gap-0.5 ${
                        m.up ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {m.change}
                    </span>
                  </div>
                  <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                    {m.value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {m.label}
                  </p>
                </motion.div>
              )
            })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col — insurance card + risk score */}
        <div className="space-y-4">
          <InsuranceCard
            planName={policy?.plan_name || 'No Active Plan'}
            coverageAmount={`₹${(policy?.coverage_amount || 0).toLocaleString()}`}
            premium={policy ? `₹${policy.premium_amount}/wk` : '—'}
            validUntil={policy ? new Date(policy.end_date).toLocaleDateString() : 'N/A'}
            workerId={authService.getCurrentUser()?.id || 'WRK-8821'}
            status={policy?.status || 'inactive'}
          />

          {/* Risk score card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Risk Score
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Updated 2 min ago
                </p>
              </div>
              <span className="status-warning">Medium</span>
            </div>
            <div className="flex items-center justify-center">
              <RiskScoreChart score={58} size={150} />
            </div>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
              Based on zone risk, claim history & work pattern
            </p>
          </motion.div>
        </div>

        {/* Middle col — earnings chart */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Earnings Protection
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  This week — actual vs. protected
                </p>
              </div>
              <button className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                View All <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsData}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="protectedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                  <Tooltip
                    formatter={(value: any, name: any) => [`₹${value}`, name === 'earnings' ? 'Actual' : 'Protected']}
                    contentStyle={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="protected" stroke="#34d399" strokeWidth={2} fill="url(#protectedGrad)" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="earnings" stroke="#6366f1" strokeWidth={2} fill="url(#earningsGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Workflow pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Claim Pipeline
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Last claim — WRK-8821 • In fraud check
                </p>
              </div>
              <span className="badge bg-indigo-500/20 text-indigo-400" style={{ border: '1px solid rgba(99,102,241,0.3)' }}>
                <Zap size={10} className="mr-1" /> Live
              </span>
            </div>
            <WorkflowPipeline currentStep={3} />
          </motion.div>

          {/* Live Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="card p-5"
          >
            <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Live Alerts
            </p>
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = alert.icon
                return (
                  <div key={alert.id} className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${alert.color}15` }}
                    >
                      <Icon size={16} style={{ color: alert.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {alert.label}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {alert.value}
                      </p>
                    </div>
                    <span className={alert.status === 'triggered' ? 'status-triggered' : 'status-safe'}>
                      {alert.status === 'triggered' ? 'Triggered' : 'Safe'}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default WorkerDashboard
